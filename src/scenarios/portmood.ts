/** 5.1 mascot reaction to a prediction in broken mode: did the reader say right whether the Python and C++
 *  indexes agree (the model's pyIndex vs cppIndex)? Right = cheer, wrong = oops (it also clears progress). */
export const portReaction = (agree: boolean, same: boolean): 'cheer' | 'oops' => (agree === same ? 'cheer' : 'oops')
