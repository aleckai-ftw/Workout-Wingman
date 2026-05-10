import { NavLink } from 'react-router-dom';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SupersetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <rect x="2" y="10" width="4" height="4" rx="1" />
    <rect x="18" y="10" width="4" height="4" rx="1" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <rect x="7" y="8" width="3" height="8" rx="1" />
    <rect x="14" y="8" width="3" height="8" rx="1" />
  </svg>
);

const FiveByFiveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const ProteinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

const navItems: NavItem[] = [
  { to: '/superset', label: 'Supersets', icon: <SupersetIcon /> },
  { to: '/5x5', label: '5x5', icon: <FiveByFiveIcon /> },
  { to: '/protein', label: 'Protein', icon: <ProteinIcon /> },
  { to: '/', label: 'Home', icon: <HomeIcon /> },
];

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] z-[55]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex flex-col items-center gap-0.5 text-xs font-medium px-3 py-1 rounded-xl transition-colors',
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]',
              ].join(' ')
            }
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
