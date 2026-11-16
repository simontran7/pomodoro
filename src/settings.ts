export type Mode = "pomodoro" | "short" | "long";

export const MODES: Mode[] = ["pomodoro", "short", "long"];

export const MODE_LABELS: Record<Mode, string> = {
  pomodoro: "Focus",
  short: "Short break",
  long: "Long break",
};

export interface Settings {
  pomodoro: number;
  short: number;
  long: number;
  longInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  sound: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  pomodoro: 25,
  short: 5,
  long: 15,
  longInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  sound: true,
};

export const durationMs = (settings: Settings, mode: Mode) => settings[mode] * 60_000;

/** The break that follows the given number of completed focus sessions. */
export const breakAfter = (settings: Settings, completed: number): Mode =>
  completed > 0 && completed % settings.longInterval === 0 ? "long" : "short";
