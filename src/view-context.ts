import { createContext, useContext } from 'react';
import type { View } from './preferences';

export interface ViewSettings {
  view: View;
  /** True when the system or the manual setting asks for reduced motion. */
  reducedMotion: boolean;
}

export const ViewContext = createContext<ViewSettings>({ view: 'mortal', reducedMotion: false });

/** The active view and reduced-motion state, provided by the app shell. */
export function useViewSettings(): ViewSettings {
  return useContext(ViewContext);
}