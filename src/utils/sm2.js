// SM-2 Spaced Repetition Algorithm

export const initialCardState = () => ({
  n: 0, // repetitions
  ef: 2.5, // easiness factor
  i: 0, // interval in days
  nextReview: Date.now(), // timestamp for next review
});

// Quality: 0-5 (we will map 'Know' to 4 or 5, 'Don't Know' to 1 or 2)
export const calculateNextReview = (card, quality) => {
  let { n, ef, i } = card;

  if (quality >= 3) {
    if (n === 0) i = 1;
    else if (n === 1) i = 6;
    else i = Math.round(i * ef);
    n += 1;
  } else {
    n = 0;
    i = 1;
  }

  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < 1.3) ef = 1.3;

  const nextReview = Date.now() + i * 24 * 60 * 60 * 1000;
  
  return { n, ef, i, nextReview };
};
