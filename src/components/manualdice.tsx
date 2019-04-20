import * as React from "react";
import styles from "./manualdice.scss";
import { classNames } from "../util";

const DICE = "⚀⚁⚂⚃⚄⚅";

interface Props {
  value: (number | null)[];
  onChange: (v: (number | null)[]) => void;
}

interface State {}

export class ManualDice extends React.Component<Props, State> {
  onChange(s: string) {
    const dice = [];
    for (let i = 0; i < s.length; ++i) {
      const j = DICE.indexOf(s.charAt(i));
      if (j !== -1) dice.push(j + 1);
      const v = parseInt(s.charAt(i));
      if (v === v && 1 <= v && v <= 6) dice.push(v);
    }
    if (dice.length > this.props.value.length) return;
    while (dice.length < this.props.value.length) dice.push(null);
    this.props.onChange(dice);
  }

  render() {
    let value = "";
    for (const v of this.props.value) {
      if (v !== null) value += DICE[v - 1];
    }
    return (
      <input
        placeholder={"Indtast slag"}
        className={classNames({
          [styles.ManualDice]: true,
          [styles.Placeholder]: !value
        })}
        value={value}
        onChange={e => this.onChange(e.target.value)}
      />
    );
  }
}
