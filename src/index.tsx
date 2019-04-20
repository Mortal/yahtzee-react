import * as React from "react";
import * as ReactDOM from "react-dom";
import { observable, action, autorun } from "mobx";
import { observer } from "mobx-react";
import styles from "./index.scss";
import { DirtyInput } from "./components/dirtyinput";
import { Dice } from "./components/dice";

interface PlayerState {
  name: string;
  score: (number | null)[];
}

interface AppState {
  players?: PlayerState[];
  dice?: (number | null)[];
}

class App {
  @observable
  state: AppState = {};

  get players() {
    if (this.state.players === undefined) this.state.players = [];
    return this.state.players;
  }

  get dice() {
    if (this.state.dice === undefined) this.state.dice = [null, null, null, null, null, null];
    return this.state.dice;
  }

  @action
  onPlayerCountChange(i: number) {
    while (this.players.length > i) this.players.pop();
    while (this.players.length < i) {
      const r = [];
      for (let j = 0; j < 20; ++j) r.push(null);
      this.players.push({name: "", score: r});
    }
  }
}

const app = new App();

const getStateElement = () =>
  document.getElementById("state") as HTMLInputElement;
app.state = JSON.parse(getStateElement().value || "{}") || {};
autorun(() => (getStateElement().value = JSON.stringify(app.state)));

@observer
class AppComponent extends React.Component<{}, {}> {
  render() {
    const header = (
      <div className={styles.ScoreHeader}>
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
      </div>
    );

    const onChange = (i: number, j: number, s: string) => {
      let v = s ? parseInt(s) : null;
      if (v === v) app.players[i].score[j] = v;
    };

    const players = app.players.map((player, i) => (
      <div key={i} className={styles.ScoreColumn}>
        {player.score.map((c, j) => (
          <div key={j}>
            <DirtyInput
              value={c === null ? "" : c.toString()}
              onChange={s => onChange(i, j, s)}
            />
          </div>
        ))}
      </div>
    ));

    return (
      <>
        <div>
          {"Players: "}
          <DirtyInput
            value={app.players.length.toString()}
            onChange={v => app.onPlayerCountChange(parseInt(v))}
          />
        </div>
        <div className={styles.ScoreTable}>
          {header}
          {players}
        </div>
        <div>
          <Dice value={app.dice} onChange={v => app.state.dice = v} allowReroll={true} />
        </div>
      </>
    );
  }
}

ReactDOM.render(<AppComponent />, document.getElementById("root"));
