import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSentence, fetchTranslation } from '../services/api';
import { getWeightedRandomCard, updateCardWeight, initCard } from '../utils/engine';
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
    
    const sentences = currentCard.sentences || [];
    let idx = currentCard.sentenceIndex || 0;
    
    if (sentences.length >= 6) {
      const cached = sentences[idx];
      setSentenceEn(cached.en);
      setSentenceZh(cached.zh);
      
      const newCard = { ...currentCard, sentenceIndex: (idx + 1) % sentences.length };
      const newDeck = deck.map(c => c.id === newCard.id ? newCard : c);
      updateDeck(newDeck);
      setCurrentCard(newCard);
      
      setLoadingSentence(false);
      return;
    }

    const context = await generateSentence(currentCard.word, currentCard.translation);
    
    let en = '', zh = '';
    // Parse English and Chinese parts
    if (context.includes('---')) {
      const parts = context.split('---');
      en = parts[0].trim();
      en = en.replace(/^(英文原句|英语原文|英文例句|例句|原文)[:：\s]*/i, '');
      
      zh = parts[1].trim();
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
    } else {
      en = context.trim();
      en = en.replace(/^(英文原句|英语原文|英文例句|例句|原文)[:：\s]*/i, '');
    }
    
    const isDup = sentences.some(s => s.en.replace(/\*\*/g, '') === en.replace(/\*\*/g, ''));
    if (!isDup && en && zh) {
      const newSentences = [...sentences, { en, zh }];
      const newCard = { ...currentCard, sentences: newSentences, sentenceIndex: newSentences.length - 1 };
      const newDeck = deck.map(c => c.id === newCard.id ? newCard : c);
      updateDeck(newDeck);
      setCurrentCard(newCard);
    }
    
    setSentenceEn(en);
    setSentenceZh(zh);
    
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

  const handleAddNewWord = (wordToAdd, starIt) => {
    if (deck.find(c => c.word.toLowerCase() === wordToAdd.toLowerCase())) {
      alert("词库中已存在该单词！");
      return;
    }
    
    let meaning = '待查';
    if (typeof translationText === 'string' && translationText !== '未找到释义' && !translationText.includes('分析语境')) {
      meaning = translationText.split('___')[0]; 
    } else if (translationText && translationText.context && !translationText.context.includes('分析语境')) {
      meaning = translationText.context;
    }

    const newCard = {
      id: Date.now() + Math.random(),
      word: wordToAdd,
      translation: meaning,
      ...initCard(),
      isStarred: starIt
    };
    
    updateDeck([newCard, ...deck]);
    alert("已成功添加！");
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px' }}>
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
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflow: 'hidden' }}
        >
          {/* Top Word Section - Fixed Min Height to prevent jumping */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginBottom: '1.5rem', position: 'relative' }}>
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
            justifyContent: 'flex-start',
            marginBottom: '1rem',
            overflowY: 'auto'
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
                    const isTarget = w.includes('**');
                    const displayW = w.replace(/\*\*/g, '');
                    const cleanW = displayW.replace(/[^a-zA-Z\-]/g, '');
                    
                    return (
                      <span 
                        key={i} 
                        onClick={() => handleWordClick(displayW)}
                        style={{ 
                          cursor: 'pointer', 
                          display: 'inline-block', 
                          marginRight: '6px',
                          color: translatedWord === cleanW 
                            ? 'var(--success-color)' 
                            : (isTarget ? '#ef4444' : 'inherit'),
                          fontWeight: isTarget ? 700 : 'inherit',
                          transition: 'color 0.2s'
                        }}
                      >
                        {displayW}
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
                {!deck.find(c => c.word.toLowerCase() === translatedWord.toLowerCase()) && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                    <button 
                      onClick={() => handleAddNewWord(translatedWord, false)}
                      style={{ background: 'var(--text-primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      ➕ 加入词库
                    </button>
                    <button 
                      onClick={() => handleAddNewWord(translatedWord, true)}
                      style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      ⭐ 标星加入
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', paddingTop: '12px', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
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
