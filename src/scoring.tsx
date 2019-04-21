export const S2 = 0;
export const S22 = 1;
export const S222 = 2;
export const S3 = 3;
export const S4 = 4;
export const S33 = 5;
export const R15 = 6;
export const R26 = 7;
export const R16 = 8;
export const S23 = 9;
export const CHANCE = 10;
export const YAHTZEE = 11;
export const COMB_COUNT = 12;

export const DICE_COUNT = 6;
export const SIDES = 6;

export const COMBINATIONS = "PDTVQWsSCH?!";

export interface Scoring {
  sides: number[];
  combinations: number[];
}

function score_pairs(combinations: number[], histogram: number[]) {
  const indices = [S2, S22, S222];
  let pairs = 0;
  let pair_sum = 0;
  for (let i = SIDES; i-- > 0; ) {
    if (histogram[i] >= 2) {
      pair_sum += (i + 1) * 2;
      combinations[indices[pairs++]] = pair_sum;
    }
  }
}

function score_sum(combinations: number[], histogram: number[]) {
  let sum = 0;
  for (let i = 0; i < SIDES; ++i) sum += (i + 1) * histogram[i];
  combinations[CHANCE] = sum;
}

function score_yahtzee(combinations: number[], histogram: number[]) {
  for (let i = 0; i < SIDES; ++i) {
    if (histogram[i] === DICE_COUNT) {
      combinations[YAHTZEE] = 100 + (i + 1) * DICE_COUNT;
    }
  }
}

function score_combinations(combinations: number[], histogram: number[]) {
  let s2 = 0,
    s3 = 0,
    s4 = 0,
    s33 = 0;
  for (let i = SIDES; i-- > 0; ) {
    if (histogram[i] >= 4) {
      s2 = Math.max(s2, s3);
      s3 = i + 1;
      s4 = s3;
    } else if (histogram[i] === 3) {
      s2 = Math.max(s2, s3);
      s33 = Math.max(s33, s3);
      s3 = i + 1;
    } else if (histogram[i] === 2) {
      s2 = i + 1;
    }
  }
  combinations[S4] = 4 * s4;
  combinations[S3] = 3 * s3;
  combinations[S33] = s33 > 0 ? 3 * (s33 + s3) : 0;
  combinations[S23] = s2 > 0 && s3 > 0 ? s2 * 2 + s3 * 3 : 0;
}

function score_singles(combinations: number[], histogram: number[]) {
  let singles = 0;
  for (let i = 0; i < SIDES; ++i) {
    if (histogram[i] === 1) ++singles;
  }
  if (singles === SIDES) {
    combinations[R15] = 15;
    combinations[R26] = 20;
    combinations[R16] = 30;
  } else if (singles === SIDES - 2 && histogram[0] === 0) {
    combinations[R26] = 20;
  } else if (singles === SIDES - 2 && histogram[SIDES - 1] === 0) {
    combinations[R15] = 15;
  }
}

export function compute_scoring(roll: number[]): Scoring | null {
  if (roll.length !== DICE_COUNT) return null;
  const sides = [];
  for (let i = 0; i < SIDES; ++i) sides.push(0);
  const combinations = [];
  for (let i = 0; i < COMB_COUNT; ++i) combinations.push(0);

  const histogram = [];
  for (let i = 0; i < SIDES; ++i) histogram.push(0);
  for (const side of roll) histogram[side - 1] += 1;

  for (let i = 0; i < SIDES; ++i) sides[i] = (i + 1) * histogram[i];

  score_pairs(combinations, histogram);
  score_sum(combinations, histogram);
  score_yahtzee(combinations, histogram);
  score_combinations(combinations, histogram);
  score_singles(combinations, histogram);

  return { sides, combinations };
}
