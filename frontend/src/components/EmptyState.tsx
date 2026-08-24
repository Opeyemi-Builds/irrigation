import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  compact?: boolean;
}

// Calm, consistent placeholder shown wherever live data hasn't arrived yet.
// Deliberately neutral — no error styling, no alarm, no "offline" language.
export default function EmptyState({ icon, title, message, compact }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '10px',
        padding: compact ? '24px 16px' : '44px 24px',
        color: 'var(--text-secondary)',
      }}
    >
      {icon && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: compact ? '40px' : '52px',
            height: compact ? '40px' : '52px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          {icon}
        </div>
      )}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: compact ? '14px' : '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </div>
      {message && (
        <div style={{ fontSize: '13px', lineHeight: 1.5, maxWidth: '340px' }}>{message}</div>
      )}
    </div>
  );
}
