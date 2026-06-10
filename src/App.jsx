import React, { useState, useEffect } from 'react';
import ImportScreen from './components/ImportScreen';
import FlashcardScreen from './components/FlashcardScreen';
import { BookOpen, Settings, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [deck, setDeck] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const savedDeck = localStorage.getItem('vocab_pwa_deck');
    if (savedDeck) setDeck(JSON.parse(savedDeck));
    
    const savedKey = localStorage.getItem('ai_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const updateDeck = (newDeck) => {
    setDeck(newDeck);
    localStorage.setItem('vocab_pwa_deck', JSON.stringify(newDeck));
  };

  const saveApiKey = () => {
    localStorage.setItem('ai_api_key', apiKey.trim());
    setShowSettings(false);
  };

  const handleImport = (newCards) => {
    const merged = [...deck, ...newCards];
    updateDeck(merged);
    setCurrentView('home');
  };

  const dueCount = deck.filter(c => c.nextReview <= Date.now()).length;

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '2rem', position: 'relative' }}>
      
      {/* Settings Icon */}
      <button 
        onClick={() => setShowSettings(true)}
        style={{ position: 'absolute', top: 0, right: 0, padding: '8px', color: 'var(--text-secondary)' }}
      >
        <Settings size={24} />
      </button>

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
                <button onClick={() => setShowSettings(false)}><X size={20} color="var(--text-secondary)" /></button>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                请输入您的 Google Gemini API Key 以解锁 AI 考研例句生成功能。
              </p>
              <input 
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '1rem' }}
              />
              <button className="btn-primary" style={{ width: '100%' }} onClick={saveApiKey}>保存</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentView === 'home' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <div style={{ display: 'inline-flex', background: 'var(--primary-color)', padding: '16px', borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 8px 32px rgba(59,130,246,0.4)' }}>
              <BookOpen color="white" size={40} />
            </div>
            <h1 style={{ fontSize: '2rem' }}>考研情境背词</h1>
            <p style={{ color: 'var(--text-secondary)' }}>让每个单词都回到真实的语境中</p>
          </div>

          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>我的词库</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>总计 {deck.length} 词 · 待复习 <strong style={{color: 'var(--primary-color)'}}>{dueCount}</strong> 词</p>
            </div>
            <button className="btn-primary" onClick={() => setCurrentView('flashcard')} disabled={dueCount === 0}>
              {dueCount > 0 ? '开始背记' : '无任务'}
            </button>
          </div>

          <button className="glass-panel" style={{ display: 'block', width: '100%', textAlign: 'center', color: 'var(--primary-color)', fontWeight: 600 }} onClick={() => setCurrentView('import')}>
            + 导入新词库
          </button>
        </div>
      )}

      {currentView === 'import' && (
        <ImportScreen onImport={handleImport} onBack={() => setCurrentView('home')} />
      )}

      {currentView === 'flashcard' && (
        <FlashcardScreen deck={deck} updateDeck={updateDeck} onBack={() => setCurrentView('home')} />
      )}
    </div>
  );
}

export default App;
