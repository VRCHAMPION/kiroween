export type View = 'mortal' | 'haunted';

export const VIEW_KEY = 'phantom-inbox:view';
export const REDUCED_MOTION_KEY = 'phantom-inbox:reduced-motion';

export function parseView(value: unknown): View {
  return value === 'haunted' ? 'haunted' : 'mortal';
}

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable or full: keep working with in-memory state.
  }
}

export function readView(): View {
  return parseView(readItem(VIEW_KEY));
}

export function writeView(view: View): void {
  writeItem(VIEW_KEY, view);
}

export function readManualReducedMotion(): boolean {
  return readItem(REDUCED_MOTION_KEY) === 'true';
}

export function writeManualReducedMotion(value: boolean): void {
  writeItem(REDUCED_MOTION_KEY, value ? 'true' : 'false');
}

export function resolveReducedMotion(systemReduces: boolean, manual: boolean): boolean {
  return systemReduces || manual;
}