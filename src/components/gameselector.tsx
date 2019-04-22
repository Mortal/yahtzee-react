import * as React from "react";
import { observable, computed, autorun } from "mobx";
import { observer } from "mobx-react";
import { app } from "../app";
import {
  onSnapshot,
  applySnapshot,
  onPatch,
  onAction,
  applyAction,
  applyPatch,
  getSnapshot
} from "mobx-state-tree";

const getLocalDomStateElement = () =>
  document.getElementById("state") as HTMLInputElement;

class StateSync {
  @observable
  error: string | null = null;
  @observable
  games: { id: string; name: string }[] = [];
  @observable
  creating = false;

  syncing = false;

  confirmedSnapshot: any = null;
  confirmedVersion: number = 0;

  pendingPatches: any[] = [];
  pendingActions: any[] = [];
  pendingPatch: XMLHttpRequest | null = null;
  pendingWait: XMLHttpRequest | null = null;

  @computed
  get local() {
    return app.uiState.gameId === undefined || app.uiState.gameId === "local";
  }

  initiateWait() {
    if (this.local) return;
    if (this.pendingWait || this.pendingPatch) return;

    const url = "/games/wait/";
    const httpRequest = (this.pendingWait = new XMLHttpRequest());
    httpRequest.onreadystatechange = () => {
      if (this.pendingWait !== httpRequest) return;
      if (httpRequest.readyState !== XMLHttpRequest.DONE) return;
      this.pendingWait = null;
      if (httpRequest.status !== 200) {
        this.error = "Wait: HTTP " + httpRequest.status;
        return;
      }
      let data;
      try {
        data = JSON.parse(httpRequest.responseText) as {
          version?: number;
          patches?: any[];
        };
      } catch (e) {
        this.error = "JSON.parse: " + e;
        return;
      }
      const { version, patches } = data;
      if (version === undefined || patches === undefined) {
        this.error = "Missing version or patches";
        return;
      }

      this.syncing = true;
      applyPatch(app.state, patches);
      this.confirmedSnapshot = getSnapshot(app.state);
      this.confirmedVersion = version;
      this.syncing = false;

      this.initiateWait();
    };
    httpRequest.open("POST", url);
    httpRequest.setRequestHeader(
      "Content-Type",
      "application/json; charset=utf-8"
    );
    httpRequest.send(
      JSON.stringify({
        game: app.uiState.gameId,
        version: this.confirmedVersion
      })
    );
  }

  initiatePatch() {
    if (this.local) return;
    if (this.pendingPatch) return;
    if (this.pendingWait) {
      const httpRequest = this.pendingWait;
      this.pendingWait = null;
      httpRequest.abort();
    }

    const url = "/games/patch/";
    const httpRequest = (this.pendingPatch = new XMLHttpRequest());
    httpRequest.onreadystatechange = () => {
      if (this.pendingPatch !== httpRequest) return;
      if (httpRequest.readyState !== XMLHttpRequest.DONE) return;
      this.pendingPatch = null;
      if (httpRequest.status !== 200) {
        this.error = "Patch: HTTP " + httpRequest.status;
        return;
      }
      let data;
      try {
        data = JSON.parse(httpRequest.responseText) as {
          version?: number;
          patches?: any[];
        };
      } catch (e) {
        this.error = "JSON.parse: " + e;
        return;
      }
      const { version, patches } = data;
      if (version === undefined) {
        this.error = "Missing version";
        return;
      }

      const actions = this.pendingActions.splice(0, this.pendingActions.length);
      this.pendingPatches.splice(0, this.pendingPatches.length);

      if (patches === undefined) {
        // All good
        this.confirmedSnapshot = getSnapshot(app.state);
        this.confirmedVersion = version;
        this.initiateWait();
        return;
      }

      this.syncing = true;
      applyPatch(app.state, patches);
      this.confirmedSnapshot = getSnapshot(app.state);
      this.confirmedVersion = version;
      this.syncing = false;

      for (const action of actions) {
        applyAction(app.state, action);
      }
      this.initiateWait();
    };
    httpRequest.open("POST", url);
    httpRequest.setRequestHeader(
      "Content-Type",
      "application/json; charset=utf-8"
    );
    httpRequest.send(
      JSON.stringify({
        game: app.uiState.gameId,
        version: this.confirmedVersion,
        patches: this.pendingPatches
      })
    );
  }

