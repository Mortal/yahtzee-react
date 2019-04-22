import { observable, action } from "mobx";
import { AppState, UiState } from "./state";
import { i18n } from "./i18n";

class App {
  @observable
  state: typeof AppState.Type = AppState.create({});
  @observable
  uiState: UiState = {};

  t(key: string): string {
    const v = i18n[this.uiState.lang || "en"][key];
    if (v === undefined) {
      console.log("Missing i18n", this.uiState.lang, key);
      return key;
    }
    return v;
  }

  get players() {
    return this.state.players.slice(0, this.state.playerCount || 0);
  }

  get currentRoll() {
    return this.state.currentRoll;
  }

  @action
  setCurrentRoll(v: (number | null)[]) {
    this.state.setCurrentRoll(v);
    if (!v.some(x => x === null)) this.state.incrementRollCount();
  }
}

export const app = new App();
