import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSentence, fetchTranslation } from '../services/api';
import { getWeightedRandomCard, updateCardWeight } from '../utils/engine';
import { ArrowLeft, Check, X as XIcon, Star, ArrowRight, RotateCcw } from 'lucide-react';

const HighlightedText = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <span>
      {parts.map((part, i) => 
        i % 2 === 1 ? <span key={i} style={{ color: '#ef4444', fontWeight: 600 }}>{part}</span> : part
      )}
    </span>
  );
};

export default function FlashcardScreen({ deck, updateDeck, onBack, filterFavorites }) {
  const [activeDeck, setActiveDeck] = useState(filterFavorites ? deck.filter(c => c.isStarred) : deck);
  const [currentCard, setCurrentCard] = useState(() => getWeightedRandomCard(activeDeck));
  
  const [sentenceEn, setSentenceEn] = useState('');
  const [sentenceZh, setSentenceZh] = useState('');
  const [loadingSentence, setLoadingSentence] = useState(false);
  
  const [translatedWord, setTranslatedWord] = useState(null);
  const [translationText, setTranslationText] = useState('');
  
  // Two-step logic
  const [answerStep, setAnswerStep] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    const filtered = filterFavorites ? deck.filter(c => c.isStarred) : deck;
    setActiveDeck(filtered);
    if (currentCard && !filtered.find(c => c.id === currentCard.id)) {
      setCurrentCard(getWeightedRandomCard(filtered));
    } else if (!currentCard) {
      setCurrentCard(getWeightedRandomCard(filtered));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterFavorites]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentCard) {
      loadContext();
      setAnswerStep(1);
      setSelectedAnswer(null);
      setTranslatedWord(null);
    }
  }, [currentCard?.id]);

  const loadContext = async () => {
    setLoadingSentence(true);
    setSentenceEn('');
    setSentenceZh('');
    const context = await generateSentence(currentCard.word, currentCard.translation);
    
    // Parse English and Chinese parts
    if (context.includes('---')) {
      const parts = context.split('---');
      setSentenceEn(parts[0].replace(/\*\*/g, '').trim());
      
      let zh = parts[1].trim();
      // Fallback: If LLM forgot to add ** and translation exists
      if (!zh.includes('**') && currentCard.translation !== '待查') {
        const meanings = currentCard.translation.split(/[,，;；\s]+/).filter(Boolean);
        for (const m of meanings) {
          if (zh.includes(m)) {
            zh = zh.replace(new RegExp(m, 'g'), `**${m}**`);
            break;
          }
        }
      }
      setSentenceZh(zh);
    } else {
      setSentenceEn(context.replace(/\*\*/g, '').trim());
      setSentenceZh('');
    }
    
    setLoadingSentence(false);
  };

  const handleWordClick = async (rawWord) => {
    const cleanWord = rawWord.replace(/[^a-zA-Z\-]/g, '');
    if (!cleanWord) return;
    
    // Toggle off if clicking the same word
    if (translatedWord === cleanWord) {
      setTranslatedWord(null);
      return;
    }
    
    setTranslatedWord(cleanWord);
    setTranslationText({ context: '正在分析语境...', others: '' });
    const result = await fetchTranslation(cleanWord, sentenceEn);
    
    if (result && result.includes('___')) {
      const [ctxMeaning, othMeaning] = result.split('___');
      setTranslationText({ context: ctxMeaning, others: othMeaning });
    } else {
      setTranslationText({ context: result || '未找到释义', others: '' });
    }
  };

  const handleStep1 = (isKnown) => {
    setSelectedAnswer(isKnown);
    setAnswerStep(2);
  };

  const proceedToNext = (finalIsKnown) => {
    if (!currentCard) return;
    
    const updatedCard = updateCardWeight(currentCard, finalIsKnown);
    const newDeck = deck.map(c => c.id === updatedCard.id ? updatedCard : c);
    updateDeck(newDeck);
    
    const newActiveDeck = filterFavorites ? newDeck.filter(c => c.isStarred) : newDeck;
    setActiveDeck(newActiveDeck);
    
    let nextCard = getWeightedRandomCard(newActiveDeck);
    if (nextCard && nextCard.id === updatedCard.id && newActiveDeck.length > 1) {
       nextCard = getWeightedRandomCard(newActiveDeck.filter(c => c.id !== updatedCard.id));
    }
    setCurrentCard(nextCard);
  };

  const toggleStar = () => {
    if (!currentCard) return;
    const updatedCard = { ...currentCard, isStarred: !currentCard.isStarred };
    const newDeck = deck.map(c => c.id === updatedCard.id ? updatedCard : c);
    updateDeck(newDeck);
    setCurrentCard(updatedCard);
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
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflowY: 'auto', minHeight: 0, paddingBottom: '20px' }}
        >
          {/* Top Word Section - Fixed Min Height to prevent jumping */}
          <div style={{ minHeight: '100px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginBottom: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', width: '100%' }}>
              <h1 style={{ fontSize: '3.5rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', margin: 0 }}>
                {currentCard.word}
              </h1>
              <button 
                onClick={toggleStar} 
                style={{ position: 'absolute', right: 0, background: 'none', border: 'none', cursor: 'pointer', color: currentCard.isStarred ? '#fbbf24' : '#9ca3af', transition: 'color 0.2s' }}
              >
                <Star fill={currentCard.isStarred ? '#fbbf24' : 'none'} size={28} />
              </button>
            </div>
          </div>

          {/* Sentence Section */}
          <div style={{ 
            background: 'var(--panel-bg)', 
            borderRadius: '16px', 
            padding: '24px', 
            border: '1px solid var(--border-color)',
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            {loadingSentence ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '16px', width: '90%', background: 'var(--border-color)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ height: '16px', width: '70%', background: 'var(--border-color)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out 0.2s' }} />
                <div style={{ height: '16px', width: '50%', background: 'var(--border-color)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out 0.4s' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '1.15rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0, textAlign: 'left', fontWeight: 500 }}>
                  {sentenceEn.split(' ').map((w, i) => {
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
                
                {/* Stage 2: Show Translation */}
                {answerStep === 2 && sentenceZh && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}
                  >
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      <HighlightedText text={sentenceZh} />
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Translation Popup Area */}
          <div style={{ minHeight: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
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
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', paddingTop: '12px', flexShrink: 0 }}>
        {answerStep === 1 ? (
          <>
            <button 
              onClick={() => handleStep1(false)}
              style={{ flex: 1, padding: '24px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'background 0.2s' }}
            >
              <XIcon color="var(--text-tertiary)" size={28} />
            </button>
            <button 
              onClick={() => handleStep1(true)}
              style={{ flex: 1, padding: '24px', background: 'var(--text-primary)', border: '1px solid var(--text-primary)', borderRadius: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'opacity 0.2s' }}
            >
              <Check color="#ffffff" size={28} />
            </button>
          </>
        ) : (
          <>
            {selectedAnswer === true ? (
              <>
                <button 
                  onClick={() => proceedToNext(false)}
                  style={{ flex: 1, padding: '16px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center', transition: 'background 0.2s' }}
                >
                  <RotateCcw color="var(--text-tertiary)" size={20} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>我记错了</span>
                </button>
                <button 
                  onClick={() => proceedToNext(true)}
                  style={{ flex: 2, padding: '16px', background: 'var(--text-primary)', border: '1px solid var(--text-primary)', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center', transition: 'opacity 0.2s' }}
                >
                  <ArrowRight color="#ffffff" size={20} />
                  <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500 }}>继续</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => proceedToNext(false)}
                style={{ flex: 1, padding: '16px', background: 'var(--text-primary)', border: '1px solid var(--text-primary)', borderRadius: '16px', cursor: 'pointer', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', transition: 'opacity 0.2s' }}
              >
                <span style={{ fontSize: '1rem', color: '#fff', fontWeight: 500 }}>继续</span>
                <ArrowRight color="#ffffff" size={20} />
              </button>
            )}
          </>
        )}
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
