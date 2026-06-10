import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { initCard } from '../utils/engine';
import { ArrowLeft, Trash2, Star, List, Settings2, RotateCcw, Edit2 } from 'lucide-react';

export default function ManageScreen({ deck, onSave, onUpdateDeck, onBack }) {
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [text, setText] = useState('');

  const activeDeck = filterFavorites ? deck.filter(c => c.isStarred) : deck;

  useEffect(() => {
    const rawText = activeDeck.map(card => {
      if (card.translation === '待查') return card.word;
      return `${card.word}\t${card.translation}`;
    }).join('\n');
    setText(rawText);
  }, [deck, filterFavorites]);

  const handleSaveText = () => {
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
        if (filterFavorites) newCard.isStarred = true;
        updatedCards.push(newCard);
      }
    });

    let newDeck;
    if (filterFavorites) {
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
      // We don't automatically save on clear to prevent accidental wipes until they click Save.
    }
  };

  const handleResetWeight = (id) => {
    const newDeck = deck.map(c => c.id === id ? { ...c, weight: 10 } : c);
    onUpdateDeck(newDeck);
  };

  const handleEditWeight = (id, oldWeight) => {
    const val = prompt("Enter new weight (1-100):", oldWeight);
    if (val !== null && !isNaN(val) && val.trim() !== '') {
      const newWeight = Math.max(1, Math.min(100, parseInt(val)));
      const newDeck = deck.map(c => c.id === id ? { ...c, weight: newWeight } : c);
      onUpdateDeck(newDeck);
    }
  };

  const handleResetAllWeights = () => {
    if (window.confirm("🚨 ARE YOU SURE?\n\nThis will reset the algorithm weight of ALL words to 10. Your study progress (what you know and don't know) will be lost!")) {
      const newDeck = deck.map(c => ({ ...c, weight: 10 }));
      onUpdateDeck(newDeck);
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
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setShowWeights(!showWeights)} 
            style={{ color: showWeights ? '#4f46e5' : 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Settings2 size={20} /> <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{showWeights ? 'Editor' : 'Weights'}</span>
          </button>
          {!showWeights && (
            <button onClick={handleClear} style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--danger-color)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
              <Trash2 size={20} />
            </button>
          )}
        </div>
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
      
      {!showWeights ? (
        <>
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
            onClick={handleSaveText}
            className="btn-primary"
            style={{ marginTop: '1.5rem', padding: '1.25rem', fontSize: '1.1rem', borderRadius: '16px' }}
          >
            Save & Overwrite ({text.split('\n').filter(l => l.trim()).length} words)
          </button>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Weight Editor: Higher weight = appears more often.
            </p>
            <button 
              onClick={handleResetAllWeights}
              style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Reset All Weights
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', background: '#fafafa', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            {activeDeck.map(card => (
              <div key={card.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {card.word} {card.isStarred && <Star fill="#fbbf24" color="#fbbf24" size={14} />}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{card.translation}</div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weight</span>
                    <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: '1.1rem' }}>{card.weight || 10}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleEditWeight(card.id, card.weight || 10)}
                      style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleResetWeight(card.id)}
                      style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
