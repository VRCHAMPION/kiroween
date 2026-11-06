import { makeFlag } from '../flag';
import type { RedFlag, Rule, Severity } from '../types';

const EXECUTABLE = new Set(['apk', 'exe', 'scr', 'bat', 'cmd', 'com', 'msi', 'js', 'jse', 'vbs', 'vbe', 'wsf', 'jar', 'ps1', 'hta', 'lnk', 'pif', 'iso', 'img']);
const WEB_PAGE = new Set(['html', 'htm', 'shtml', 'xhtml', 'svg']);
const MACRO = new Set(['docm', 'dotm', 'xlsm', 'xltm', 'xlam', 'pptm', 'potm', 'ppam', 'sldm']);
const LEGACY_OFFICE = new Set(['doc', 'xls', 'ppt']);

interface Verdict {
  severity: Severity;
  reason: string;
}

function judge(fileName: string): Verdict | undefined {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) return undefined;
  const ext = fileName.slice(dot + 1).toLowerCase();
  if (ext === 'apk') {
    return { severity: 'high', reason: 'An .apk file installs an app outside the Play Store and can take over your phone.' };
  }
  if (EXECUTABLE.has(ext)) {
    return { severity: 'high', reason: `A .${ext} file is a program that can install harmful software when opened.` };
  }
  if (WEB_PAGE.has(ext)) {
    return { severity: 'high', reason: 'An attached web page can show a fake login form that steals your details.' };
  }
  if (MACRO.has(ext)) {
    return { severity: 'high', reason: `A .${ext} document can run hidden macros that install harmful software.` };
  }
  if (LEGACY_OFFICE.has(ext)) {
    return { severity: 'low', reason: `Older .${ext} documents can contain macros, so open them only from people you trust.` };
  }
  return undefined;
}

/** File names mentioned in the message text, such as "SBI_KYC.apk". Web page and .com names are left out on purpose. */
const BODY_FILE = /(?<![\w.-])[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)*\.(?:apk|exe|scr|bat|msi|vbs|jar|hta|docm|xlsm|pptm)\b/giu;

export const riskyAttachment: Rule = {
  id: 'risky-attachment',
  check(input) {
    const flags: RedFlag[] = [];
    for (const m of input.text.matchAll(BODY_FILE)) {
      const v = judge(m[0]);
      if (!v) continue;
      flags.push(
        makeFlag(
          { type: 'risky-attachment', label: 'Dangerous attachment', ...v, source: 'body', start: m.index, end: m.index + m[0].length },
          input.text,
        ),
      );
    }
    input.attachments.forEach((name, attachmentIndex) => {
      const trimmed = name.trim();
      const v = judge(trimmed);
      if (!v) return;
      const start = name.indexOf(trimmed);
      flags.push(
        makeFlag(
          { type: 'risky-attachment', label: 'Dangerous attachment', ...v, source: 'attachment', start, end: start + trimmed.length, attachmentIndex },
          name,
        ),
      );
    });
    return flags;
  },
};