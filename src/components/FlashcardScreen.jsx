import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSentence, fetchTranslation } from '../services/api';
import { getWeightedRandomCard, updateCardWeight } from '../utils/engine';
import { ArrowLeft, Check, X as XIcon, Star } from 'lucide-react';

export default function FlashcardScreen({ deck, updateDeck, onBack, filterFavorites }) {
  const [activeDeck, setActiveDeck] = useState(filterFavorites ? deck.filter(c => c.isStarred) : deck);
  const [currentCard, setCurrentCard] = useState(() => getWeightedRandomCard(activeDeck));
  
  const [sentence, setSentence] = useState('');
  const [loadingSentence, setLoadingSentence] = useState(false);
  const [translatedWord, setTranslatedWord] = useState(null);
  const [translationText, setTranslationText] = useState('');
  const [showOriginalTranslation, setShowOriginalTranslation] = useState(false);

  useEffect(() => {
    // Only re-sync if the filter mode changes. Otherwise, we manage it locally during review.
    const filtered = filterFavorites ? deck.filter(c => c.isStarred) : deck;
    setActiveDeck(filtered);
    // If currentCard is missing from filtered deck (e.g., they unstarred it and left), grab a new one
    if (currentCard && !filtered.find(c => c.id === currentCard.id)) {
      setCurrentCard(getWeightedRandomCard(filtered));
    } else if (!currentCard) {
      setCurrentCard(getWeightedRandomCard(filtered));
    }
  }, [filterFavorites]);

  // Load context whenever currentCard changes
  useEffect(() => {
    if (currentCard) {
      loadContext();
    }
  }, [currentCard]);

  const loadContext = async () => {
    setLoadingSentence(true);
    setShowOriginalTranslation(false);
    setTranslatedWord(null);
    setTranslationText('');
    const context = await generateSentence(currentCard.word, currentCard.translation);
    setSentence(context);
    setLoadingSentence(false);
  };

  const handleWordClick = async (rawWord) => {
    const cleanWord = rawWord.replace(/[^a-zA-Z\-]/g, '');
    if (!cleanWord) return;
    
    setTranslatedWord(cleanWord);
    setTranslationText({ context: '正在分析语境...', others: '' });
    const result = await fetchTranslation(cleanWord, sentence);
    
    if (result && result.includes('___')) {
      const [ctxMeaning, othMeaning] = result.split('___');
      setTranslationText({ context: ctxMeaning, others: othMeaning });
    } else {
      setTranslationText({ context: result || '未找到释义', others: '' });
    }
  };

  const handleAnswer = (isKnown) => {
    if (!currentCard) return;
    
    const updatedCard = updateCardWeight(currentCard, isKnown);
    
    // Update global deck
    const newDeck = deck.map(c => c.id === updatedCard.id ? updatedCard : c);
    updateDeck(newDeck);
    
    // Select next card based on new weights
    const newActiveDeck = filterFavorites ? newDeck.filter(c => c.isStarred) : newDeck;
    setActiveDeck(newActiveDeck);
    
    // Pick the next card
    let nextCard = getWeightedRandomCard(newActiveDeck);
    // Try to avoid showing the exact same card twice in a row if there are other options
    if (nextCard && nextCard.id === updatedCard.id && newActiveDeck.length > 1) {
       // Just pick again, probabilistically it's likely a different one, or we explicitly force it
       nextCard = getWeightedRandomCard(newActiveDeck.filter(c => c.id !== updatedCard.id));
    }
    setCurrentCard(nextCard);
  };

  const toggleStar = () => {
    if (!currentCard) return;
    const updatedCard = { ...currentCard, isStarred: !currentCard.isStarred };
    
    // Update global deck
    const newDeck = deck.map(c => c.id === updatedCard.id ? updatedCard : c);
    updateDeck(newDeck);
    
    // Update local card immediately for UI
    setCurrentCard(updatedCard);
    
    // If we are in favorites mode and they unstar, we keep it visible until they flip the card.
    // It will drop out naturally on handleAnswer.
  };

  if (!activeDeck || activeDeck.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '8px' }}>Empty List</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>{filterFavorites ? "You haven't starred any words yet." : "Your deck is empty."}</p>
        <button className="btn-secondary" onClick={onBack} style={{ width: '100%', borderRadius: '16px' }}>Return Home</button>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px' }}>
        <button onClick={onBack} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
          {filterFavorites ? 'Favorites' : 'Infinite Mode'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentCard.id}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '3rem', position: 'relative' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', margin: 0 }}>
              {currentCard.word}
            </h1>
            <button 
              onClick={toggleStar} 
              style={{ position: 'absolute', right: 0, background: 'none', border: 'none', cursor: 'pointer', color: currentCard.isStarred ? '#fbbf24' : 'var(--border-color)', transition: 'color 0.2s' }}
            >
              <Star fill={currentCard.isStarred ? '#fbbf24' : 'none'} size={28} />
            </button>
          </div>

          <div style={{ padding: '0 12px', marginBottom: '2rem' }}>
            {loadingSentence ? (
              <div style={{ height: '24px', width: '60%', background: 'var(--border-color)', borderRadius: '4px', margin: '0 auto', animation: 'pulse 1.5s infinite ease-in-out' }} />
            ) : (
              <p style={{ fontSize: '1.4rem', lineHeight: 1.6, color: 'var(--text-primary)', textAlign: 'center', fontWeight: 500 }}>
                {sentence.split(' ').map((w, i) => {
                  const cleanW = w.replace(/[^a-zA-Z\-]/g, '');
                  const isTarget = cleanW.toLowerCase() === currentCard.word.toLowerCase();
                  return (
                    <span 
                      key={i} 
                      onClick={() => handleWordClick(w)}
                      style={{ 
                        cursor: 'pointer', 
                        display: 'inline-block', 
                        marginRight: '6px',
                        color: translatedWord === cleanW 
                          ? 'var(--success-color)' 
                          : (isTarget ? '#4f46e5' : 'inherit'),
                        fontWeight: isTarget ? 700 : 'inherit',
                        transition: 'color 0.2s'
                      }}
                    >
                      {w}
                    </span>
                  );
                })}
              </p>
            )}
          </div>

          {/* Translation Popup Area */}
          <div style={{ minHeight: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {translatedWord && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--panel-bg)', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', textAlign: 'center', maxWidth: '90%' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{translatedWord}</div>
                <div style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {typeof translationText === 'string' ? (
                    <span style={{ color: 'var(--text-secondary)' }}>{translationText}</span>
                  ) : (
                    <>
                      <span style={{ color: '#4f46e5', fontWeight: 600 }}>{translationText.context}</span>
                      {translationText.others && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>其他: {translationText.others}</span>}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', minHeight: '60px' }}>
            {!showOriginalTranslation ? (
              <button 
                onClick={() => setShowOriginalTranslation(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.02em', textDecoration: 'underline', textUnderlineOffset: '4px' }}
              >
                Show Translation
              </button>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {currentCard.translation}
              </motion.div>
            )}
          </div>

        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', paddingTop: '24px' }}>
        <button 
          onClick={() => handleAnswer(false)}
          style={{ flex: 1, padding: '24px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'background 0.2s' }}
          onMouseOver={e => e.currentTarget.style.background = '#f9f9f9'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--panel-bg)'}
        >
          <XIcon color="var(--text-tertiary)" size={28} />
        </button>
        <button 
          onClick={() => handleAnswer(true)}
          style={{ flex: 1, padding: '24px', background: 'var(--text-primary)', border: '1px solid var(--text-primary)', borderRadius: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'opacity 0.2s' }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          <Check color="#ffffff" size={28} />
        </button>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 0.1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
