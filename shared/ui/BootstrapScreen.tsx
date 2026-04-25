import type { CSSProperties } from 'react';

type BootstrapScreenProps = {
  title: string;
  message: string;
  tone?: 'loading' | 'error';
  product?: 'host' | 'catalog' | 'profile';
};

const productThemes: Record<NonNullable<BootstrapScreenProps['product']>, { background: string; border: string; accent: string }> = {
  host: {
    background: 'linear-gradient(180deg, #020617 0%, #111827 100%)',
    border: 'rgba(56, 189, 248, 0.24)',
    accent: '#38bdf8',
  },
  catalog: {
    background: 'linear-gradient(180deg, #e0f2fe 0%, #f8fafc 100%)',
    border: 'rgba(14, 165, 233, 0.18)',
    accent: '#0284c7',
  },
  profile: {
    background: 'linear-gradient(180deg, #111827 0%, #1f2937 100%)',
    border: 'rgba(167, 139, 250, 0.18)',
    accent: '#a78bfa',
  },
};

export function BootstrapScreen({ title, message, tone = 'loading', product = 'host' }: BootstrapScreenProps) {
  const theme = productThemes[product];
  const isDarkTheme = product !== 'catalog';

  const pageStyle: CSSProperties = {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '2rem',
    background: theme.background,
    color: isDarkTheme ? '#e2e8f0' : '#0f172a',
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const cardStyle: CSSProperties = {
    width: 'min(100%, 42rem)',
    padding: '1.5rem',
    borderRadius: '1.25rem',
    border: `1px solid ${tone === 'error' ? 'rgba(248, 113, 113, 0.34)' : theme.border}`,
    background: isDarkTheme ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255, 255, 255, 0.88)',
    boxShadow: isDarkTheme ? '0 24px 60px rgba(2, 6, 23, 0.35)' : '0 18px 48px rgba(14, 116, 144, 0.12)',
  };

  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    marginBottom: '0.75rem',
    color: tone === 'error' ? '#fca5a5' : theme.accent,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  };

  return (
    <div style={pageStyle}>
      <section style={cardStyle}>
        <span style={badgeStyle}>{tone === 'error' ? 'Bootstrap error' : 'Starting application'}</span>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.9rem, 4vw, 2.8rem)' }}>{title}</h1>
        <p style={{ margin: '0.85rem 0 0', color: isDarkTheme ? '#cbd5e1' : '#475569' }}>{message}</p>
      </section>
    </div>
  );
}