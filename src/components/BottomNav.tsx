import { NavLink } from 'react-router-dom';

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

const TimerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <circle cx="12" cy="13" r="8" />
    <polyline points="12 9 12 13 15 15" />
    <line x1="9" y1="2" x2="15" y2="2" />
    <line x1="12" y1="2" x2="12" y2="5" />
  </svg>
);

// Home icon — filled style to stand out
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
    <path d="M12 2.5L3 9.5V20a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1V9.5L12 2.5z" />
  </svg>
);

type SideItem = { to: string; label: string; icon: React.ReactNode };

const leftItems: SideItem[] = [
  { to: '/superset', label: 'Supersets', icon: <SupersetIcon /> },
  { to: '/5x5', label: '5×5', icon: <FiveByFiveIcon /> },
];

const rightItems: SideItem[] = [
  { to: '/protein', label: 'Protein', icon: <ProteinIcon /> },
  { to: '/timer', label: 'Timer', icon: <TimerIcon /> },
];

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] z-[55]">
      <div className="flex items-end justify-around h-16 px-2">
        {/* Left items */}
        {leftItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex flex-col items-center gap-0.5 text-xs font-medium px-3 py-2 rounded-xl transition-colors',
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

        {/* Home — raised center button */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            [
              'flex flex-col items-center gap-1 text-xs font-bold px-1 -mt-5 transition-colors',
              isActive ? 'text-white' : 'text-white',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-primary)] opacity-90 hover:opacity-100'
                }`}
              >
                <HomeIcon />
              </span>
              <span className="text-[var(--color-primary)] font-semibold">Home</span>
            </>
          )}
        </NavLink>

        {/* Right items */}
        {rightItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex flex-col items-center gap-0.5 text-xs font-medium px-3 py-2 rounded-xl transition-colors',
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
