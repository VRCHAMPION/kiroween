export { analyse } from './analyse';
export { normaliseConfusables } from './normalise';
export { lookalikeParts, type CharRange } from './brands';
export { parseHost, registrableDomain } from './links';
export { scoreFlags, verdictFor, LIKELY_SCAM_AT, SUSPICIOUS_AT, MAX_SCORE } from './score';
export { FLAG_TYPES } from './types';
export type { AnalysisInput, AnalysisResult, FlagSource, FlagType, RedFlag, Severity, Verdict } from './types';