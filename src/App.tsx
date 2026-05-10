import { HashRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { TrackPage } from './pages/TrackPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { TimerPage } from './pages/TimerPage';
import { ProteinPage } from './pages/ProteinPage';
import { SupersetPage } from './pages/SupersetPage';
import { FiveByFivePage } from './pages/FiveByFivePage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Detail pages (no bottom nav overlap issues — scrollable) */}
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/protein" element={<ProteinPage />} />
          <Route path="/superset" element={<SupersetPage />} />
          <Route path="/5x5" element={<FiveByFivePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}
