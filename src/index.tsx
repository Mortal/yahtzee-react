import * as React from "react";
import * as ReactDOM from "react-dom";
import { observer } from "mobx-react";
import styles from "./index.scss";
import menu_styles from "./menu.scss";
import { DirtyInput } from "./components/dirtyinput";
import { Dice } from "./components/dice";
import { ManualDice } from "./components/manualdice";
import { compute_scoring } from "./scoring";
import { Hint } from "./components/hint";
import { classNames } from "./util";
import { StateSelect, stateSync } from "./components/gameselector";
import { app } from "./app";

@observer
class AppComponent extends React.Component<{}, {}> {
  componentDidMount() {
    stateSync.init();
    if (app.players.length === 0) {
      app.state.setPlayerCount(1);
    }
    if (!app.uiState.lang) app.uiState.lang = "en";
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
        styles.row6
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
        styles.rowyahtzee
      ]
    };

    const roll = [];
    for (const v of app.state.currentRoll || []) if (v !== null) roll.push(v);
    const scoring = compute_scoring(roll);

    const displayGroup = (
      player: number,
      hasTurn: boolean,
      group: "sides" | "combinations"
    ) =>
      app.players[player][group].map((c, j) => {
        if (app.uiState.editing)
          return (
            <div
              className={rowStyles[group][j] + " " + styles.Editing}
              key={group + j}
            >
              <DirtyInput
                type="number"
                value={c}
                onChange={(c: number | null) =>
                  app.state.setScore(player, group, j, c)
                }
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
              className={classNames({
                [styles.Action]: true,
                [rowStyles[group][j]]: true
              })}
              onClick={() =>
                app.state.pickAction(player, group, j, scoring[group][j])
              }
            >
              {display(scoring[group][j], "action")}
            </div>
          );
        return (
          <div className={rowStyles[group][j]} key={group + j}>
            {display(c, "score")}
          </div>
        );
      });

    const playerGroupSum = (group: (number | null)[]) => {
      let s = 0;
      for (const v of group) {
        s += v || 0;
      }
      return s;
    };

    const playerSideSum = (player: number) => {
      let v = 0;
      for (let j = 0; j < app.state.players[player].sides.length; ++j) {
        const c = app.state.players[player].sides[j];
        if (c === null) continue;
        v += c - 4 * (j + 1);
      }
      return v;
    };

    const displaySideSum = (player: number) => {
      const v = playerSideSum(player);
      return !v ? "—" : v > 0 ? "+" + v : v.toString().replace("-", "−");
    };

    const playerSideBonus = (player: number) =>
      playerGroupSum(app.state.players[player].sides) >= 84 ? 50 : 0;

    const displayTotal = (player: number) => {
      const v =
        playerSideSum(player) +
        playerSideBonus(player) +
        playerGroupSum(app.state.players[player].combinations);
      return v.toString().replace("-", "−");
    };

    const players = app.players.map((player, i) => (
      <div key={i} className={styles.ScoreColumn}>
        <div className={styles.rowname}>
          {app.uiState.editing ? (
            <input
              value={player.name || ""}
              onChange={e => app.state.setName(i, e.target.value)}
            />
          ) : (
            <label>
              <input
                type="radio"
                checked={app.state.turn === i}
                onChange={() => app.state.setTurn(i)}
              />
              <span>
                {player.name || (i < 26 ? String.fromCharCode(65 + i) : "")}
              </span>
            </label>
          )}
        </div>
        {displayGroup(i, app.state.turn === i, "sides")}
        <div className={styles.rowsum}>{displaySideSum(i)}</div>
        <div className={styles.rowbonus}>{playerSideBonus(i)}</div>
        {displayGroup(i, app.state.turn === i, "combinations")}
        <div className={styles.rowtotal}>{displayTotal(i)}</div>
      </div>
    ));

    const dice = app.uiState.manualDice ? (
      <ManualDice
        value={app.state.currentRoll}
        onChange={v => app.setCurrentRoll(v)}
      />
    ) : (
      <Dice
        value={app.state.currentRoll}
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
              if (v !== null) app.state.setPlayerCount(v);
            }}
          />
        </div>
        <div className={menu_styles.Editing}>
          <label>
            <input
              type="checkbox"
              checked={!!app.uiState.editing}
              onChange={e => (app.uiState.editing = !!e.target.checked)}
            />
            {app.t("editing")}
          </label>
        </div>
        <div className={menu_styles.ManualDice}>
          <label>
            <input
              type="checkbox"
              checked={!app.uiState.manualDice}
              onChange={e => (app.uiState.manualDice = !e.target.checked)}
            />
            {app.t("non_manual_dice")}
          </label>
        </div>
        <div className={menu_styles.Hints}>
          <label>
            <input
              type="checkbox"
              checked={!!app.uiState.hints}
              onChange={e => (app.uiState.hints = !!e.target.checked)}
            />
            {app.t("hints")}
          </label>
        </div>
        <div className={menu_styles.Language}>
          <label>
            <input
              type="radio"
              checked={app.uiState.lang === "da"}
              onChange={() => (app.uiState.lang = "da")}
            />
            {app.t("lang_da")}
          </label>
          <label>
            <input
              type="radio"
              checked={app.uiState.lang === "en"}
              onChange={() => (app.uiState.lang = "en")}
            />
            {app.t("lang_en")}
          </label>
        </div>
        <div className={menu_styles.StateSelect}>
          <StateSelect />
        </div>
      </div>
    );

    const currentPlayer = (app.state.players || [])[app.state.turn];
    const hints = (app.uiState.hints && currentPlayer) ? (
      <Hint
        className={styles.Hint}
        currentRoll={app.state.currentRoll || []}
        currentRollCount={app.state.currentRollCount || 0}
        player={currentPlayer}
      />
    ) : null;

    return (
      <div className={styles.App}>
        {menu}
        <div className={styles.Dice}>{dice}</div>
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
