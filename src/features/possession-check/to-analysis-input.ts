import type { AnalysisInput } from '../../detection';
import type { ParsedEmail } from '../../email/parse-eml';

/** Builds the engine input for an opened email. The screen and the evaluation script both use it. */
export function toAnalysisInput(email: ParsedEmail): AnalysisInput {
  return { text: email.body, headers: email.headerText, attachments: email.attachments };
}
