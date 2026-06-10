// Initialize a new card with base properties for the weighted engine
export const initCard = () => ({
  appearances: 0,
  weight: 50, // Base weight for a new unseen word
  isStarred: false
});

// Update the card's weight based on the user's answer
export const updateCardWeight = (card, isKnown) => {
  let w = card.weight !== undefined ? card.weight : 50;
  
  if (isKnown) {
    // Drop exactly one gear down
    if (w >= 100) w = 80;
    else if (w >= 80) w = 65;
    else if (w >= 65) w = 50;
    else if (w >= 50) w = 35;
    else if (w >= 35) w = 25;
    else if (w >= 25) w = 18;
    else if (w >= 18) w = 12;
    else if (w >= 12) w = 8;
    else if (w >= 8) w = 5;
    else if (w >= 5) w = 3;
    else w = 1;
  } else {
    // Forgetting pushes the weight up significantly
    if (w <= 3) w = 18;
    else if (w <= 8) w = 35;
    else if (w <= 25) w = 65;
    else if (w <= 50) w = 80;
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
  const totalWeight = deck.reduce((sum, card) => sum + (card.weight !== undefined ? card.weight : 50), 0);
  
  // Pick a random number between 0 and totalWeight
  let random = Math.random() * totalWeight;
  
  for (const card of deck) {
    const cardWeight = card.weight !== undefined ? card.weight : 50;
    if (random < cardWeight) {
      return card;
    }
    random -= cardWeight;
  }
  
  // Fallback
  return deck[Math.floor(Math.random() * deck.length)];
};
