export interface PlayerState {
  name: string;
  sides: (number | null)[];
  combinations: (number | null)[];
}

export interface AppState {
  playerCount?: number;
  players?: PlayerState[];
  currentRoll?: (number | null)[];
  currentRollCount?: number;
  editing?: boolean;
  manualDice?: boolean;
  turn?: number;
  hints?: boolean;
}
