import * as React from "react";
import * as ReactDOM from "react-dom";
import { observable, action, autorun } from "mobx";
import { observer } from "mobx-react";
import styles from "./index.scss";
import menu_styles from "./menu.scss";
import { DirtyInput } from "./components/dirtyinput";
import { Dice } from "./components/dice";
import { ManualDice } from "./components/manualdice";
import { compute_scoring, COMBINATION_NAME } from "./scoring";
import { Hint } from "./components/hint";
import { PlayerState, AppState } from "./state";
import { classNames } from "./util";

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
        <div className={styles.rowname}>Navn</div>
        <div className={styles.row1}>{COMBINATION_NAME["1"]}</div>
        <div className={styles.row2}>{COMBINATION_NAME["2"]}</div>
        <div className={styles.row3}>{COMBINATION_NAME["3"]}</div>
        <div className={styles.row4}>{COMBINATION_NAME["4"]}</div>
        <div className={styles.row5}>{COMBINATION_NAME["5"]}</div>
        <div className={styles.row6}>{COMBINATION_NAME["6"]}</div>
        <div className={styles.rowsum}>Sum</div>
        <div className={styles.rowbonus}>Bonus ved 84 eller flere</div>
        <div className={styles.rowP}>{COMBINATION_NAME.P}</div>
        <div className={styles.rowD}>{COMBINATION_NAME.D}</div>
        <div className={styles.rowT}>{COMBINATION_NAME.T}</div>
        <div className={styles.rowV}>{COMBINATION_NAME.V}</div>
        <div className={styles.rowQ}>{COMBINATION_NAME.Q}</div>
        <div className={styles.rowW}>{COMBINATION_NAME.W}</div>
        <div className={styles.rows}>{COMBINATION_NAME.s}</div>
        <div className={styles.rowS}>{COMBINATION_NAME.S}</div>
        <div className={styles.rowC}>{COMBINATION_NAME.C}</div>
        <div className={styles.rowH}>{COMBINATION_NAME.H}</div>
        <div className={styles.rowchance}>{COMBINATION_NAME["?"]}</div>
        <div className={styles.rowyahtzee}>{COMBINATION_NAME["!"]}</div>
        <div className={styles.rowtotal}>Sum</div>
      </div>
    );

    const rowStyles = {
      sides: [
        styles.row1,
        styles.row2,
        styles.row3,
        styles.row4,
        styles.row5,
        styles.row6,
      ],
      combinations: [
        styles.rowP,
        styles.rowD,
        styles.rowT,
        styles.rowV,
        styles.rowQ,
        styles.rowW,
        styles.rows,
        styles.rowS,
        styles.rowC,
        styles.rowH,
        styles.rowchance,
        styles.rowyahtzee,
      ],
    };

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
            <div className={rowStyles[group][j] + " " + styles.Editing} key={group + j}>
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
              className={classNames({[styles.Action]: true, [rowStyles[group][j]]: true})}
              onClick={() =>
                app.pickAction(player, group, j, scoring[group][j])
              }
            >
              {display(scoring[group][j], "action")}
            </div>
          );
        return <div className={rowStyles[group][j]} key={group + j}>{display(c, "score")}</div>;
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
        <div className={styles.rowname}>
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
              />
              <span>{player.name || (i < 26 ? String.fromCharCode(65 + i) : "")}</span>
            </label>
          )}
        </div>
        {displayGroup(player, app.turn === i, "sides")}
        <div className={styles.rowsum}>{displaySideSum(player)}</div>
        <div className={styles.rowbonus}>{playerSideBonus(player)}</div>
        {displayGroup(player, app.turn === i, "combinations")}
        <div className={styles.rowtotal}>{playerSum(player)}</div>
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
      <div className={menu_styles.Menu + " " + styles.Menu}>
        <div className={menu_styles.PlayerCount}>
          {"Spillere: "}
          <DirtyInput
            className={menu_styles.PlayerCountInput}
            type="number"
            value={app.players.length}
            onChange={(v: number | null) => {
              if (v !== null) app.setPlayerCount(v);
            }}
          />
        </div>
        <div className={menu_styles.Editing}>
          <label>
            <input
              type="checkbox"
              checked={!!app.state.editing}
              onChange={e => (app.state.editing = !!e.target.checked)}
            />
            {" Rediger"}
          </label>
        </div>
        <div className={menu_styles.ManualDice}>
          <label>
            <input
              type="checkbox"
              checked={!app.state.manualDice}
              onChange={e => (app.state.manualDice = !e.target.checked)}
            />
            {" Digitale terninger"}
          </label>
        </div>
        <div className={menu_styles.Hints}>
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
      <div className={styles.App}>
        {menu}
        <div className={styles.Dice}>
          {dice}
        </div>
        {hints}
        <div className={styles.ScoreTable}>
          {header}
          {players}
        </div>
      </div>
    );
  }
}

ReactDOM.render(<AppComponent />, document.getElementById("root"));
