import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { initialCardState } from '../utils/sm2';
import { ArrowLeft, Save, Trash2, Info } from 'lucide-react';

export default function ManageScreen({ deck, onSave, onBack }) {
  const [text, setText] = useState('');

  // Convert deck to raw text on load
  useEffect(() => {
    const rawText = deck.map(card => {
      // If translation is '待查', we just export the word
      if (card.translation === '待查') return card.word;
      return `${card.word}\t${card.translation}`;
    }).join('\n');
    setText(rawText);
  }, [deck]);

  const handleSave = () => {
    const lines = text.split('\n');
    const newDeck = [];

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

      // Try to find if this word already existed to preserve its learning progress
      const existingCard = deck.find(c => c.word.toLowerCase() === word.toLowerCase());

      if (existingCard) {
        newDeck.push({
          ...existingCard,
          word,
          translation // Update translation just in case they edited it
        });
      } else {
        newDeck.push({
          id: Date.now() + Math.random(),
          word,
          translation,
          ...initialCardState()
        });
      }
    });

    onSave(newDeck);
  };

  const handleClear = () => {
    if (window.confirm("确定要清空所有单词吗？此操作无法恢复！")) {
      setText('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 max-w-md mx-auto h-screen flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft size={18} /> 返回
        </button>
        <h2 className="text-xl font-bold text-slate-800">词库管理</h2>
        <button onClick={handleClear} className="text-red-500 hover:text-red-700 p-2">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="bg-blue-50 text-blue-800 p-3 rounded-xl mb-4 text-sm flex items-start gap-2">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>这是您的纯文本词库！每一行一个单词。您可以随意修改、删除某一行，或者粘贴新的单词进来。保存后进度会自动同步。</p>
      </div>

      <textarea
        className="flex-1 w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all resize-none shadow-inner text-base font-mono bg-slate-50"
        placeholder="apple 苹果&#10;abandon 放弃"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleSave}
        className="mt-6 w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-200 active:scale-95 transition-all flex justify-center items-center gap-2"
      >
        <Save size={20} />
        保存并覆盖 ({text.split('\n').filter(l => l.trim()).length} 词)
      </button>
    </motion.div>
  );
}
