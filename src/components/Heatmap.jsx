import React, { useEffect, useState } from 'react';

const Heatmap = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    try {
      const data = localStorage.getItem('study_stats');
      if (data) setStats(JSON.parse(data));
    } catch (e) {}
  }, []);

  // Generate last 60 days
  const days = [];
  const today = new Date();
  
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = stats[dateStr] || 0;
    days.push({ date: dateStr, count });
  }

  // Determine intensity based on max count
  const maxCount = Math.max(...days.map(d => d.count), 1);

  const getColor = (count) => {
    if (count === 0) return 'var(--border-color)';
    const ratio = count / maxCount;
    if (ratio < 0.2) return '#d1fae5'; // emerald-100
    if (ratio < 0.5) return '#6ee7b7'; // emerald-300
    if (ratio < 0.8) return '#10b981'; // emerald-500
    return '#047857'; // emerald-700
  };

  return (
    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Study Activity (Last 60 Days)
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', width: '100%', maxWidth: '300px', justifyContent: 'center' }}>
        {days.map((day, i) => (
          <div
            key={i}
            title={`${day.date}: ${day.count} reviews`}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: getColor(day.count),
              transition: 'transform 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ))}
      </div>
    </div>
  );
};

export default Heatmap;
