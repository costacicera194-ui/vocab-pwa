import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { initialCardState } from '../utils/sm2';
import { ArrowLeft, Save, Trash2, Info } from 'lucide-react';

export default function ManageScreen({ deck, onSave, onBack }) {
  const [text, setText] = useState('');

  useEffect(() => {
    const rawText = deck.map(card => {
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

      const existingCard = deck.find(c => c.word.toLowerCase() === word.toLowerCase());

      if (existingCard) {
        newDeck.push({
          ...existingCard,
          word,
          translation
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
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1.5rem 0' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={onBack} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '1rem' }}>
          <ArrowLeft size={20} /> 返回
        </button>
        <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>词库管理</h2>
        <button onClick={handleClear} style={{ color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <Trash2 size={22} />
        </button>
      </div>

      <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', padding: '12px', borderRadius: '12px', marginBottom: '1rem', display: 'flex', gap: '8px', fontSize: '0.9rem', lineHeight: 1.5 }}>
        <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ margin: 0 }}>这是您的纯文本词库！每一行一个单词。您可以随意修改、删除某一行，或者粘贴新的单词进来。保存后进度会自动同步。</p>
      </div>

      <textarea
        style={{ 
          flex: 1, 
          width: '100%', 
          padding: '16px', 
          borderRadius: '16px', 
          border: '2px solid rgba(0,0,0,0.05)', 
          outline: 'none',
          resize: 'none',
          fontFamily: 'monospace',
          fontSize: '1rem',
          background: 'rgba(255,255,255,0.7)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
          lineHeight: 1.6
        }}
        placeholder="apple 苹果&#10;abandon 放弃"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleSave}
        className="btn-primary"
        style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '1.2rem', fontSize: '1.1rem' }}
      >
        <Save size={20} />
        保存并覆盖 ({text.split('\n').filter(l => l.trim()).length} 词)
      </button>
    </motion.div>
  );
}
