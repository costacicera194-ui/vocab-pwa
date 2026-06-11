import { fsrs, createEmptyCard, Rating } from 'ts-fsrs';

// Initialize FSRS engine with default parameters
const f = fsrs({});

// Initialize a new card with base properties for the FSRS engine
export const initCard = () => {
  const card = createEmptyCard();
  return {
    ...card,
    isStarred: false,
    sentences: [],
    sentenceIndex: 0
  };
};

// Record daily study activity for heatmap
const recordStudyStat = () => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const statsStr = localStorage.getItem('study_stats');
    const stats = statsStr ? JSON.parse(statsStr) : {};
    stats[today] = (stats[today] || 0) + 1;
    localStorage.setItem('study_stats', JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to update study stats", e);
  }
};

export const updateCardFSRS = (card, uiRating) => {
  recordStudyStat();
  
  // Transform our plain card into FSRS Card object format
  const currentCard = {
    due: new Date(card.due || Date.now()),
    stability: card.stability || 0,
    difficulty: card.difficulty || 0,
    elapsed_days: card.elapsed_days || 0,
    scheduled_days: card.scheduled_days || 0,
    reps: card.reps || 0,
    lapses: card.lapses || 0,
    state: card.state !== undefined ? card.state : 0,
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  };

  let fsrsRating;
  if (uiRating === 'good') fsrsRating = Rating.Good;
  else if (uiRating === 'hard') fsrsRating = Rating.Hard;
  else if (uiRating === 'again') fsrsRating = Rating.Again;
  else fsrsRating = Rating.Good;

  // FSRS calculate
  const schedulingInfo = f.repeat(currentCard, new Date());
  const nextLog = schedulingInfo[fsrsRating];
  
  return {
    ...card,
    ...nextLog.card, // Update due, stability, difficulty, state, reps, lapses, etc.
  };
};

// --- Scheduling Modes ---

export const getDueCards = (deck, limitNew = 30) => {
  const now = new Date();
  const dueCards = [];
  const newCards = [];
  
  for (const card of deck) {
    if (card.state === undefined || card.state === 0) {
      newCards.push(card);
    } else {
      const dueDate = new Date(card.due);
      if (dueDate <= now) {
        dueCards.push(card);
      }
    }
  }
  
  return {
    due: dueCards.sort((a, b) => new Date(a.due) - new Date(b.due)),
    new: newCards.slice(0, limitNew)
  };
};

export const getNextCardForMission = (deck, limitNew = 30) => {
  const { due, new: newC } = getDueCards(deck, limitNew);
  if (due.length > 0) return due[0];
  if (newC.length > 0) return newC[0];
  return null;
};

export const getNextInfiniteCard = (deck) => {
  if (!deck || deck.length === 0) return null;
  const now = new Date();
  const due = deck.filter(c => c.state !== 0 && c.state !== undefined && new Date(c.due) <= now);
  if (due.length > 0) {
    due.sort((a, b) => new Date(a.due) - new Date(b.due));
    return due[0];
  }
  return deck[Math.floor(Math.random() * deck.length)];
};
