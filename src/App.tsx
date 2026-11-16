import { useEffect, useState } from "react";
import { SettingsDialog } from "./components/SettingsDialog";
import {
  breakAfter,
  DEFAULT_SETTINGS,
  durationMs,
  MODE_LABELS,
  MODES,
  type Mode,
  type Settings,
} from "./settings";
import { chime, unlockAudio } from "./sound";
import { useStoredState } from "./storage";
import "./App.css";

const pad = (n: number) => String(n).padStart(2, "0");

function formatClock(ms: number) {
  const total = Math.ceil(ms / 1000);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

const TIMER_KEY = "pomodoro:timer";

interface SavedTimer {
  mode: Mode;
  remaining: number;
  endAt: number | null;
}

function loadTimer(): Partial<SavedTimer> & { expired?: boolean } {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_KEY) ?? "{}") as Partial<SavedTimer>;
    return {
      mode: MODES.includes(saved.mode as Mode) ? saved.mode : undefined,
      remaining: typeof saved.remaining === "number" && saved.remaining > 0 ? saved.remaining : undefined,
      endAt: typeof saved.endAt === "number" ? saved.endAt : undefined,
      expired: typeof saved.endAt === "number" && saved.endAt <= Date.now(),
    };
  } catch {
    return {};
  }
}

