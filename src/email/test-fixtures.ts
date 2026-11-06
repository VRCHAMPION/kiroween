/** Shared .eml fixtures for tests. Every address and link is made up. */

export const utf8 = (text: string) => new TextEncoder().encode(text);
export const b64 = (text: string) => btoa(String.fromCharCode(...utf8(text)));

export const PHISHING_EML = [
  'From: "Vandana Bank" <alerts@vandana-bank-alerts.example>',
  'To: priya@mail.example',
  `Subject: =?UTF-8?B?${b64('Your e-statement \u20b9 notice')}?=`,
  'Authentication-Results: mx.mail.example; spf=fail smtp.mailfrom=vandana-bank-alerts.example; dkim=fail;',
  ' dmarc=fail',
  'Received: from relay.example by mx.mail.example',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="outer"',
  '',
  '--outer',
  'Content-Type: multipart/alternative; boundary="alt"',
  '',
  '--alt',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'Plain version.',
  '--alt',
  'Content-Type: text/html; charset=utf-8',
  'Content-Transfer-Encoding: quoted-printable',
  '',
  '<html><head><style>p{}</style></head><body><p>Your KYC has expired. Log in at <a href=3D"http://203.0.113.45/vb">https://www.vandanabank.example/login</a></p></body></html>',
  '--alt--',
  '--outer',
  'Content-Type: application/vnd.android.package-archive; name="VB_Update.apk"',
  'Content-Disposition: attachment; filename="VB_Update.apk"',
  'Content-Transfer-Encoding: base64',
  '',
  'UEsDBA==',
  '--outer--',
  '',
].join('\r\n');
