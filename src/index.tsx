import * as React from "react";
import * as ReactDOM from "react-dom";
import { observable, action, autorun } from "mobx";
import { observer } from "mobx-react";
import styles from "./index.scss";
import menu_styles from "./menu.scss";
import { DirtyInput } from "./components/dirtyinput";
import { Dice } from "./components/dice";
import { ManualDice } from "./components/manualdice";
import { compute_scoring } from "./scoring";
import { Hint } from "./components/hint";
import { PlayerState, AppState } from "./state";
import { classNames } from "./util";
import { i18n } from "./i18n";

class App {
  @observable
  state: AppState = {};

  t(key: string): string {
    const v = i18n[this.state.lang || "en"][key];
    if (v === undefined) {
      console.log("Missing i18n", this.state.lang, key);
      return key;
    }
    return v;
  }

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

export const app = new App();

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
    if (!app.state.lang) app.state.lang = "en";
  }

  render() {
    const header = (
      <div className={styles.ScoreHeader}>
        <div className={styles.rowname}>{app.t("playername")}</div>
        <div className={styles.row1}>{app.t("comb1")}</div>
        <div className={styles.row2}>{app.t("comb2")}</div>
        <div className={styles.row3}>{app.t("comb3")}</div>
        <div className={styles.row4}>{app.t("comb4")}</div>
        <div className={styles.row5}>{app.t("comb5")}</div>
        <div className={styles.row6}>{app.t("comb6")}</div>
        <div className={styles.rowsum}>{app.t("rowsum")}</div>
        <div className={styles.rowbonus}>{app.t("rowbonus")}</div>
        <div className={styles.rowP}>{app.t("combP")}</div>
        <div className={styles.rowD}>{app.t("combD")}</div>
        <div className={styles.rowT}>{app.t("combT")}</div>
        <div className={styles.rowV}>{app.t("combV")}</div>
        <div className={styles.rowQ}>{app.t("combQ")}</div>
        <div className={styles.rowW}>{app.t("combW")}</div>
        <div className={styles.rows}>{app.t("combs")}</div>
        <div className={styles.rowS}>{app.t("combS")}</div>
        <div className={styles.rowC}>{app.t("combC")}</div>
        <div className={styles.rowH}>{app.t("combH")}</div>
        <div className={styles.rowchance}>{app.t("comb?")}</div>
        <div className={styles.rowyahtzee}>{app.t("comb!")}</div>
        <div className={styles.rowtotal}>{app.t("rowtotal")}</div>
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

    const playerSideSum = (player: PlayerState) => {
      let v = 0;
      for (let j = 0; j < player.sides.length; ++j) {
        const c = player.sides[j];
        if (c === null) continue;
        v += c - 4 * (j + 1);
      }
      return v;
    };

    const displaySideSum = (player: PlayerState) => {
      const v = playerSideSum(player);
      return !v ? "—" : v > 0 ? "+" + v : v.toString().replace("-", "−");
    };

    const playerSideBonus = (player: PlayerState) =>
      playerGroupSum(player.sides) >= 84 ? 50 : 0;

    const displayTotal = (player: PlayerState) => {
      const v = playerSideSum(player) +
        playerSideBonus(player) +
        playerGroupSum(player.combinations);
      return v.toString().replace("-", "−");
    };

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
        <div className={styles.rowtotal}>{displayTotal(player)}</div>
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
          {app.t("playercount")}
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
            {app.t("editing")}
          </label>
        </div>
        <div className={menu_styles.ManualDice}>
          <label>
            <input
              type="checkbox"
              checked={!app.state.manualDice}
              onChange={e => (app.state.manualDice = !e.target.checked)}
            />
            {app.t("non_manual_dice")}
          </label>
        </div>
        <div className={menu_styles.Hints}>
          <label>
            <input
              type="checkbox"
              checked={!!app.state.hints}
              onChange={e => (app.state.hints = !!e.target.checked)}
            />
            {app.t("hints")}
          </label>
        </div>
        <div className={menu_styles.Language}>
          <label>
            <input
              type="radio"
              checked={app.state.lang === "da"}
              onChange={() => app.state.lang = "da"}
            />
            {app.t("lang_da")}
          </label>
          <label>
            <input
              type="radio"
              checked={app.state.lang === "en"}
              onChange={() => app.state.lang = "en"}
            />
            {app.t("lang_en")}
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
