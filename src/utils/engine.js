// Initialize a new card with base properties for the weighted engine
export const initCard = () => ({
  appearances: 0,
  weight: 10, // Base weight for a new unseen word
  isStarred: false
});

// Update the card's weight based on the user's answer
export const updateCardWeight = (card, isKnown) => {
  let w = card.weight !== undefined ? card.weight : 10;
  
  if (isKnown) {
    // Drop exactly one gear down
    if (w >= 100) w = 60;
    else if (w >= 60) w = 30;
    else if (w >= 30) w = 10;
    else if (w >= 10) w = 5;
    else if (w >= 5) w = 3;
    else w = 1;
  } else {
    // Forgetting pushes the weight up significantly
    if (w <= 3) w = 30;
    else if (w <= 5) w = 60;
    else w = 100;
  }

  return {
    ...card,
    appearances: (card.appearances || 0) + 1,
    weight: w
  };
};

// Select a random card from the deck based on their weights
export const getWeightedRandomCard = (deck) => {
  if (!deck || deck.length === 0) return null;
  
  // Calculate total weight
  const totalWeight = deck.reduce((sum, card) => sum + (card.weight !== undefined ? card.weight : 10), 0);
  
  // Pick a random number between 0 and totalWeight
  let random = Math.random() * totalWeight;
  
  for (const card of deck) {
    const cardWeight = card.weight !== undefined ? card.weight : 10;
    if (random < cardWeight) {
      return card;
    }
    random -= cardWeight;
  }
  
  // Fallback
  return deck[Math.floor(Math.random() * deck.length)];
};
