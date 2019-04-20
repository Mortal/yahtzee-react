import * as React from "react";
import * as ReactDOM from "react-dom";
import { observable, action, autorun } from "mobx";
import { observer } from "mobx-react";
import styles from "./index.scss";
import { DirtyInput } from "./components/dirtyinput";
import { Dice } from "./components/dice";
import { ManualDice } from "./components/manualdice";
import { compute_scoring } from "./scoring";
import { Hint } from "./components/hint";
import { PlayerState, AppState } from "./state";

class App {
  @observable
  state: AppState = {};

  get players() {
    if (this.state.players === undefined) {
      return [];
    }
    return this.state.players.slice(0, this.state.playerCount || 0);
  }

  get currentRoll() {
    if (this.state.currentRoll === undefined)
      this.state.currentRoll = [null, null, null, null, null, null];
    return this.state.currentRoll;
  }

  setCurrentRoll(v: (number | null)[]) {
    this.state.currentRoll = v;
    if (!v.some(x => x === null))
      this.state.currentRollCount = (this.state.currentRollCount || 0) + 1;
  }

  get turn() {
    if (this.state.turn === undefined || this.state.turn >= this.players.length)
      return 0;
    return this.state.turn;
  }

  @action
  advanceTurn() {
    const dice = this.currentRoll;
    for (let i = 0; i < dice.length; ++i) dice[i] = null;
    this.state.currentRoll = dice;
    this.state.turn = (this.turn + 1) % this.players.length;
    this.state.currentRollCount = 0;
  }

  @action
  setPlayerCount(i: number) {
    const players = this.state.players || [];
    this.state.playerCount = i;
    while (players.length < i) {
      const sides = [];
      for (let j = 0; j < 6; ++j) sides.push(null);
      const combinations = [];
      for (let j = 0; j < 12; ++j) combinations.push(null);
      players.push({ name: "", sides, combinations });
    }
    this.state.players = players;
    this.state.turn = this.turn;
  }

  @action
  pickAction(
    player: PlayerState,
    group: "sides" | "combinations",
    row: number,
    score: number
  ) {
    player[group][row] = score;
    this.advanceTurn();
  }
}

const app = new App();

const getStateElement = () =>
  document.getElementById("state") as HTMLInputElement;
app.state = JSON.parse(getStateElement().value || "{}") || {};
autorun(() => (getStateElement().value = JSON.stringify(app.state)));

@observer
class AppComponent extends React.Component<{}, {}> {
  componentDidMount() {
    if (app.players.length === 0) {
      app.setPlayerCount(1);
    }
  }

