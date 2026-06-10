import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSentence, fetchTranslation } from '../services/api';
import { calculateNextReview } from '../utils/sm2';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';

export default function FlashcardScreen({ deck, updateDeck, onBack }) {
  const [sentence, setSentence] = useState('');
  const [loadingSentence, setLoadingSentence] = useState(false);
  const [translatedWord, setTranslatedWord] = useState(null);
  const [translationText, setTranslationText] = useState('');
  const [showOriginalTranslation, setShowOriginalTranslation] = useState(false);

  // Filter cards due for review
  const dueCards = deck.filter(card => card.nextReview <= Date.now());
  const currentCard = dueCards[0];

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
    const context = await generateSentence(currentCard.word);
    setSentence(context);
    setLoadingSentence(false);
  };

  const handleWordClick = async (rawWord) => {
    // Remove punctuation
    const cleanWord = rawWord.replace(/[^a-zA-Z]/g, '');
    if (!cleanWord) return;
    
    setTranslatedWord(cleanWord);
    setTranslationText('查询中...');
    const result = await fetchTranslation(cleanWord);
    setTranslationText(result || '未能找到该词的释义');
  };

  const handleAnswer = (quality) => {
    if (!currentCard) return;
    
    const updatedCard = { ...currentCard, ...calculateNextReview(currentCard, quality) };
    
    // Update the master deck
    // Since currentCard is always dueCards[0], updating the deck will automatically 
    // remove the card from dueCards (if nextReview > now) and the next card will slide in!
    const newDeck = deck.map(c => c.id === updatedCard.id ? updatedCard : c);
    updateDeck(newDeck);
  };

  if (dueCards.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', marginTop: '3rem' }}>
        <CheckCircle size={48} color="var(--success-color)" style={{ margin: '0 auto' }} />
        <h2>今日任务已完成！</h2>
        <p>太棒了，您的词库中没有需要复习的单词了。</p>
        <button className="btn-primary" onClick={onBack} style={{ marginTop: '1rem' }}>返回</button>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Progress Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ color: 'var(--text-secondary)' }}>← 返回</button>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          剩余待复习: {dueCards.length} 词
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentCard.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-panel"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '300px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}>{currentCard.word}</h1>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            {loadingSentence ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>正在生成考研语境...</p>
            ) : (
              <p style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                {sentence.split(' ').map((w, i) => (
                  <span 
                    key={i} 
                    onClick={() => handleWordClick(w)}
                    style={{ 
                      cursor: 'pointer', 
                      display: 'inline-block', 
                      marginRight: '4px',
                      borderBottom: translatedWord === w.replace(/[^a-zA-Z]/g, '') ? '2px solid var(--primary-color)' : 'none'
                    }}
                  >
                    {w}
                  </span>
                ))}
              </p>
            )}
          </div>

          {/* Translation Popup Area */}
          <div style={{ minHeight: '60px' }}>
            {translatedWord && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--bg-gradient)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <strong style={{ color: 'var(--primary-color)' }}>{translatedWord}</strong>: {translationText}
              </motion.div>
            )}
          </div>

          {!showOriginalTranslation ? (
            <button 
              className="btn-primary" 
              style={{ background: 'var(--text-secondary)' }}
              onClick={() => setShowOriginalTranslation(true)}
            >
              显示原词释义
            </button>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 600 }}>
              {currentCard.translation}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
        <button 
          className="glass-panel" 
          onClick={() => handleAnswer(1)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', border: '2px solid transparent', cursor: 'pointer' }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--danger-color)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
        >
          <XCircle color="var(--danger-color)" size={32} />
          <span style={{ fontWeight: 500 }}>不认识</span>
        </button>
        <button 
          className="glass-panel" 
          onClick={() => handleAnswer(4)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', border: '2px solid transparent', cursor: 'pointer' }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--success-color)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
        >
          <CheckCircle color="var(--success-color)" size={32} />
          <span style={{ fontWeight: 500 }}>认识</span>
        </button>
      </div>
    </div>
  );
}
