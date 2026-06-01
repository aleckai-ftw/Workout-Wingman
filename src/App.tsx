import { HashRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { FloatingTimer } from './components/FloatingTimer';
import { HomePage } from './pages/HomePage';
import { ProgramsPage } from './pages/TrackPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { TimerPage } from './pages/TimerPage';
import { DietPage } from './pages/DietPage';
import { SupersetPage } from './pages/SupersetPage';
import { FiveByFivePage } from './pages/FiveByFivePage';
import { IndividualExercisePage } from './pages/IndividualExercisePage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Detail pages (no bottom nav overlap issues — scrollable) */}
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/protein" element={<DietPage />} />
          <Route path="/superset" element={<SupersetPage />} />
          <Route path="/5x5" element={<FiveByFivePage />} />
          <Route path="/exercises" element={<IndividualExercisePage />} />
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
      <FloatingTimer />
      <BottomNav />
    </>
  );
}
