// Initialize a new card with base properties for the weighted engine
export const initCard = () => ({
  appearances: 0,
  weight: 100, // Base weight for a new unseen word
  isStarred: false
});

// Update the card's weight based on the user's answer
export const updateCardWeight = (card, isKnown) => {
  let newWeight = card.weight !== undefined ? card.weight : 100;
  
  if (isKnown) {
    // Known: drastically drop the weight so it rarely appears. Min weight is 1.
    newWeight = Math.max(1, Math.floor(newWeight / 10));
  } else {
    // Unknown: bump the weight significantly. Max weight is 1000.
    // If it was already low, this shoots it back up.
    newWeight = Math.min(1000, newWeight * 2 + 50);
  }

  return {
    ...card,
    appearances: (card.appearances || 0) + 1,
    weight: newWeight
  };
};

// Select a random card from the deck based on their weights
export const getWeightedRandomCard = (deck) => {
  if (!deck || deck.length === 0) return null;
  
  // Calculate total weight
  const totalWeight = deck.reduce((sum, card) => sum + (card.weight !== undefined ? card.weight : 100), 0);
  
  // Pick a random number between 0 and totalWeight
  let random = Math.random() * totalWeight;
  
  for (const card of deck) {
    const cardWeight = card.weight !== undefined ? card.weight : 100;
    if (random < cardWeight) {
      return card;
    }
    random -= cardWeight;
  }
  
  // Fallback
  return deck[Math.floor(Math.random() * deck.length)];
};
