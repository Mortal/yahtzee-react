import * as React from "react";
import styles from "./dice.scss";
import { classNames } from "../util";

const DICE = "⚀⚁⚂⚃⚄⚅";

interface Props {
  value: (number | null)[];
  onChange: (v: (number | null)[]) => void;
  allowReroll: boolean;
}

interface State {
  held: boolean[];
}

export class Dice extends React.Component<Props, State> {
  state = {held: []};

  toggleHold(toggleIndex: number) {
    const held = [];
    for (let i = 0; i < this.props.value.length; ++i) {
      const v = this.state.held[i];
      held.push(i === toggleIndex ? !v : !!v);
    }
    this.setState({held: held});
  }

  reroll() {
    const faces = [];
    for (let i = 0; i < this.props.value.length; ++i) {
      if (this.state.held[i]) faces.push(this.props.value[i]);
      else faces.push(Math.floor(Math.random() * DICE.length) + 1);
    }
    this.props.onChange(faces);
  }

  render() {
    const dice = this.props.value.map((v, i) =>
      <button key={i} className={classNames({[styles.Die]: true, [styles.Held]: !!this.state.held[i]})} onClick={() => this.toggleHold(i)} disabled={v === null}>
      {v === null ? "?" : DICE.charAt(v - 1)}
      </button>
    );
    const reroll = <button className={styles.Reroll} disabled={!this.props.allowReroll} onClick={() => this.reroll()}>Reroll</button>;
    return <div className={styles.Dice}>
      {dice}
      {reroll}
      </div>;
  }
}
