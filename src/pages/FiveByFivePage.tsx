import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useFiveByFiveStore } from '../stores/fiveByFiveStore';
import type { FxFExerciseDef, FxFSession, FxFSessionExercise, FxFSetState, FxFWorkoutKey } from '../types';

// ─── Set Circle ───────────────────────────────────────────────────────────────

function SetCircle({
  state,
  number,
  onTap,
}: {
  state: FxFSetState;
  number: number;
  onTap: () => void;
}) {
  if (state === 'done') {
    return (
      <button
        onClick={onTap}
        className="w-12 h-12 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-5 h-5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    );
  }
  if (state === 'failed') {
    return (
      <button
        onClick={onTap}
        className="w-12 h-12 rounded-full bg-red-500 border-2 border-red-500 flex items-center justify-center transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-5 h-5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    );
  }
  return (
    <button
      onClick={onTap}
      className="w-12 h-12 rounded-full border-2 border-[var(--color-border)] bg-white flex items-center justify-center transition-all"
    >
      <span className="text-sm font-bold text-[var(--color-text-muted)]">{number}</span>
    </button>
  );
}

// ─── Session exercise card ────────────────────────────────────────────────────

function SessionExCard({
  exercise,
  exIdx,
  onToggle,
  onAdjust,
}: {
  exercise: FxFSessionExercise;
  exIdx: number;
  onToggle: (exIdx: number, setIdx: number) => void;
  onAdjust: (exIdx: number, delta: number) => void;
}) {
  const allDone = exercise.sets.every((s) => s.state === 'done');
  const failedIdx = exercise.sets.findIndex((s) => s.state === 'failed');
  const hasFailed = failedIdx !== -1;

  return (
    <div
      className={`bg-white rounded-2xl border-2 p-4 space-y-4 transition-colors ${
        allDone
          ? 'border-green-400'
          : hasFailed
          ? 'border-red-400'
          : 'border-[var(--color-border)]'
      }`}
    >
      {/* Name + +5 button */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[var(--color-text)]">{exercise.name}</h3>
        <button
          onClick={() => onAdjust(exIdx, 5)}
          className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] border-2 border-[var(--color-primary)] rounded-full px-2.5 py-1 active:bg-[var(--color-primary)] active:text-white transition-colors"
        >
          +5 lbs
        </button>
      </div>

      {/* Weight */}
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-black text-[var(--color-text)]">{exercise.weightLbs}</span>
          <span className="text-base font-medium text-[var(--color-text-muted)]">
            lbs &times; {exercise.targetReps} reps &middot; {exercise.numSets} set{exercise.numSets !== 1 ? 's' : ''}
          </span>
        </div>
        {exercise.lastWeightLbs !== null && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Last session: {exercise.lastWeightLbs} lbs{' '}
            {exercise.lastOutcome === 'success' ? (
              <span className="text-green-600 font-semibold">&#10003; success</span>
            ) : exercise.lastOutcome === 'failure' ? (
              <span className="text-red-500 font-semibold">&#10007; failure</span>
            ) : null}
          </p>
        )}
      </div>

      {/* Set circles — tap to cycle: pending → done → failed → pending */}
      <div className="flex justify-between gap-1">
        {exercise.sets.map((st, si) => (
          <SetCircle
            key={si}
            state={st.state}
            number={si + 1}
            onTap={() => onToggle(exIdx, si)}
          />
        ))}
      </div>

      {/* Status banner */}
      {allDone && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-green-600 shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-xs font-semibold text-green-700">
            All {exercise.numSets} set{exercise.numSets !== 1 ? 's' : ''} done! +5 lbs will be added next session.
          </span>
        </div>
      )}
      {hasFailed && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-red-600 shrink-0">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <span className="text-xs font-semibold text-red-700">
            Failed at set {failedIdx + 1}. Next session: &minus;5 lbs, &times;7 reps.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Plan exercise row ────────────────────────────────────────────────────────

function PlanExRow({
  def,
  editing,
  onDelete,
  onWeightChange,
}: {
  def: FxFExerciseDef;
  editing: boolean;
  onDelete: () => void;
  onWeightChange: (w: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
      {editing && (
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text)] truncate">{def.name}</p>
        {def.lastOutcome && def.lastWeightLbs !== null && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Last: {def.lastWeightLbs} lbs{' '}
            {def.lastOutcome === 'success' ? (
              <span className="text-green-600 font-medium">&#10003;</span>
            ) : (
              <span className="text-red-500 font-medium">&#10007;</span>
            )}
          </p>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min="0"
            step="5"
            value={def.weightLbs}
            onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1.5 rounded-lg border border-[var(--color-border)] text-sm text-center focus:outline-none focus:border-[var(--color-primary)]"
          />
          <span className="text-xs text-[var(--color-text-muted)]">lbs</span>
        </div>
      ) : (
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-[var(--color-text)]">{def.weightLbs} lbs</p>
          <p className="text-xs text-[var(--color-text-muted)]">{def.numSets}&times;{def.targetReps}</p>
        </div>
      )}
    </div>
  );
}

// ─── Workout plan card ────────────────────────────────────────────────────────

function WorkoutPlanCard({
  workout,
  defs,
  lastSession,
  editing,
  onStart,
  onToggleEdit,
  onDelete,
  onWeightChange,
  onAddExercise,
}: {
  workout: FxFWorkoutKey;
  defs: FxFExerciseDef[];
  lastSession: FxFSession | undefined;
  editing: boolean;
  onStart: () => void;
  onToggleEdit: () => void;
  onDelete: (defId: string) => void;
  onWeightChange: (defId: string, w: number) => void;
  onAddExercise: (name: string, weight: number, numSets: number) => void;
}) {
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('45');
  const [newNumSets, setNewNumSets] = useState(5);

  const PRESET_EXERCISES = [
    { name: 'Squat', sets: 5 },
    { name: 'Bench Press', sets: 5 },
    { name: 'Barbell Row', sets: 5 },
    { name: 'Overhead Press', sets: 5 },
    { name: 'Deadlift', sets: 1 },
    { name: 'Pull Up', sets: 5 },
    { name: 'Chin Up', sets: 5 },
  ];

  function handleAdd() {
    if (!newName.trim()) return;
    onAddExercise(newName.trim(), parseFloat(newWeight) || 45, newNumSets);
    setNewName('');
    setNewWeight('45');
    setNewNumSets(5);
  }

  const lastDate = lastSession
    ? new Date(lastSession.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div>
          <h2 className="font-bold text-[var(--color-text)]">Workout {workout}</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {lastDate ? `Last done: ${lastDate}` : 'Never done'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleEdit}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              editing
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
            }`}
          >
            {editing ? 'Done' : 'Edit'}
          </button>
          {!editing && (
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[var(--color-primary)] px-4 py-1.5 rounded-full"
            >
              Start
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Exercise list */}
      <div className="px-4">
        {defs.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">
            No exercises. Tap Edit to add some.
          </p>
        ) : (
          defs.map((def) => (
            <PlanExRow
              key={def.id}
              def={def}
              editing={editing}
              onDelete={() => onDelete(def.id)}
              onWeightChange={(w) => onWeightChange(def.id, w)}
            />
          ))
        )}
      </div>

      {/* Add exercise form (edit mode only) */}
      {editing && (
        <div className="px-4 pb-4 pt-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
            Add Exercise
          </p>

          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_EXERCISES.filter(
              (p) => !defs.some((d) => d.name.toLowerCase() === p.name.toLowerCase()),
            ).map((p) => (
              <button
                key={p.name}
                onClick={() => { setNewName(p.name); setNewNumSets(p.sets); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  newName === p.name
                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] bg-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Name input */}
          <input
            type="text"
            placeholder="Or type a custom exercise name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
          />

          {/* Weight + sets row */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="5"
              placeholder="45"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="w-20 px-2 py-2 rounded-lg border border-[var(--color-border)] text-sm text-center focus:outline-none focus:border-[var(--color-primary)]"
            />
            <span className="text-xs text-[var(--color-text-muted)]">lbs</span>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-[var(--color-text-muted)]">Sets:</span>
              {[1, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setNewNumSets(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors ${
                    newNumSets === n
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] bg-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="w-9 h-9 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center disabled:opacity-40 shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FiveByFivePage() {
  const {
    plan,
    sessions,
    activeSessionId,
    startSession,
    toggleSetState,
    adjustSessionWeight,
    completeSession,
    cancelSession,
    addExerciseToPlan,
    removeExerciseFromPlan,
    setPlanExerciseWeight,
  } = useFiveByFiveStore();

  const [editingWorkout, setEditingWorkout] = useState<FxFWorkoutKey | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId && !s.completed);

  function lastSessionOf(workout: FxFWorkoutKey) {
    return sessions.filter((s) => s.workout === workout && s.completed).at(-1);
  }

  // ─── Active session view ──────────────────────────────────────────────────

  if (activeSession) {
    const sessionDate = new Date(activeSession.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    return (
      <div className="flex flex-col flex-1">
        <PageHeader
          title={`Workout ${activeSession.workout} — ${sessionDate}`}
          showBack={false}
          actions={
            <button
              onClick={() => cancelSession(activeSession.id)}
              className="text-xs font-semibold text-[var(--color-danger)] border border-[var(--color-danger)] px-3 py-1.5 rounded-full"
            >
              Cancel
            </button>
          }
        />
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            Tap a circle to mark a set. First tap = done, second = failed, third = undo.
          </p>
          {activeSession.exercises.map((ex, exIdx) => (
            <SessionExCard
              key={exIdx}
              exercise={ex}
              exIdx={exIdx}
              onToggle={(ei, si) => toggleSetState(activeSession.id, ei, si)}
              onAdjust={(ei, delta) => adjustSessionWeight(activeSession.id, ei, delta)}
            />
          ))}
          <button
            onClick={() => completeSession(activeSession.id)}
            className="w-full py-4 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm"
          >
            Complete Workout
          </button>
        </div>
      </div>
    );
  }

  // ─── Plan view ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title="5×5 Tracker" showBack />
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <p className="text-xs text-[var(--color-text-muted)]">
          Complete all 5 sets &rarr; +5 lbs next session. Fail any set &rarr; &minus;5 lbs, &times;7 reps.
        </p>

        {(['A', 'B'] as FxFWorkoutKey[]).map((workout) => (
          <WorkoutPlanCard
            key={workout}
            workout={workout}
            defs={plan[workout]}
            lastSession={lastSessionOf(workout)}
            editing={editingWorkout === workout}
            onStart={() => startSession(workout)}
            onToggleEdit={() =>
              setEditingWorkout(editingWorkout === workout ? null : workout)
            }
            onDelete={(defId) => removeExerciseFromPlan(workout, defId)}
            onWeightChange={(defId, w) => setPlanExerciseWeight(workout, defId, w)}
            onAddExercise={(name, weight, numSets) => addExerciseToPlan(workout, name, weight, numSets)}
          />
        ))}

        {/* Recent sessions */}
        {sessions.filter((s) => s.completed).length > 0 && (
          <section className="pb-4">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
              Recent Sessions
            </h2>
            <div className="space-y-2">
              {sessions
                .filter((s) => s.completed)
                .slice()
                .reverse()
                .slice(0, 5)
                .map((sess) => {
                  const successCount = sess.exercises.filter((ex) =>
                    ex.sets.every((st) => st.state === 'done'),
                  ).length;
                  const failureCount = sess.exercises.filter((ex) =>
                    ex.sets.some((st) => st.state === 'failed'),
                  ).length;
                  return (
                    <div
                      key={sess.id}
                      className="bg-white rounded-xl border border-[var(--color-border)] px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          Workout {sess.workout}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {new Date(sess.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {successCount > 0 && (
                          <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            {successCount} &#10003;
                          </span>
                        )}
                        {failureCount > 0 && (
                          <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            {failureCount} &#10007;
                          </span>
                        )}
                        {successCount === 0 && failureCount === 0 && (
                          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
                            Partial
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
