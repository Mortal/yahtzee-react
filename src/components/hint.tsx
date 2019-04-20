import * as React from "react";
import { PlayerState } from "../state";

interface Props {
  currentRoll: (number | null)[];
  currentRollCount: number;
  player: PlayerState;
}

interface State {}

export class Hint extends React.Component<Props, State> {}
