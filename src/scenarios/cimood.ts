/** 5.2 mascot reaction when a CI run finishes: the reader's guess against the model's first red step; a run that
 *  first solves the chapter challenge (build red, tests skipped) cheers whatever the guess. */
export const ciReaction = (guess: string, firstRed: string, solvesChallenge = false): 'cheer' | 'oops' =>
  solvesChallenge || guess === firstRed ? 'cheer' : 'oops'
