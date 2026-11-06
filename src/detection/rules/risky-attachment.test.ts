import { describe, expect, it } from 'vitest';
import { run, spans } from '../test-utils';
import { riskyAttachment } from './risky-attachment';

describe('risky-attachment rule', () => {
  it.each(['SBI_KYC.apk', 'Refund_Form.exe', 'Photos.scr', 'Statement.html', 'Order_Details.docm', 'Budget.xlsm'])(
    'flags %s as high severity',
    (name) => {
      const flags = run(riskyAttachment, { text: '', attachments: [name] });
      expect(flags).toHaveLength(1);
      expect(flags[0]).toMatchObject({ source: 'attachment', attachmentIndex: 0, text: name, severity: 'high' });
    },
  );

  it('rates old Office files as low risk and ignores safe files', () => {
    const flags = run(riskyAttachment, { text: '', attachments: ['notes.doc', 'photo.jpg', 'bill.pdf'] });
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ severity: 'low', attachmentIndex: 0 });
  });

  it('flags dangerous file names mentioned in the message body', () => {
    expect(spans(run(riskyAttachment, 'Download https://x.example/SBI_YONO_Update.apk now'))).toEqual(['SBI_YONO_Update.apk']);
  });

  it('does not flag web pages or domains in the body', () => {
    expect(run(riskyAttachment, 'See https://swiftkart.example/help.html or swiftkart.com')).toEqual([]);
  });
});