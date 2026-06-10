import React, { useState, useEffect } from 'react';
import ManageScreen from './components/ManageScreen';
import FlashcardScreen from './components/FlashcardScreen';
import { BookOpen, Settings, CheckCircle2 } from 'lucide-react';

function App() {
  const [deck, setDeck] = useState(() => {
    const saved = localStorage.getItem('vocab_deck');
    if (saved) return JSON.parse(saved);
    // Legacy support
    const legacy = localStorage.getItem('vocab_pwa_deck');
    if (legacy) {
      localStorage.removeItem('vocab_pwa_deck');
      return JSON.parse(legacy);
    }
    return [];
  });
  const [currentView, setCurrentView] = useState('home'); // home, manage, flashcard
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
    <div className="min-h-screen p-6 max-w-md mx-auto flex flex-col relative">
      <div className="flex justify-between items-center mb-10 mt-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-2xl shadow-lg shadow-indigo-200">
            <BookOpen size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">考研背词</h1>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="text-slate-400 hover:text-slate-700 transition-colors p-2 bg-white rounded-full shadow-sm">
          <Settings size={22} />
        </button>
      </div>

      {showSettings && (
        <div className="bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/50 mb-8 border border-slate-100 animate-in slide-in-from-top-4 fade-in">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Gemini API Key</label>
          <input 
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
            placeholder="AIzaSy..."
          />
          <button 
            onClick={() => { 
              localStorage.setItem('gemini_api_key', apiKey); 
              localStorage.setItem('ai_api_key', apiKey); // legacy
              setShowSettings(false); 
            }}
            className="mt-3 w-full bg-slate-800 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} /> 保存设置
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        <div className="text-6xl font-black text-slate-800 mb-2 tracking-tighter">
          {dueCards.length}
        </div>
        <div className="text-slate-500 font-medium mb-12">今日待复习</div>

        <button 
          onClick={() => setCurrentView('flashcard')}
          disabled={dueCards.length === 0}
          className="w-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-lg font-bold py-5 rounded-[2rem] shadow-2xl shadow-indigo-200 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all"
        >
          {dueCards.length > 0 ? '🚀 开始背记' : '🎉 今日已完成'}
        </button>
        
        <button 
          onClick={() => setCurrentView('manage')}
          className="mt-4 w-full bg-white text-slate-600 text-base font-semibold py-4 rounded-3xl border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
        >
          📝 管理与编辑词库 ({deck.length})
        </button>
      </div>
    </div>
  );
}

export default App;
