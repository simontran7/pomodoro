import { useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, type Settings } from "../settings";

type NumberKey = "pomodoro" | "short" | "long" | "longInterval";
type ToggleKey = "autoStartBreaks" | "autoStartPomodoros" | "sound";
type Draft = Record<NumberKey, string> & Record<ToggleKey, boolean>;

const NUMBER_FIELDS: { key: NumberKey; label: string; max: number }[] = [
  { key: "pomodoro", label: "Focus", max: 180 },
  { key: "short", label: "Short break", max: 60 },
  { key: "long", label: "Long break", max: 120 },
];

const TOGGLES: { key: ToggleKey; label: string }[] = [
  { key: "autoStartBreaks", label: "Auto-start breaks" },
  { key: "autoStartPomodoros", label: "Auto-start focus" },
  { key: "sound", label: "Chime when a session ends" },
];

const toDraft = (s: Settings): Draft => ({
  ...s,
  pomodoro: String(s.pomodoro),
  short: String(s.short),
  long: String(s.long),
  longInterval: String(s.longInterval),
});

const clampInt = (raw: string, max: number, fallback: number) => {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, max) : fallback;
};

interface SettingsDialogProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsDialog({ settings, onSave, onClose }: SettingsDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(() => toDraft(settings));

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const save = () => {
    onSave({
      ...draft,
      pomodoro: clampInt(draft.pomodoro, 180, settings.pomodoro),
      short: clampInt(draft.short, 60, settings.short),
      long: clampInt(draft.long, 120, settings.long),
      longInterval: clampInt(draft.longInterval, 12, settings.longInterval),
    });
  };

  return (
    <dialog
      ref={ref}
      className="settings"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <h2>Settings</h2>

        <fieldset>
          <legend>Minutes</legend>
          <div className="number-grid">
            {NUMBER_FIELDS.map(({ key, label, max }) => (
              <label key={key} className="number-field">
                <span>{label}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={max}
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <label className="row-field">
          <span>Long break every</span>
          <span className="inline-input">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={12}
              value={draft.longInterval}
              onChange={(e) => setDraft({ ...draft, longInterval: e.target.value })}
            />
            <span className="dim">sessions</span>
          </span>
        </label>

        {TOGGLES.map(({ key, label }) => (
          <label key={key} className="row-field">
            <span>{label}</span>
            <input
              type="checkbox"
              className="switch"
              checked={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
            />
          </label>
        ))}

        <div className="settings-actions">
          <button type="button" className="link-btn" onClick={() => setDraft(toDraft(DEFAULT_SETTINGS))}>
            Reset defaults
          </button>
          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
