import type { FlagType, Verdict } from '../detection';

export type Channel = 'email' | 'sms' | 'whatsapp';

export interface SampleMessage {
  id: string;
  channel: Channel;
  title: string;
  text: string;
  headers?: Readonly<Record<string, string>>;
  attachments?: readonly string[];
  expectedVerdict: Verdict;
  /** Flag types this sample is expected to trigger (scams only). */
  expectedFlags: readonly FlagType[];
}

/**
 * Practice messages. Every person, number, brand domain and link here is made up.
 * Scams imitate real brand names only inside fake domains, so the engine can be shown
 * catching the imitation.
 */
export const SAMPLES: readonly SampleMessage[] = [
  {
    id: 'scam-kyc-expiry',
    channel: 'sms',
    title: 'Bank KYC has "expired"',
    text: 'Dear customer, your Vandana Bank KYC has expired. Your account will be blocked within 24 hours. Update KYC now: https://bit.ly/vb-kyc-2291 - Team VB',
    expectedVerdict: 'likely scam',
    expectedFlags: ['kyc-expiry', 'threat', 'urgency', 'url-shortener'],
  },
  {
    id: 'scam-paypal-homoglyph',
    channel: 'email',
    title: 'PayPal account "limited"',
    headers: {
      From: 'PayPal Service <service@paypa1-secure.example>',
      To: 'priya.sharma@mail.example',
      Subject: 'Action needed: your account is limited',
      'Authentication-Results': 'mx.mail.example; spf=fail smtp.mailfrom=paypa1-secure.example; dkim=none; dmarc=fail header.from=paypa1-secure.example',
    },
    text: 'Dear customer,\n\nWe noticed unusual activity on your account. Please confirm your password and card details at https://paypa1-secure.example/login to restore access.\n\nIf you do not respond today itself, your account will be suspended.\n\nPayPal Security Team',
    expectedVerdict: 'likely scam',
    expectedFlags: ['lookalike-domain', 'email-auth-fail', 'sensitive-info-request', 'urgency', 'threat'],
  },
  {
    id: 'scam-bank-link-mismatch',
    channel: 'email',
    title: 'Bank statement with a hidden link',
    headers: {
      From: 'Vandana Bank <statements@vandana-bank-alerts.example>',
      Subject: 'Your e-statement needs verification',
      'Authentication-Results': 'mx.mail.example; spf=pass smtp.mailfrom=vandana-bank-alerts.example; dkim=fail; dmarc=none',
    },
    text: 'Dear Customer,\n\nYour monthly e-statement is on hold. Log in at <a href="http://203.0.113.45/vb/login.php">https://www.vandanabank.example/secure-login</a> and enter your net banking password and OTP to view it.\n\nRegards,\nVandana Bank',
    attachments: ['Statement_Verification.html', 'e-Statement_Viewer.scr'],
    expectedVerdict: 'likely scam',
    expectedFlags: ['link-text-mismatch', 'ip-link', 'sensitive-info-request', 'email-auth-fail', 'risky-attachment'],
  },
  {
    id: 'scam-courier-customs',
    channel: 'sms',
    title: 'Parcel held at customs',
    text: 'IndiaPost: Your parcel is held at customs. Pay the customs fee of Rs 49 within 12 hours or it will be returned: https://indiapost-redelivery.top/pay',
    expectedVerdict: 'likely scam',
    expectedFlags: ['courier-fee', 'urgency', 'risky-tld', 'lookalike-domain'],
  },
  {
    id: 'scam-electricity',
    channel: 'sms',
    title: 'Power cut "tonight"',
    text: 'Dear consumer, your electricity power will be disconnected tonight at 9.30 pm because your previous month bill was not updated. Please contact our electricity officer immediately on 90000 12345 and install the AnyDesk app so we can update your bill.',
    expectedVerdict: 'likely scam',
    expectedFlags: ['electricity-disconnection', 'urgency', 'remote-access-app'],
  },
  {
    id: 'scam-upi-refund',
    channel: 'whatsapp',
    title: 'Refund that needs your UPI PIN',
    text: 'Hello sir, this is Karan from the SwiftKart refund desk. Your refund of \u20b92,499 is ready. To receive the refund, approve the collect request on your UPI app and enter your UPI PIN.',
    expectedVerdict: 'likely scam',
    expectedFlags: ['upi-refund', 'payment-request', 'sensitive-info-request'],
  },
  {
    id: 'scam-job-task',
    channel: 'whatsapp',
    title: 'Easy money for liking videos',
    text: 'Hi! We are hiring for part-time work from home. Earn \u20b93,000 daily by liking YouTube videos. Simple tasks, daily payment. Limited seats, register now: https://cutt.ly/task-earn-77',
    expectedVerdict: 'likely scam',
    expectedFlags: ['job-task-scam', 'urgency', 'url-shortener'],
  },
  {
    id: 'scam-digital-arrest',
    channel: 'whatsapp',
    title: 'Fake officer and "digital arrest"',
    text: 'This is Inspector Vikram Rao from the CBI cyber crime department. A parcel booked in your name containing drugs was seized at the airport. An arrest warrant has been issued against you. You are now under digital arrest. Stay on the video call and do not tell your family. To clear your name, transfer \u20b91,50,000 or buy Google Play gift cards and share the codes.',
    expectedVerdict: 'likely scam',
    expectedFlags: ['digital-arrest', 'threat', 'payment-request', 'courier-fee'],
  },
  {
    id: 'scam-amazon-rn',
    channel: 'email',
    title: 'Order problem with risky files',
    headers: {
      From: 'Amazon Orders <no-reply@arnazon-support.example>',
      Subject: 'Your account is locked',
    },
    text: 'Hello,\n\nYour account is locked because of a failed payment. Open the attached order details, click Enable Editing, then run the refund form to unlock your account.\n\nCustomer Support',
    attachments: ['Order_Details.docm', 'Refund_Form.exe'],
    expectedVerdict: 'likely scam',
    expectedFlags: ['lookalike-domain', 'risky-attachment', 'threat'],
  },
  {
    id: 'scam-cyrillic-apk',
    channel: 'whatsapp',
    title: 'Bank app update from a fake link',
    text: 'SBI ALERT: Your YONO account is suspended. Install the new app to reactivate it: https://\u0455b\u0456-yono.example/SBI_YONO_Update.apk',
    attachments: ['SBI_YONO_Update.apk'],
    expectedVerdict: 'likely scam',
    expectedFlags: ['lookalike-domain', 'risky-attachment', 'threat'],
  },
  {
    id: 'genuine-bank-alert',
    channel: 'email',
    title: 'Real debit alert from your bank',
    headers: {
      From: 'Vandana Bank Alerts <alerts@vandanabank.example>',
      Subject: 'Debit alert for account XX4821',
      'Authentication-Results': 'mx.mail.example; spf=pass smtp.mailfrom=vandanabank.example; dkim=pass; dmarc=pass',
    },
    text: 'Dear Priya Sharma,\n\n\u20b91,250.00 was debited from your Vandana Bank account XX4821 on 05-11-2026 at SwiftKart. Available balance: \u20b918,430.55.\n\nIf you did not make this transaction, call the number printed on the back of your card. Vandana Bank will never ask for your OTP, PIN or password.\n\nVandana Bank',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
  },
  {
    id: 'genuine-delivery-update',
    channel: 'sms',
    title: 'Real delivery update',
    text: 'SwiftKart: Your order SK-48213 with 2 items has been shipped by FastWay Couriers and will be delivered by Thu, 12 Nov. Track it at https://swiftkart.example/track/SK48213. No payment is due on delivery.',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
  },
  {
    id: 'genuine-family-message',
    channel: 'whatsapp',
    title: 'Message from family',
    text: 'Hi Ma, reached Pune safely. The train was 20 minutes late. I will call you after dinner. Please take your medicine on time. - Arjun',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
  },
  {
    id: 'genuine-login-code',
    channel: 'email',
    title: 'Real login code you asked for',
    headers: {
      From: 'SwiftKart <no-reply@swiftkart.example>',
      Subject: 'Your SwiftKart login code',
      'Authentication-Results': 'mx.mail.example; spf=pass smtp.mailfrom=swiftkart.example; dkim=pass; dmarc=pass',
    },
    text: 'Your one-time password for logging in to SwiftKart is 482913. It is valid for 10 minutes. Do not share this code with anyone. If you did not request it, you can ignore this email.',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
  },
  {
    id: 'genuine-electricity-bill',
    channel: 'sms',
    title: 'Real electricity bill',
    text: 'Dear consumer, your electricity bill of \u20b91,148 for Oct 2026 for account 4401-2290 has been generated. Due date: 20 Nov 2026. Pay through the official NorthGrid Power app or website. Ignore if already paid.',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
  },
];