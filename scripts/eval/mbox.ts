/** Reading saved messages: a file with one message, or an mbox file holding many. Pure string code. */

const ENVELOPE = /^From .*$/;

/** True when the first line is an mbox envelope line such as "From a@b.example  Thu Aug 22 12:36:23 2002". */
export function startsWithEnvelope(raw: string): boolean {
  return ENVELOPE.test(raw.split('\n', 1)[0].replace(/\r$/, ''));
}

/**
 * Splits a file into messages. The "From " envelope line of each message is always dropped (it is not a
 * header and would break header parsing), messages are split on "From " lines that follow a blank line,
 * and ">From " in bodies is turned back into "From ". A file without an envelope line is one message.
 */
export function splitMessages(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  if (!startsWithEnvelope(raw)) {
    return raw.trim() === '' ? [] : [lines.join('\n')];
  }
  const messages: string[][] = [];
  let current: string[] | undefined;
  let previousBlank = true;
  for (const line of lines) {
    if (previousBlank && ENVELOPE.test(line)) {
      current = [];
      messages.push(current);
      previousBlank = false;
      continue;
    }
    if (current) current.push(line.startsWith('>From ') ? line.slice(1) : line);
    previousBlank = line === '';
  }
  return messages.map((m) => m.join('\n')).filter((m) => m.trim() !== '');
}