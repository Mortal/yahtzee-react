import * as React from "react";
import * as ReactDOM from "react-dom";
import {observable, computed, action} from "mobx";
import {observer} from "mobx-react";
import styles from "./index.scss";

class App {
	@observable
	players = [];

	@action
	onPlayerCountChange(i) {
		while (this.players.length > i) this.players.pop();
		while (this.players.length < i) {
			const r = [];
			for (let j = 0; j < 20; ++j) r.push(0);
			this.players.push(r);
		}
	}
}

const app = new App();

@observer
class AppComponent extends React.Component<{}, {}> {
	render() {
		const header = <>
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
		</>;

		const players = app.players.map((v, i) =>
			<div key={i} className={styles.ScoreColumn}>
			{v.map((c, j) => <div><input value={c} onChange={e => v[j] = e.target.value} /></div>)}
			</div>
		);

		return <>
			<div>Players: <input value={app.players.length} onChange={e => app.onPlayerCountChange(parseInt(e.target.value))} /></div>
			<div className={styles.ScoreTable}>
			{header}
			{players}
			</div>
		</>;
	}
}

ReactDOM.render(<AppComponent />, document.getElementById("root"));
