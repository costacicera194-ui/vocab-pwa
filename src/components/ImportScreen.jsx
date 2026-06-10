import React, { useState } from 'react';
import { initialCardState } from '../utils/sm2';
import { motion } from 'framer-motion';

export default function ImportScreen({ onImport }) {
  const [text, setText] = useState('');

  const handleImport = () => {
    if (!text.trim()) return;

    const lines = text.split('\n');
    const parsedCards = [];

    lines.forEach(line => {
      // Extract the english word part and the rest as translation
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Match English letters/hyphens at the start, followed by space, then the rest
      const match = trimmedLine.match(/^([a-zA-Z\-]+)[\s]+(.*)$/);
      
      if (match) {
        parsedCards.push({
          id: Date.now() + Math.random(),
          word: match[1].trim(),
          translation: match[2].trim(),
          ...initialCardState()
        });
      } else {
        // Fallback if no translation provided or pattern doesn't match
        parsedCards.push({
          id: Date.now() + Math.random(),
          word: trimmedLine,
          translation: '待查',
          ...initialCardState()
        });
      }
    });

    onImport(parsedCards);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel" 
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}
    >
      <h2 style={{ textAlign: 'center', color: 'var(--primary-color)' }}>批量导入词库</h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        请从 Excel 或记事本复制粘贴。格式：单词与翻译之间用空格或 Tab 分隔，每行一个。
      </p>
      
      <textarea 
        rows={10} 
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="apple  苹果&#10;abandon  放弃"
      />
      
      <button className="btn-primary" onClick={handleImport}>
        立即导入 ({text.trim() ? text.split('\n').filter(l=>l.trim()).length : 0} 行)
      </button>
    </motion.div>
  );
}
