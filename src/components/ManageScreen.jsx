import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { initCard } from '../utils/engine';
import { ArrowLeft, Trash2, Star, List } from 'lucide-react';

export default function ManageScreen({ deck, onSave, onBack }) {
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [text, setText] = useState('');

  // We need to keep a reference to the global deck to not lose un-filtered cards
  // when saving a filtered view.
  
  useEffect(() => {
    const activeDeck = filterFavorites ? deck.filter(c => c.isStarred) : deck;
    const rawText = activeDeck.map(card => {
      if (card.translation === '待查') return card.word;
      return `${card.word}\t${card.translation}`;
    }).join('\n');
    setText(rawText);
  }, [deck, filterFavorites]);

  const handleSave = () => {
    const lines = text.split('\n');
    const updatedCards = [];
    const updatedCardIds = new Set();

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const match = trimmedLine.match(/^([a-zA-Z\-]+)[\s]+(.*)$/);
      let word = trimmedLine;
      let translation = '待查';

      if (match) {
        word = match[1].trim();
        translation = match[2].trim();
      }

      const existingCard = deck.find(c => c.word.toLowerCase() === word.toLowerCase());

      if (existingCard) {
        updatedCards.push({
          ...existingCard,
          word,
          translation
        });
        updatedCardIds.add(existingCard.id);
      } else {
        const newCard = {
          id: Date.now() + Math.random(),
          word,
          translation,
          ...initCard()
        };
        // If we are adding a card while in favorites view, should it be starred?
        if (filterFavorites) newCard.isStarred = true;
        updatedCards.push(newCard);
      }
    });

    let newDeck;
    if (filterFavorites) {
      // If we only edited favorites, we keep all non-starred cards intact,
      // and merge in our updatedCards.
      const nonStarredCards = deck.filter(c => !c.isStarred);
      newDeck = [...nonStarredCards, ...updatedCards];
    } else {
      newDeck = updatedCards;
    }

    onSave(newDeck);
  };

  const handleClear = () => {
    if (window.confirm(filterFavorites ? "Are you sure you want to remove all favorites?" : "Are you sure you want to clear the entire deck?")) {
      setText('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={onBack} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
          <ArrowLeft size={20} /> Back
        </button>
        <button onClick={handleClear} style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--danger-color)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
          <Trash2 size={20} />
        </button>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Deck Editor</h2>
        
        <div style={{ display: 'flex', background: 'var(--border-color)', borderRadius: '8px', padding: '4px' }}>
          <button 
            onClick={() => setFilterFavorites(false)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: !filterFavorites ? 'var(--panel-bg)' : 'transparent', color: !filterFavorites ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', boxShadow: !filterFavorites ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
          >
            <List size={14} /> All
          </button>
          <button 
            onClick={() => setFilterFavorites(true)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: filterFavorites ? 'var(--panel-bg)' : 'transparent', color: filterFavorites ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', boxShadow: filterFavorites ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
          >
            <Star size={14} /> Favorites
          </button>
        </div>
      </div>
      
      <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {filterFavorites ? 'Editing starred words only.' : 'Raw text editing. One word per line, followed by its translation.'}
      </p>

      <textarea
        style={{ 
          flex: 1, 
          width: '100%', 
          padding: '20px', 
          borderRadius: '16px', 
          border: '1px solid var(--border-color)', 
          outline: 'none',
          resize: 'none',
          fontFamily: 'monospace',
          fontSize: '1rem',
          background: 'var(--panel-bg)',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          transition: 'border-color 0.2s'
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--text-tertiary)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        placeholder="apple 苹果&#10;abandon 放弃"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleSave}
        className="btn-primary"
        style={{ marginTop: '1.5rem', padding: '1.25rem', fontSize: '1.1rem', borderRadius: '16px' }}
      >
        Save & Overwrite ({text.split('\n').filter(l => l.trim()).length} words)
      </button>
    </motion.div>
  );
}
