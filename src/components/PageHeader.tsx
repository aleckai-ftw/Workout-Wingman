import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export function PageHeader({ title, showBack = false, actions }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center gap-3 px-5 py-4 bg-white border-b border-[var(--color-border)]">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          aria-label="Go back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-lg font-semibold text-[var(--color-text)]">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
