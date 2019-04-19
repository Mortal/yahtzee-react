import * as React from "react";
import * as ReactDOM from "react-dom";
import {observable, computed} from "mobx";
import {observer} from "mobx-react";
import styles from "./index.scss";

class App {
	@observable
	foo = "";
}

const app = new App();

@observer
class AppComponent extends React.Component<{}, {}> {
	render() {
		return <>
			<div><input value={app.foo} onChange={e => app.foo = e.target.value} /></div>
			<div>The value is <span className={styles.MyTestStyle}>{app.foo}</span></div>
		</>;
	}
}

ReactDOM.render(<AppComponent />, document.getElementById("root"));
