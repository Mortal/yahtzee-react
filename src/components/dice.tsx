import * as React from "react";
import styles from "./dice.scss";
import { classNames } from "../util";
import { app } from "../app";

const DICE = "⚀⚁⚂⚃⚄⚅";

interface Props {
  value: (number | null)[];
  onChange: (v: (number | null)[]) => void;
  allowReroll: boolean;
}

interface State {
  held: { index: number; face: number }[];
  rerollAnimation: number[] | null;
}

export class Dice extends React.Component<Props, State> {
  state = { held: [], rerollAnimation: null };
  rerollAnimation = 0;

  componentDidUpdate() {
    if (
      this.state.held.some(
        ({ index, face }) => this.props.value[index] !== face
      )
    ) {
      this.setHeldMask(this.getHeldMask());
    }
  }

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
    if (this.rerollAnimation > 0) return;
    this.rerollAnimation = 4;
    this.rerollStep();
  }

  rerollStep() {
    this.rerollAnimation -= 1;
    const roll = [];
    const held = this.getHeldMask();
    for (let i = 0; i < this.props.value.length; ++i) {
      if (!held[i]) roll.push(Math.floor(Math.random() * DICE.length) + 1);
    }
    if (this.rerollAnimation == 0) {
      roll.sort();
    }
    const faces = [];
    for (let i = 0; i < this.props.value.length; ++i) {
      if (held[i]) faces.push(this.props.value[i] as number);
      else faces.push(roll.shift() as number);
    }
    if (this.rerollAnimation > 0) {
      this.setState({ rerollAnimation: faces });
      setTimeout(() => this.rerollStep(), 100);
    } else {
      this.setState({ rerollAnimation: null });
      this.props.onChange(faces);
    }
  }

  render() {
    const held = this.getHeldMask();
    const dice = (this.state.rerollAnimation || this.props.value).map(
      (v, i) => (
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
      )
    );
    const reroll = (
      <button
        className={styles.Roll}
        disabled={!this.props.allowReroll}
        onClick={() => this.reroll()}
      >
        {this.props.value.some(v => v !== null)
          ? app.t("reroll")
          : app.t("roll")}
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
