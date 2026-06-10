import React, { useState, useEffect } from 'react';
import ManageScreen from './components/ManageScreen';
import FlashcardScreen from './components/FlashcardScreen';
import { BookOpen, Settings, X } from 'lucide-react';
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
    <div style={{ paddingTop: '2rem', paddingBottom: '2rem', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--primary-color)', color: 'white', padding: '10px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)' }}>
            <BookOpen size={28} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>考研背词</h1>
        </div>
        <button onClick={() => setShowSettings(true)} style={{ color: 'var(--text-secondary)', background: 'white', padding: '10px', borderRadius: '50%', boxShadow: 'var(--glass-shadow)', border: 'none', cursor: 'pointer' }}>
          <Settings size={24} />
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel" style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.95)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>API 设置</h3>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-secondary)" /></button>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                请输入您的 API Key 以解锁 AI 考研例句生成功能。
              </p>
              <input 
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '1rem', outline: 'none' }}
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
                保存设置
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '-2rem' }}>
        <div style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
          {dueCards.length}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '3rem', fontSize: '1.1rem' }}>
          今日待复习
        </div>

        <button 
          onClick={() => setCurrentView('flashcard')}
          disabled={dueCards.length === 0}
          className="btn-primary"
          style={{ width: '100%', padding: '1.5rem', fontSize: '1.2rem', marginBottom: '1rem', opacity: dueCards.length === 0 ? 0.5 : 1 }}
        >
          {dueCards.length > 0 ? '🚀 开始背记' : '🎉 今日已完成'}
        </button>
        
        <button 
          onClick={() => setCurrentView('manage')}
          className="glass-panel"
          style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', fontWeight: 600, border: '2px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.4)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }}
        >
          📝 管理与编辑词库 ({deck.length})
        </button>
      </div>
    </div>
  );
}

export default App;