function App() {
  const [settings, setSettings] = useStoredState<Settings>("pomodoro:settings", DEFAULT_SETTINGS);
  const [round, setRound] = useStoredState("pomodoro:round", 0);

  const [saved] = useState(loadTimer);
  const [mode, setMode] = useState<Mode>(saved.mode ?? "pomodoro");
  const [remaining, setRemaining] = useState(() =>
    Math.min(saved.remaining ?? Infinity, durationMs(settings, saved.mode ?? "pomodoro")),
  );
  const [endAt, setEndAt] = useState<number | null>(saved.endAt ?? null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const running = endAt !== null;
  const total = durationMs(settings, mode);
  const progress = Math.min(1, Math.max(0, 1 - remaining / total));

  const switchTo = (next: Mode, autoStart = false) => {
    const duration = durationMs(settings, next);
    setMode(next);
    setRemaining(duration);
    setEndAt(autoStart ? Date.now() + duration : null);
  };

  /** End the current session (naturally or by skipping) and move to the next one. */
  const finish = (allowAutoStart = true) => {
    if (mode === "pomodoro") {
      const completed = round + 1;
      setRound(completed);
      switchTo(breakAfter(settings, completed), allowAutoStart && settings.autoStartBreaks);
    } else {
      switchTo("pomodoro", allowAutoStart && settings.autoStartPomodoros);
    }
  };

  // Tick against a wall-clock deadline so throttled background tabs stay accurate.
  useEffect(() => {
    if (endAt === null) return;
    const tick = () => {
      const left = endAt - Date.now();
      if (left > 0) {
        setRemaining(left);
        return;
      }
      clearInterval(handle);
      // The restored session ended while the page was closed: advance quietly, no chime or auto-start.
      if (saved.expired && endAt === saved.endAt) {
        finish(false);
        return;
      }
      if (settings.sound) chime();
      finish();
    };
    const handle = setInterval(tick, 250);
    tick();
    return () => clearInterval(handle);
    // finish() only reads state that is listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endAt, mode, round, settings]);

  // Save the session so a reload resumes it. While running, endAt is enough, so skip per-tick writes.
  const pausedRemaining = running ? null : remaining;
  useEffect(() => {
    try {
      const timer: SavedTimer = { mode, endAt, remaining: pausedRemaining ?? 0 };
      localStorage.setItem(TIMER_KEY, JSON.stringify(timer));
    } catch {
      // Storage unavailable: the timer still works, it just won't survive a reload.
    }
  }, [mode, endAt, pausedRemaining]);

  useEffect(() => {
    document.title = `${formatClock(remaining)} · ${mode === "pomodoro" ? "Focus" : "Break"}`;
  }, [remaining, mode]);

  const toggle = () => {
    unlockAudio();
    if (endAt !== null) {
      setRemaining(Math.max(endAt - Date.now(), 0));
      setEndAt(null);
    } else {
      setEndAt(Date.now() + remaining);
    }
  };

  // Space toggles the timer unless the user is typing or a button has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || settingsOpen) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, button, select, dialog")) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const selectMode = (next: Mode) => {
    if (next === mode) return;
    if (running && !confirm("The timer is running. Switch anyway?")) return;
    switchTo(next);
  };

  // Dots show progress through the current cycle of focus sessions before a long break.
  const interval = settings.longInterval;
  const doneInCycle = mode === "pomodoro" ? round % interval : round > 0 ? ((round - 1) % interval) + 1 : 0;
  const session = round + (mode === "pomodoro" ? 1 : 0);

  return (
    <div className="app" data-mode={mode}>
      <div className="progress" aria-hidden>
        <div className="progress-fill" style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="container">
        <header className="app-header">
          <h1>
            <svg className="app-logo" xmlns="http://www.w3.org/2000/svg" width="22" height="20" fill="none" viewBox="0 0 48 44" aria-label="Pomodoro">
              <path fill="#e5484d" d="M24 13c-9.9 0-19 5.6-19 15.6C5 37.4 13.5 44 24 44s19-6.6 19-15.4C43 18.6 33.9 13 24 13Z" />
              <ellipse cx="14.5" cy="25" rx="4" ry="2.4" fill="#fff" opacity=".35" transform="rotate(-35 14.5 25)" />
              <g fill="#2f9e44">
                <ellipse cx="18" cy="14.5" rx="6" ry="2.3" transform="rotate(12 18 14.5)" />
                <ellipse cx="30" cy="14.5" rx="6" ry="2.3" transform="rotate(-12 30 14.5)" />
                <ellipse cx="20.5" cy="17.5" rx="4.6" ry="2" transform="rotate(-40 20.5 17.5)" />
                <ellipse cx="27.5" cy="17.5" rx="4.6" ry="2" transform="rotate(40 27.5 17.5)" />
                <rect x="22.8" y="6" width="2.4" height="9.5" rx="1.2" />
              </g>
            </svg>
            timer
          </h1>
          <button className="icon-btn" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h8M16 18h4" />
              <circle cx="16" cy="6" r="2" />
              <circle cx="10" cy="12" r="2" />
              <circle cx="14" cy="18" r="2" />
            </svg>
          </button>
        </header>

        <main>
          <section className="timer-card">
            <div className="modes" role="tablist" aria-label="Session type">
              {MODES.map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={m === mode}
                  className={`mode${m === mode ? " active" : ""}`}
                  onClick={() => selectMode(m)}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            <div className="time" aria-live="off">
              {formatClock(remaining)}
            </div>

            <button
              className="cycle"
              title={`Session #${session} · click to reset`}
              aria-label={`Session ${session}, ${doneInCycle} of ${interval} done before a long break. Reset count.`}
              onClick={() => round > 0 && confirm("Reset the session count?") && setRound(0)}
            >
              {Array.from({ length: interval }, (_, i) => (
                <span
                  key={i}
                  className={`dot${i < doneInCycle ? " done" : ""}${mode === "pomodoro" && i === doneInCycle ? " current" : ""}`}
                />
              ))}
            </button>

            <div className="controls">
              {/* Restart only the current phase; the session count is kept. Hidden while the timer is untouched. */}
              <button
                className="icon-btn"
                aria-label="Restart current session"
                title="Restart"
                style={{ visibility: running || remaining < total ? "visible" : "hidden" }}
                onClick={() => switchTo(mode)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12a8 8 0 1 0 2.34-5.66" />
                  <path d="M4 4v4.5h4.5" />
                </svg>
              </button>
              <button className={`btn btn-start${running ? " running" : ""}`} onClick={toggle}>
                {running ? "Pause" : "Start"}
              </button>
              <button
                className="icon-btn skip"
                aria-label="Skip to next session"
                style={{ visibility: running ? "visible" : "hidden" }}
                onClick={() => finish()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 5.5v13a1 1 0 0 0 1.55.83l9.5-6.5a1 1 0 0 0 0-1.66l-9.5-6.5A1 1 0 0 0 6 5.5Z" />
                  <rect x="17" y="5" width="2.5" height="14" rx="1.25" />
                </svg>
              </button>
            </div>
          </section>
        </main>
      </div>

      {settingsOpen && (
        <SettingsDialog
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={(next) => {
            setSettings(next);
            if (!running) setRemaining(durationMs(next, mode));
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
