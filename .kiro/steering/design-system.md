---
inclusion: always
---

# Design system

Two views share the same token names. Each view sets its own values. The shell switches views by changing the `data-view` attribute (`mortal` or `haunted`) on the root element.

## Tokens: Mortal view

- Colours: `--color-bg` #FFFFFF, `--color-surface` #F4F1EA, `--color-text` #111111, `--color-text-muted` #444444, `--color-accent-flag` #B00020, `--color-border` #595959, `--color-focus` #0B57D0.
- Typography: `--font-family` system-ui, "Segoe UI", Arial, sans-serif; `--font-size-body` 20px; `--font-size-heading` 32px.
- Spacing and focus: `--space-1` 8px, `--space-2` 16px, `--space-3` 24px, `--space-4` 32px; `--focus-width` 3px.

## Tokens: Haunted view

- Colours: `--color-bg` #0F0B1A, `--color-surface` #1B1430, `--color-text` #F2EEFF, `--color-text-muted` #C9C0E6, `--color-accent-flag` #FF6B81, `--color-border` #8F84B8, `--color-focus` #FFD166.
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

## Red flags and ghosts

- Colour is never the only signal for a red flag. Each ghost has a visible text label of 1 to 40 characters that names the type of red flag.
- Every ghost comes with a one-line plain-English reason.

## Reduced motion

- Reduced motion mode is on when the system reports `prefers-reduced-motion: reduce`, or when the user turns on the manual "Reduce motion" setting.
- In this mode looping, parallax, flicker and ghost movement are replaced by a static presentation.
- The manual setting can only add reduction. It cannot turn motion back on while the system asks for reduced motion.
- The manual setting is saved in the browser and persists across page reloads.

## Haunted view effects

- Every effect must help the user understand the reason for a red flag.
- No effect may lower the contrast of flagged words or ghost labels below the thresholds above.
- No effect may cover or blur the explanation text. It must stay fully readable.

## Styling rules

- Use only `var(--token)` values in CSS. Do not hard-code colours or sizes.
- Do not use inline `style` attributes. The Content-Security-Policy blocks them in production.
- Transitions in normal mode last at most 100 ms.