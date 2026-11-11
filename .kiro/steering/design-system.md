---
inclusion: always
---

# Design system

Two views share the same token names. Each view sets its own values. The shell switches views by changing the `data-view` attribute (`mortal` or `haunted`) on the root element.

## Tokens: Mortal view

- Colours: `--color-bg` #FFFFFF, `--color-surface` #F4F1EA, `--color-text` #111111, `--color-text-muted` #444444, `--color-accent-flag` #B00020, `--color-border` #595959, `--color-focus` #0B57D0.
- Verdicts and highlights: `--color-verdict-scam` #B00020, `--color-verdict-suspicious` #8A5A00, `--color-verdict-safe` #0B6E4F, `--color-highlight` #FFE08A.
- Haunted-only tokens, kept so both views share names: `--font-family-heading` (the body font), `--color-ghost` #444444, `--color-ghost-ink` #FFFFFF, `--color-ghost-warn` #FFE08A, `--color-candle` #8A5A00, `--candle-glow-strength` 0%, `--color-wax` #8A5A00, `--color-sky-top` #FFFFFF, `--color-sky-bottom` #FFFFFF, `--color-mansion` #595959, `--color-moon` #F4F1EA, `--color-fog` #F4F1EA, `--fog-strength` 0%.
- Typography: `--font-family` system-ui, "Segoe UI", Arial, sans-serif; `--font-size-body` 20px; `--font-size-heading` 32px.
- Spacing and focus: `--space-1` 8px, `--space-2` 16px, `--space-3` 24px, `--space-4` 32px; `--focus-width` 3px.

## Tokens: Haunted view

- Colours: `--color-bg` #0F0B1A, `--color-surface` #1B1430, `--color-text` #F2EEFF, `--color-text-muted` #C9C0E6, `--color-accent-flag` #FF6B81, `--color-border` #8F84B8, `--color-focus` #FFD166.
- Verdicts and highlights: `--color-verdict-scam` #FF6B81, `--color-verdict-suspicious` #FFC857, `--color-verdict-safe` #5FD3A5, `--color-highlight` #5C3A00.
- Mansion and ghosts: `--font-family-heading` 'Creepster', Georgia, serif (h1 to h3 only); `--color-ghost` #EDE8FF, `--color-ghost-ink` #1A1030, `--color-ghost-warn` #8F0022, `--color-candle` #FFB347, `--candle-glow-strength` 14%, `--color-wax` #E9DFC9, `--color-sky-top` #05030B, `--color-sky-bottom` #24163F, `--color-mansion` #07050D, `--color-moon` #F6EFD6, `--color-fog` #C9C0E6, `--fog-strength` 9%.
- Typography: `--font-family` Georgia, "Times New Roman", serif; `--font-size-body` 17px; `--font-size-heading` 30px.
- Spacing and focus: `--space-1` 8px, `--space-2` 16px, `--space-3` 24px, `--space-4` 32px; `--focus-width` 3px.

## Contrast (WCAG 2.1 AA)

- Body text needs a contrast ratio of at least 4.5:1. Body text is under 24px, or under 18.66px when bold.
- Large text (24px or more, or 18.66px or more when bold) and UI component boundaries need at least 3:1.
- These ratios apply in both views and use the WCAG 2.1 contrast calculation.
- The test `src/styles/tokens.test.ts` checks every declared text and background pair. jsdom cannot compute rendered colour, so that test is the contrast check.

## Text size

- Mortal view body text is at least 18px.
- Haunted view body text is at least 16px.

## Keyboard and focus

- Every interactive element works with the keyboard alone.
- Every interactive element shows a visible focus indicator that is at least 2px thick and has at least 3:1 contrast against the colours next to it.
- Click and tap targets are at least 44px high.
- Single-letter shortcuts (R and S in Séance) work only on their own screen, never while typing in a field or with Ctrl, Alt or Meta, and are exposed with `aria-keyshortcuts`.

## Red flags and ghosts

- Colour is never the only signal for a red flag. Each ghost has a visible text label of 1 to 40 characters that names the type of red flag.
- Every ghost comes with a one-line plain-English reason.
- Verdict icons differ by shape: an octagon for likely scam, a triangle for suspicious, a circle with a tick for looks safe. Verdict colours need 3:1 against the background and surface.
- Highlighted words keep 4.5:1 text contrast, carry an underline, and end with the matching flag number.

## Reduced motion

- Reduced motion mode is on when the system reports `prefers-reduced-motion: reduce`, or when the user turns on the manual "Reduce motion" setting.
- In this mode looping, parallax, flicker and ghost movement are replaced by a static presentation.
- The manual setting can only add reduction. It cannot turn motion back on while the system asks for reduced motion.
- The manual setting is saved in the browser and persists across page reloads.
- It also stops the fake-deadline countdown and the score candle's melt.

## Haunted view effects

- Every effect must help the user understand the reason for a red flag.
- No effect may lower the contrast of flagged words or ghost labels below the thresholds above.
- No effect may cover or blur the explanation text. It must stay fully readable.
- Every text block sits on an opaque panel or mark. The backdrop (sky, moon, mansion, bats, fog) stays behind the panels.
- Candle glow tints a panel by at most `--candle-glow-strength` of `--color-candle`. The token test checks text contrast at full glow.
- Ghost effects:
  - Look-alike letters twitch with an outline and a glow.
  - Pressure and threat words bleed.
  - Fake deadlines get a countdown.
  - Link ghosts speak their True Name on hover or focus.
  - Pressing any ghost opens its reason.
  - In Séance, each right answer lights a table candle, and missed ghosts drift up from the words.
- Ghost buttons are at least 44px. Speech bubbles close with Escape and stay open while the pointer is over them.
- Headings may use the heading font. Labels, reasons, ghost labels and the verdict use the body font.
- Nothing flashes more than three times in one second. Flicker only dims a soft glow.
- Continuous animations change only `transform` or `opacity`, and never animate shapes inside a large SVG.
## Styling rules

- Use only `var(--token)` values for colours, spacing and text sizes in CSS. Decorative drawing geometry (backdrop, ghosts, candle) may use fixed lengths.
- Do not use inline `style` attributes. The Content-Security-Policy blocks them in production.
- Transitions in normal mode last at most 100 ms.