  init() {
    if (getLocalDomStateElement().value) {
      const { state, uiState } = JSON.parse(
        getLocalDomStateElement().value
      ) as { state: any; uiState: any };
      if (uiState) app.uiState = uiState;
      if (state && this.local) applySnapshot(app.state, state);
    }
    getLocalDomStateElement().value = JSON.stringify({
      state: {},
      uiState: app.uiState
    });

    onSnapshot(app.state, snapshot => {
      if (this.syncing) return;
      if (!this.local) return;
      const { uiState } = JSON.parse(getLocalDomStateElement().value) as {
        uiState: any;
      };
      getLocalDomStateElement().value = JSON.stringify({
        state: snapshot,
        uiState: uiState
      });
    });
    autorun(() => {
      const { state } = JSON.parse(getLocalDomStateElement().value) as {
        state: any;
      };
      getLocalDomStateElement().value = JSON.stringify({
        state: state,
        uiState: app.uiState
      });
    });

    onPatch(app.state, patch => {
      console.log("Patch", this.syncing, this.local, patch);
      if (this.syncing) return;
      if (this.local) return;
      this.pendingPatches.push(patch);
      if (this.pendingPatches.length === 1) {
        setTimeout(() => this.initiatePatch(), 0);
      }
    });

    onAction(app.state, action => {
      if (this.syncing) return;
      if (this.local) return;
      this.pendingActions.push(action);
    });

    this.fetchGames();

    let gameId: string | undefined = undefined;
    autorun(() => {
      if (app.uiState.gameId === gameId) return;
      gameId = app.uiState.gameId;
      if (this.local) {
        const { state } = JSON.parse(getLocalDomStateElement().value) as {
          state: any;
        };
        this.syncing = true;
        if (state) applySnapshot(app.state, state);
        this.syncing = false;
        return;
      }

      if (this.pendingWait) {
        const httpRequest = this.pendingWait;
        this.pendingWait = null;
        httpRequest.abort();
      }
      if (this.pendingPatch) {
        const httpRequest = this.pendingPatch;
        this.pendingPatch = null;
        httpRequest.abort();
      }

      this.confirmedSnapshot = {};
      this.confirmedVersion = 0;
      this.syncing = true;
      applySnapshot(app.state, this.confirmedSnapshot);
      this.syncing = false;
      this.initiateWait();
    });
  }

  fetchGames() {
    const url = "/games/";
    this.error = null;
    const httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = () => {
      if (httpRequest.readyState !== XMLHttpRequest.DONE) return;
      if (httpRequest.status !== 200) {
        this.error = "Fetch: HTTP " + httpRequest.status;
        this.games = [{ id: "foo", name: "foo" }];
        return;
      }
      const data = JSON.parse(httpRequest.responseText) as {
        games?: { id: string; name: string }[];
        error?: string;
      };
      if (data.error) {
        this.error = data.error;
        return;
      }
      if (!data.games) {
        this.error = "No games in response";
        return;
      }
      this.games = data.games;
    };
    httpRequest.open("GET", url);
    httpRequest.send();
  }

  createGame() {
    this.creating = true;
    this.error = null;
    const url = "/games/new/";
    const httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = () => {
      if (httpRequest.readyState !== XMLHttpRequest.DONE) return;
      this.creating = false;
      if (httpRequest.status !== 200) {
        this.error = "Create: HTTP " + httpRequest.status;
        return;
      }
      const data = JSON.parse(httpRequest.responseText) as {
        game?: { id: string; name: string };
        error?: string;
      };
      if (data.error) {
        this.error = data.error;
        return;
      }
      if (!data.game) {
        this.error = "No game in response";
        return;
      }
      this.games.push(data.game);
      console.log("Set gameId to", data.game.id);
      app.uiState.gameId = data.game.id;
    };
    httpRequest.open("POST", url);
    httpRequest.send();
  }
}

export const stateSync = new StateSync();

interface Props {}

interface State {}

@observer
export class StateSelect extends React.Component<Props, State> {
  state = {};

  render() {
    if (stateSync.creating) {
      return (
        <select disabled={true}>
          <option>Creating...</option>
        </select>
      );
    }
    const choices = [
      <option key="local" value="local">
        {app.t("localgame")}
      </option>
    ];
    for (const { id, name } of stateSync.games) {
      choices.push(
        <option key={id} value={id}>
          {name}
        </option>
      );
    }
    choices.push(
      <option key="new" value="new">
        {app.t("newgame")}
      </option>
    );
    if (stateSync.error) {
      choices.push(<option key="error">{stateSync.error}</option>);
    }
    const onChange = (value: string) => {
      if (value === undefined) return;
      if (value === "new") {
        stateSync.createGame();
        return;
      }
      app.uiState.gameId = value;
    };
    return (
      <select
        value={app.uiState.gameId || "local"}
        onChange={e => onChange(e.target.value)}
      >
        {choices}
      </select>
    );
  }
}
