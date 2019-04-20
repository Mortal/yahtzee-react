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
  held: { index: number; face: number }[];
}

export class Dice extends React.Component<Props, State> {
  state = { held: [] };

  getHeldMask() {
    const held = [];
    for (let i = 0; i < this.props.value.length; ++i) {
      held.push(false);
    }
    for (const { index, face } of this.state.held) {
      if (!held[index] && this.props.value[index] === face) held[index] = true;
      else
        for (let i = 0; i < this.props.value.length; ++i) {
          if (!held[i] && this.props.value[i] === face) {
            held[i] = true;
            break;
          }
        }
    }
    return held;
  }

  setHeldMask(mask: boolean[]) {
    const held = [];
    for (let index = 0; index < mask.length; ++index) {
      const face = this.props.value[index];
      if (mask[index] && face !== null) held.push({ index, face });
    }
    this.setState({ held });
  }

  toggleHold(toggleIndex: number) {
    const held = this.getHeldMask();
    held[toggleIndex] = !held[toggleIndex];
    this.setHeldMask(held);
  }

  reroll() {
    const roll = [];
    const held = this.getHeldMask();
    for (let i = 0; i < this.props.value.length; ++i) {
      if (!held[i]) roll.push(Math.floor(Math.random() * DICE.length) + 1);
    }
    console.log(roll);
    roll.sort();
    const faces = [];
    for (let i = 0; i < this.props.value.length; ++i) {
      if (held[i]) faces.push(this.props.value[i]);
      else faces.push(roll.shift() as number);
    }
    this.props.onChange(faces);
  }

  render() {
    const held = this.getHeldMask();
    const dice = this.props.value.map((v, i) => (
      <button
        key={i}
        className={classNames({
          [styles.Die]: true,
          [styles.Held]: held[i]
        })}
        onClick={() => this.toggleHold(i)}
        disabled={v === null}
      >
        {v === null ? "?" : DICE.charAt(v - 1)}
      </button>
    ));
    const reroll = (
      <button
        className={styles.Roll}
        disabled={!this.props.allowReroll}
        onClick={() => this.reroll()}
      >
        {this.props.value.some(v => v !== null) ? "Slå igen" : "Slå"}
      </button>
    );
    return (
      <div className={styles.Dice}>
        {dice}
        {reroll}
      </div>
    );
  }
}