  render() {
    const header = (
      <div className={styles.ScoreHeader}>
        <div>Navn</div>
        <div>Enere</div>
        <div>Toere</div>
        <div>Treere</div>
        <div>Firere</div>
        <div>Femmere</div>
        <div>Seksere</div>
        <div>Sum</div>
        <div>Bonus ved 84 eller flere</div>
        <div>1 par</div>
        <div>2 par</div>
        <div>3 par</div>
        <div>3 ens</div>
        <div>4 ens</div>
        <div>2 x 3 ens</div>
        <div>Lav 1-2-3-4-5</div>
        <div>Høj 2-3-4-5-6</div>
        <div>Cameron 1-2-3-4-5-6</div>
        <div>Fuldt hus 3 + 2 ens</div>
        <div>Chance</div>
        <div>Super-yatzy</div>
        <div>Sum</div>
      </div>
    );

    const roll = [];
    for (const v of app.state.currentRoll || []) if (v !== null) roll.push(v);
    const scoring = compute_scoring(roll);

    const displayGroup = (
      player: PlayerState,
      hasTurn: boolean,
      group: "sides" | "combinations"
    ) =>
      player[group].map((c, j) => {
        if (app.state.editing)
          return (
            <div key={group + j}>
              <DirtyInput
                type="number"
                value={c}
                onChange={(c: number | null) => (player[group][j] = c)}
              />
            </div>
          );

        const display = (v: number | null, mode: "action" | "score") => {
          if (v === null) return "";
          if (group === "sides") {
            v -= 4 * (j + 1);
            return !v ? "—" : v > 0 ? "+" + v : v.toString().replace("-", "−");
          }
          return v ? v.toString() : mode === "action" ? "" : "—";
        };
        if (c === null && hasTurn && scoring)
          return (
            <div
              key={group + j}
              className={styles.Action}
              onClick={() =>
                app.pickAction(player, group, j, scoring[group][j])
              }
            >
              {display(scoring[group][j], "action")}
            </div>
          );
        return <div key={group + j}>{display(c, "score")}</div>;
      });

    const playerGroupSum = (group: (number | null)[]) => {
      let s = 0;
      for (const v of group) {
        s += v || 0;
      }
      return s;
    };

    const playerSideSum = (player: PlayerState) => playerGroupSum(player.sides);

    const displaySideSum = (player: PlayerState) => {
      let v = 0;
      for (let j = 0; j < player.sides.length; ++j) {
        const c = player.sides[j];
        if (c === null) continue;
        v += c - 4 * (j + 1);
      }
      return !v ? "—" : v > 0 ? "+" + v : v.toString().replace("-", "−");
    };

    const playerSideBonus = (player: PlayerState) =>
      playerSideSum(player) >= 84 ? 50 : 0;

    const playerSum = (player: PlayerState) =>
      playerSideSum(player) +
      playerSideBonus(player) +
      playerGroupSum(player.combinations);

    const players = app.players.map((player, i) => (
      <div key={i} className={styles.ScoreColumn}>
        <div>
          {app.state.editing ? (
            <input
              value={player.name || ""}
              onChange={e => (player.name = e.target.value)}
            />
          ) : (
            <label>
              <input
                type="radio"
                checked={app.turn === i}
                onChange={() => (app.state.turn = i)}
              />{" "}
              {player.name}
            </label>
          )}
        </div>
        {displayGroup(player, app.turn === i, "sides")}
        <div>{displaySideSum(player)}</div>
        <div>{playerSideBonus(player)}</div>
        {displayGroup(player, app.turn === i, "combinations")}
        <div>{playerSum(player)}</div>
      </div>
    ));

    const dice = app.state.manualDice ? (
      <ManualDice
        value={app.currentRoll}
        onChange={v => app.setCurrentRoll(v)}
      />
    ) : (
      <Dice
        value={app.currentRoll}
        onChange={v => app.setCurrentRoll(v)}
        allowReroll={true}
      />
    );

    const menu = (
      <div className={styles.Menu}>
        <div>
          {"Spillere: "}
          <DirtyInput
            className={styles.PlayerCount}
            type="number"
            value={app.players.length}
            onChange={(v: number | null) => {
              if (v !== null) app.setPlayerCount(v);
            }}
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={!!app.state.editing}
              onChange={e => (app.state.editing = !!e.target.checked)}
            />
            {" Rediger"}
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={!app.state.manualDice}
              onChange={e => (app.state.manualDice = !e.target.checked)}
            />
            {" Digitale terninger"}
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={!!app.state.hints}
              onChange={e => (app.state.hints = !!e.target.checked)}
            />
            {" Hints"}
          </label>
        </div>
      </div>
    );

    const hints = app.state.hints ? (
      <Hint
        className={styles.Hint}
        currentRoll={app.state.currentRoll || []}
        currentRollCount={app.state.currentRollCount || 0}
        player={(app.state.players || [])[app.turn]}
      />
    ) : null;

    return (
      <>
        {menu}
        <div>
          {dice}
          {hints}
        </div>
        <div className={styles.ScoreTable}>
          {header}
          {players}
        </div>
      </>
    );
  }
}

ReactDOM.render(<AppComponent />, document.getElementById("root"));
