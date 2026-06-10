import React, { useState, useEffect } from 'react';
import ManageScreen from './components/ManageScreen';
import FlashcardScreen from './components/FlashcardScreen';
import { Settings, X, RefreshCw, Cloud } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { syncToCloud, fetchFromCloud } from './services/sync';

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
  const [filterFavorites, setFilterFavorites] = useState(false);
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_api_key') || localStorage.getItem('gemini_api_key') || '');
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('github_token') || '');
  const [gistId, setGistId] = useState(() => localStorage.getItem('gist_id') || '');
  
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Initial pull from cloud if configured
  useEffect(() => {
    const initSync = async () => {
      if (githubToken && gistId) {
        setIsSyncing(true);
        const cloudDeck = await fetchFromCloud();
        // If cloud has data, pull it
        if (cloudDeck && cloudDeck.length > 0) {
          setDeck(cloudDeck);
          setLastSync(new Date().toLocaleTimeString());
        } 
        // If cloud is completely empty but local has data, push local to cloud
        else if (cloudDeck && cloudDeck.length === 0 && deck.length > 0) {
          await syncToCloud(deck);
          setLastSync(new Date().toLocaleTimeString());
        }
        setIsSyncing(false);
      }
    };
    initSync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to local & cloud when deck changes
  useEffect(() => {
    localStorage.setItem('vocab_deck', JSON.stringify(deck));
    
    const timer = setTimeout(async () => {
      if (githubToken && gistId) {
        setIsSyncing(true);
        const success = await syncToCloud(deck);
        if (success) setLastSync(new Date().toLocaleTimeString());
        setIsSyncing(false);
      }
    }, 1000); 

    return () => clearTimeout(timer);
  }, [deck, githubToken, gistId]);

  const handleSaveDeck = (newDeck) => {
    setDeck(newDeck);
    setCurrentView('home');
  };

  const manualSync = async () => {
    if (!githubToken || !gistId) return alert('Please configure GitHub Gist settings first.');
    setIsSyncing(true);
    const cloudDeck = await fetchFromCloud();
    if (cloudDeck) {
      setDeck(cloudDeck);
      setLastSync(new Date().toLocaleTimeString());
    } else if (deck.length > 0) {
      // If gist is empty but we have local, push it
      await syncToCloud(deck);
      setLastSync(new Date().toLocaleTimeString());
    }
    setIsSyncing(false);
  };

  if (currentView === 'manage') {
    return <ManageScreen deck={deck} onSave={handleSaveDeck} onUpdateDeck={setDeck} onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'flashcard') {
    return <FlashcardScreen deck={deck} updateDeck={setDeck} onBack={() => setCurrentView('home')} filterFavorites={filterFavorites} />;
  }

  const starredCount = deck.filter(c => c.isStarred).length;

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '2rem', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Vocabulary.</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {githubToken && gistId && (
            <button onClick={manualSync} disabled={isSyncing} style={{ color: 'var(--text-secondary)', background: 'transparent', padding: '8px', border: 'none', cursor: 'pointer' }}>
              <RefreshCw size={20} className={isSyncing ? "spin-animation" : ""} />
            </button>
          )}
          <button onClick={() => setShowSettings(true)} style={{ color: 'var(--text-secondary)', background: 'transparent', padding: '8px', border: 'none', cursor: 'pointer' }}>
            <Settings size={22} />
          </button>
        </div>
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
              className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.2rem' }}>Settings</h3>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-tertiary)" /></button>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>DEEPSEEK API KEY</label>
                <input 
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1rem', background: '#fafafa' }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Cloud size={16} color="var(--text-secondary)" />
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>GITHUB CLOUD SYNC</label>
                </div>
                <input 
                  type="password"
                  placeholder="GitHub Classic Token (repo/gist)"
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1rem', background: '#fafafa', marginBottom: '12px' }}
                />
                <input 
                  type="text"
                  placeholder="Gist ID"
                  value={gistId}
                  onChange={e => setGistId(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1rem', background: '#fafafa' }}
                />
                {lastSync && <p style={{ fontSize: '0.75rem', color: 'var(--success-color)', marginTop: '8px', textAlign: 'right' }}>Last synced: {lastSync}</p>}
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%' }} 
                onClick={() => { 
                  localStorage.setItem('ai_api_key', apiKey);
                  localStorage.setItem('github_token', githubToken);
                  localStorage.setItem('gist_id', gistId);
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
          {deck.length}
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginBottom: '4rem', fontSize: '1rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          Total Words
        </div>

        <button 
          onClick={() => { setFilterFavorites(false); setCurrentView('flashcard'); }}
          disabled={deck.length === 0}
          className="btn-primary"
          style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', marginBottom: '1rem', borderRadius: '16px' }}
        >
          🚀 Study All (Infinite)
        </button>

        <button 
          onClick={() => { setFilterFavorites(true); setCurrentView('flashcard'); }}
          disabled={starredCount === 0}
          className="btn-secondary"
          style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', marginBottom: '1rem', borderRadius: '16px', background: starredCount > 0 ? '#fffbeb' : 'transparent', borderColor: starredCount > 0 ? '#fde68a' : 'var(--border-color)', color: starredCount > 0 ? '#d97706' : 'var(--text-secondary)' }}
        >
          ⭐ Study Favorites ({starredCount})
        </button>
        
        <button 
          onClick={() => setCurrentView('manage')}
          className="btn-secondary"
          style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', borderRadius: '16px', border: 'none', background: '#f4f4f5' }}
        >
          📝 Manage Deck
        </button>
      </div>

      <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
