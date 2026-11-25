/** 5.2 mascot reaction when a CI run finishes: the reader's guess against the model's first red step. */
export const ciReaction = (guess: string, firstRed: string): 'cheer' | 'oops' => (guess === firstRed ? 'cheer' : 'oops')
