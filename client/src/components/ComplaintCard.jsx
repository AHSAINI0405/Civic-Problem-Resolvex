import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge, CategoryBadge } from './Badges';
import { ThumbsUp, MessageCircle, MapPin, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ComplaintCard({ complaint, onUpvote, showActions = false }) {
  const { _id, title, description, category, priority, status, upvoteCount, location, createdAt, user, isAnonymous, assignedTo } = complaint;

  return (
    <div className="card fade-in-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          <CategoryBadge category={category} />
          <PriorityBadge priority={priority} />
          {assignedTo && (
            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.15)', fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center' }}>
              🏛️ {assignedTo.name || assignedTo}
            </span>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Title */}
      <Link to={`/complaints/${_id}`} style={{ textDecoration: 'none' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, transition: 'color 0.2s' }}
          onMouseEnter={e => e.target.style.color = 'var(--primary)'}
          onMouseLeave={e => e.target.style.color = 'var(--text)'}>
          {title}
        </h3>
      </Link>

      {/* Description */}
      <p className="text-muted text-sm" style={{ lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {description}
      </p>

      {/* Location */}
      {location?.address && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <MapPin size={13} /> {location.address}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center" style={{ paddingTop: 8, borderTop: '1px solid var(--border-solid)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => onUpvote?.(_id)} className="flex items-center gap-1 text-sm"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <ThumbsUp size={13} /> {upvoteCount || 0}
          </button>
          <span className="flex items-center gap-1 text-sm text-muted">
            <MessageCircle size={13} /> Comments
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted">
          {!isAnonymous && user && (
            <span className="flex items-center gap-1"><User size={12} /> {user.name}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={12} /> {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
