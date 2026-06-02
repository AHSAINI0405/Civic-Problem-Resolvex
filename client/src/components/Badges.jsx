export const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>{status?.replace('_', ' ')}</span>
);

export const PriorityBadge = ({ priority }) => {
  const icons = { low: '🟢', medium: '🟡', high: '🟠', critical: '🔴' };
  return (
    <span className={`badge badge-${priority}`}>
      {icons[priority]} {priority}
    </span>
  );
};

export const CategoryBadge = ({ category }) => {
  const icons = {
    roads: '🛣️', water: '💧', electricity: '⚡', sanitation: '🗑️',
    public_safety: '🛡️', parks: '🌳', noise: '🔊', animals: '🐾', other: '📋',
  };
  return (
    <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
      {icons[category] || '📋'} {category?.replace('_', ' ')}
    </span>
  );
};
