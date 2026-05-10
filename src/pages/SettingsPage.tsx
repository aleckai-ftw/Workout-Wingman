import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useProfileStore } from '../stores/profileStore';

export function SettingsPage() {
  const { profile, settings, updateProfile, updateSettings } = useProfileStore();

  const [name, setName] = useState(profile.name);
  const [initials, setInitials] = useState(profile.avatarInitials);
  const [goalG, setGoalG] = useState(String(settings.dailyProteinGoalG));
  const [restSec, setRestSec] = useState(String(settings.defaultRestSeconds));

  function handleSave() {
    updateProfile({ name: name.trim() || 'Athlete', avatarInitials: initials.trim().slice(0, 2).toUpperCase() || 'A' });
    const g = parseInt(goalG, 10);
    const r = parseInt(restSec, 10);
    updateSettings({
      dailyProteinGoalG: isNaN(g) || g <= 0 ? 180 : g,
      defaultRestSeconds: isNaN(r) || r <= 0 ? 90 : r,
    });
    alert('Settings saved!');
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="Settings" />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-20 h-20 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-2xl font-bold">
            {profile.avatarInitials}
          </div>
          <p className="text-lg font-semibold text-[var(--color-text)]">{profile.name}</p>
        </div>

        {/* Profile section */}
        <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm text-right text-[var(--color-text-muted)] bg-transparent focus:outline-none focus:text-[var(--color-text)] w-40"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Avatar Initials</span>
            <input
              type="text"
              value={initials}
              maxLength={2}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              className="text-sm text-right text-[var(--color-text-muted)] bg-transparent focus:outline-none focus:text-[var(--color-text)] w-16"
            />
          </div>
        </section>

        {/* Fitness section */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2 px-1">Fitness</h2>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm font-medium text-[var(--color-text)]">Daily Protein Goal</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={goalG}
                  onChange={(e) => setGoalG(e.target.value)}
                  className="text-sm text-right text-[var(--color-text-muted)] bg-transparent focus:outline-none focus:text-[var(--color-text)] w-16"
                />
                <span className="text-sm text-[var(--color-text-muted)]">g</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm font-medium text-[var(--color-text)]">Default Rest Timer</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={restSec}
                  onChange={(e) => setRestSec(e.target.value)}
                  className="text-sm text-right text-[var(--color-text-muted)] bg-transparent focus:outline-none focus:text-[var(--color-text)] w-16"
                />
                <span className="text-sm text-[var(--color-text-muted)]">sec</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm font-medium text-[var(--color-text)]">Weight Unit</span>
              <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
                {(['lbs', 'kg'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => updateSettings({ weightUnit: unit })}
                    className={`px-3 py-1 text-sm font-medium transition-colors ${
                      settings.weightUnit === unit
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'text-[var(--color-text-muted)]'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* App info */}
        <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium text-[var(--color-text)]">App Version</span>
            <span className="text-sm text-[var(--color-text-muted)]">0.1.0</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Data Storage</span>
            <span className="text-sm text-[var(--color-text-muted)]">Local (browser)</span>
          </div>
        </section>

        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
