import React, { useState, useEffect } from 'react';
import ManageScreen from './components/ManageScreen';
import FlashcardScreen from './components/FlashcardScreen';
import { Settings, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [deck, setDeck] = useState(() => {
    const saved = localStorage.getItem('vocab_deck');
    if (saved) return JSON.parse(saved);
    const legacy = localStorage.getItem('vocab_pwa_deck');
    if (legacy) {
      localStorage.removeItem('vocab_pwa_deck');
      return JSON.parse(legacy);
    }
    return [];
  });
  const [currentView, setCurrentView] = useState('home'); 
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || localStorage.getItem('ai_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('vocab_deck', JSON.stringify(deck));
  }, [deck]);

  const handleSaveDeck = (newDeck) => {
    setDeck(newDeck);
    setCurrentView('home');
  };

  const dueCards = deck.filter(c => c.nextReview <= Date.now());

  if (currentView === 'manage') {
    return <ManageScreen deck={deck} onSave={handleSaveDeck} onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'flashcard') {
    return <FlashcardScreen deck={deck} updateDeck={setDeck} onBack={() => setCurrentView('home')} />;
  }

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '2rem', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Vocabulary.</h1>
        <button onClick={() => setShowSettings(true)} style={{ color: 'var(--text-secondary)', background: 'transparent', padding: '8px', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}>
          <Settings size={22} />
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.2rem' }}>API Configuration</h3>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-tertiary)" /></button>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Enter your Google Gemini API Key to enable contextual sentence generation.
              </p>
              <input 
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', outline: 'none', fontSize: '1rem', background: '#fafafa' }}
              />
              <button 
                className="btn-primary" 
                style={{ width: '100%' }} 
                onClick={() => { 
                  localStorage.setItem('gemini_api_key', apiKey); 
                  localStorage.setItem('ai_api_key', apiKey);
                  setShowSettings(false); 
                }}
              >
                Save Changes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '-4rem' }}>
        <div style={{ fontSize: '7rem', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.04em' }}>
          {dueCards.length}
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginBottom: '4rem', fontSize: '1rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          Due Today
        </div>

        <button 
          onClick={() => setCurrentView('flashcard')}
          disabled={dueCards.length === 0}
          className="btn-primary"
          style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', marginBottom: '1rem', borderRadius: '16px' }}
        >
          {dueCards.length > 0 ? 'Start Review' : 'All Caught Up'}
        </button>
        
        <button 
          onClick={() => setCurrentView('manage')}
          className="btn-secondary"
          style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', borderRadius: '16px' }}
        >
          Manage Deck ({deck.length})
        </button>
      </div>
    </div>
  );
}

export default App;
