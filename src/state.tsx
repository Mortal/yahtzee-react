import { types, applySnapshot } from "mobx-state-tree";

export interface UiState {
  editing?: boolean;
  manualDice?: boolean;
  hints?: boolean;
  lang?: "da" | "en";
  gameId?: string;
}

export const PlayerState = types.model({
  name: types.string,
  sides: types.array(types.maybeNull(types.number)),
  combinations: types.array(types.maybeNull(types.number))
});

export const AppState = types
  .model({
    playerCount: 0,
    players: types.array(PlayerState),
    currentRoll: types.optional(types.array(types.maybeNull(types.number)), [
      null,
      null,
      null,
      null,
      null,
      null
    ]),
    currentRollCount: 0,
    turn: 0
  })
  .actions(self => ({
    setCurrentRoll(v: (number | null)[]) {
      applySnapshot(self.currentRoll, v);
    },
    incrementRollCount() {
      self.currentRollCount += 1;
    },
    advanceTurn() {
      applySnapshot(self.currentRoll, [null, null, null, null, null, null]);
      self.turn = (self.turn + 1) % (self.playerCount || 1);
      self.currentRollCount = 0;
    },
    setName(player: number, name: string) {
      if (player >= self.players.length) return;
      self.players[player].name = name;
    },
    setPlayerCount(i: number) {
      self.playerCount = i;
      while (self.players.length < i) {
        const sides = [];
        for (let j = 0; j < 6; ++j) sides.push(null);
        const combinations = [];
        for (let j = 0; j < 12; ++j) combinations.push(null);
        self.players.push({ name: "", sides, combinations });
      }
      if (self.turn >= i) self.turn = 0;
    },
    setScore(
      player: number,
      group: "sides" | "combinations",
      row: number,
      score: number | null
    ) {
      self.players[player][group][row] = score;
    }
  }))
  .actions(self => ({
    pickAction(
      player: number,
      group: "sides" | "combinations",
      row: number,
      score: number
    ) {
      self.setScore(player, group, row, score);
      self.advanceTurn();
    }
  }));
