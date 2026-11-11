import type { FlagType, Verdict } from '../detection';

export type Channel = 'email' | 'sms' | 'whatsapp';

/** What a scam sample is about. Séance uses these to name the scam types a player missed. */
export type ScamTopic =
  | 'KYC expiry'
  | 'Courier fee'
  | 'Electricity disconnection'
  | 'UPI refund'
  | 'Job task'
  | 'Digital arrest'
  | 'Lookalike link'
  | 'Risky attachment';

/** What a genuine sample is about. */
export type GenuineTopic = 'Bank alert' | 'Delivery update' | 'One-time code' | 'Family message' | 'Bill or receipt';

export type SampleTopic = ScamTopic | GenuineTopic;

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
  /** What the message is about. */
  topic: SampleTopic;
  /** Genuine messages only: plain reasons it is safe, shown in Séance. */
  safeReasons?: readonly string[];
}

/**
 * Practice messages. Every person, number, brand domain and link here is made up.
 * Scams imitate real brand names only inside fake domains, so the engine can be shown
 * catching the imitation.
 */
export const SAMPLES: readonly SampleMessage[] = [
  {
    id: 'scam-kyc-expiry',
    topic: 'KYC expiry',
    channel: 'sms',
    title: 'Bank KYC has "expired"',
    text: 'Dear customer, your Vandana Bank KYC has expired. Your account will be blocked within 24 hours. Update KYC now: https://bit.ly/vb-kyc-2291 - Team VB',
    expectedVerdict: 'likely scam',
    expectedFlags: ['kyc-expiry', 'threat', 'urgency', 'url-shortener'],
  },
  {
    id: 'scam-paypal-homoglyph',
    topic: 'Lookalike link',
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
    topic: 'Lookalike link',
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
    topic: 'Courier fee',
    channel: 'sms',
    title: 'Parcel held at customs',
    text: 'IndiaPost: Your parcel is held at customs. Pay the customs fee of Rs 49 within 12 hours or it will be returned: https://indiapost-redelivery.top/pay',
    expectedVerdict: 'likely scam',
    expectedFlags: ['courier-fee', 'urgency', 'risky-tld', 'lookalike-domain'],
  },
  {
    id: 'scam-electricity',
    topic: 'Electricity disconnection',
    channel: 'sms',
    title: 'Power cut "tonight"',
    text: 'Dear consumer, your electricity power will be disconnected tonight at 9.30 pm because your previous month bill was not updated. Please contact our electricity officer immediately on 90000 12345 and install the AnyDesk app so we can update your bill.',
    expectedVerdict: 'likely scam',
    expectedFlags: ['electricity-disconnection', 'urgency', 'remote-access-app'],
  },
  {
    id: 'scam-upi-refund',
    topic: 'UPI refund',
    channel: 'whatsapp',
    title: 'Refund that needs your UPI PIN',
    text: 'Hello sir, this is Karan from the SwiftKart refund desk. Your refund of \u20b92,499 is ready. To receive the refund, approve the collect request on your UPI app and enter your UPI PIN.',
    expectedVerdict: 'likely scam',
    expectedFlags: ['upi-refund', 'payment-request', 'sensitive-info-request'],
  },
  {
    id: 'scam-job-task',
    topic: 'Job task',
    channel: 'whatsapp',
    title: 'Easy money for liking videos',
    text: 'Hi! We are hiring for part-time work from home. Earn \u20b93,000 daily by liking YouTube videos. Simple tasks, daily payment. Limited seats, register now: https://cutt.ly/task-earn-77',
    expectedVerdict: 'likely scam',
    expectedFlags: ['job-task-scam', 'urgency', 'url-shortener'],
  },
  {
    id: 'scam-digital-arrest',
    topic: 'Digital arrest',
    channel: 'whatsapp',
    title: 'Fake officer and "digital arrest"',
    text: 'This is Inspector Vikram Rao from the CBI cyber crime department. A parcel booked in your name containing drugs was seized at the airport. An arrest warrant has been issued against you. You are now under digital arrest. Stay on the video call and do not tell your family. To clear your name, transfer \u20b91,50,000 or buy Google Play gift cards and share the codes.',
    expectedVerdict: 'likely scam',
    expectedFlags: ['digital-arrest', 'threat', 'payment-request', 'courier-fee'],
  },
  {
    id: 'scam-amazon-rn',
    topic: 'Risky attachment',
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
    topic: 'Lookalike link',
    channel: 'whatsapp',
    title: 'Bank app update from a fake link',
    text: 'SBI ALERT: Your YONO account is suspended. Install the new app to reactivate it: https://\u0455b\u0456-yono.example/SBI_YONO_Update.apk',
    attachments: ['SBI_YONO_Update.apk'],
    expectedVerdict: 'likely scam',
    expectedFlags: ['lookalike-domain', 'risky-attachment', 'threat'],
  },
  {
    id: 'genuine-bank-alert',
    topic: 'Bank alert',
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
    safeReasons: [
      'It only tells you about a payment you made. It does not ask you to do anything.',
      'It has no link and asks for no code, PIN or password.',
      'It tells you to call the number on the back of your own card, not a number in the message.',
    ],
  },
  {
    id: 'genuine-delivery-update',
    topic: 'Delivery update',
    channel: 'sms',
    title: 'Real delivery update',
    text: 'SwiftKart: Your order SK-48213 with 2 items has been shipped by FastWay Couriers and will be delivered by Thu, 12 Nov. Track it at https://swiftkart.example/track/SK48213. No payment is due on delivery.',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
    safeReasons: [
      'It says no payment is due, so nobody is asking you for money.',
      'The tracking link goes to the shop\'s own website, not a lookalike or a short link.',
      'There is no deadline and no threat.',
    ],
  },
  {
    id: 'genuine-family-message',
    topic: 'Family message',
    channel: 'whatsapp',
    title: 'Message from family',
    text: 'Hi Ma, reached Pune safely. The train was 20 minutes late. I will call you after dinner. Please take your medicine on time. - Arjun',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
    safeReasons: [
      'It is an ordinary message from someone you know.',
      'It has no link, asks for no money and asks for no code.',
    ],
  },
  {
    id: 'genuine-login-code',
    topic: 'One-time code',
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
    safeReasons: [
      'You asked for this code yourself, to log in.',
      'It tells you not to share the code, which is what real companies say.',
      'It has no link to click.',
    ],
  },
  {
    id: 'genuine-electricity-bill',
    topic: 'Bill or receipt',
    channel: 'sms',
    title: 'Real electricity bill',
    text: 'Dear consumer, your electricity bill of \u20b91,148 for Oct 2026 for account 4401-2290 has been generated. Due date: 20 Nov 2026. Pay through the official NorthGrid Power app or website. Ignore if already paid.',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
    safeReasons: [
      'It only gives the bill amount and the due date.',
      'It tells you to pay through the official app or website, not a link in the message.',
      'There is no threat to cut your power tonight.',
    ],
  },
  {
    id: 'scam-kyc-wallet',
    topic: 'KYC expiry',
    channel: 'sms',
    title: 'Wallet KYC "pending"',
    text: 'Dear user, your Paytm wallet KYC is pending and your wallet will be blocked today itself. Complete KYC now: https://paytm-kyc-verify.top/update',
    expectedVerdict: 'likely scam',
    expectedFlags: ['kyc-expiry', 'threat', 'urgency', 'lookalike-domain', 'risky-tld'],
  },
  {
    id: 'scam-courier-redelivery',
    topic: 'Courier fee',
    channel: 'sms',
    title: 'Small fee to redeliver a parcel',
    text: 'BlueDart: We could not deliver your parcel because the address was incomplete. Pay the Rs 25 redelivery fee within 2 hours or the parcel will be returned: https://bluedart-redeliver.example/pay',
    expectedVerdict: 'likely scam',
    expectedFlags: ['courier-fee', 'urgency', 'lookalike-domain'],
  },
  {
    id: 'scam-electricity-whatsapp',
    topic: 'Electricity disconnection',
    channel: 'whatsapp',
    title: 'Power to be cut at 10 pm',
    text: 'Respected customer, your light connection will be cut tonight at 10 pm because your last bill is not updated. Call our officer Sunil Verma immediately on 90000 54321.',
    expectedVerdict: 'likely scam',
    expectedFlags: ['electricity-disconnection', 'urgency'],
  },
  {
    id: 'scam-upi-cashback',
    topic: 'UPI refund',
    channel: 'sms',
    title: 'Refund that needs a QR code',
    text: 'SwiftKart: Your refund of Rs 1,250 for the cancelled order is waiting. Scan the QR code to receive the refund, then enter your UPI PIN to confirm.',
    expectedVerdict: 'likely scam',
    expectedFlags: ['upi-refund', 'sensitive-info-request'],
  },
  {
    id: 'scam-job-hotel-reviews',
    topic: 'Job task',
    channel: 'whatsapp',
    title: 'Paid to rate hotels',
    text: 'Hi, I am Riya from StarHire Media. We offer a part-time online job: rate hotels on maps and earn Rs 2,000 per day. The first tasks are free, then you buy prepaid tasks to unlock bigger rewards. Reply YES to join.',
    expectedVerdict: 'suspicious',
    expectedFlags: ['job-task-scam'],
  },
  {
    id: 'scam-digital-arrest-trai',
    topic: 'Digital arrest',
    channel: 'sms',
    title: 'Number "blocked" and a video call',
    text: 'TRAI NOTICE: Your mobile number will be blocked within 2 hours. A money laundering case is registered against your Aadhaar. Join the video call with the CBI officer now and stay on the video call until the inquiry is complete.',
    expectedVerdict: 'likely scam',
    expectedFlags: ['threat', 'urgency', 'digital-arrest'],
  },
  {
    id: 'scam-invoice-attachment',
    topic: 'Risky attachment',
    channel: 'email',
    title: 'Invoice with risky files',
    headers: {
      From: 'Accounts <billing@swiftkart-invoices.example>',
      Subject: 'Overdue invoice 8841',
    },
    text: 'Hello,\n\nYour payment is overdue. Please act now: open the attached invoice and click Enable Content to see the amount due.\n\nAccounts Team',
    attachments: ['Invoice_8841.html', 'Payment_Details.xlsm'],
    expectedVerdict: 'likely scam',
    expectedFlags: ['risky-attachment', 'urgency'],
  },
  {
    id: 'scam-hdfc-lookalike',
    topic: 'Lookalike link',
    channel: 'whatsapp',
    title: 'Bank login on a copycat site',
    text: 'HDFC Bank: Your net banking access is limited. Log in at https://hdfcbank-secure-login.example within 24 hours to restore access.',
    expectedVerdict: 'likely scam',
    expectedFlags: ['lookalike-domain', 'urgency'],
  },
  {
    id: 'genuine-bank-credit',
    topic: 'Bank alert',
    channel: 'sms',
    title: 'Money received in your account',
    text: 'Vandana Bank: Rs 15,000.00 credited to your account XX4821 on 08-11-2026 by NEFT from Arjun Sharma. Available balance Rs 33,430.55. Not you? Call the number on the back of your card.',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
    safeReasons: [
      'It only tells you about money that arrived. It does not ask you to do anything.',
      'It has no link and asks for no code, PIN or password.',
      'It tells you to call the number on your own card, not a number in the message.',
    ],
  },
  {
    id: 'genuine-delivery-today',
    topic: 'Delivery update',
    channel: 'sms',
    title: 'Parcel arriving today',
    text: 'SwiftKart: Your order SK-77120 is out for delivery and should arrive by 7 pm today. It is already paid. You can follow it in the SwiftKart app.',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
    safeReasons: [
      'It says the order is already paid, so nobody is asking you for money.',
      'It has no link. It tells you to use the shop\'s own app.',
      'There is no fee, deadline or threat.',
    ],
  },
  {
    id: 'genuine-order-email',
    topic: 'Delivery update',
    channel: 'email',
    title: 'Order confirmation email',
    headers: {
      From: 'SwiftKart <no-reply@swiftkart.example>',
      Subject: 'Thanks for your order SK-48213',
      'Authentication-Results': 'mx.mail.example; spf=pass smtp.mailfrom=swiftkart.example; dkim=pass; dmarc=pass',
    },
    text: 'Hi Priya,\n\nThanks for your order SK-48213. Your total was Rs 1,250 and it has been paid. You can see your order at any time in the SwiftKart app.\n\nSwiftKart will never ask for your password or OTP.\n\nThe SwiftKart Team',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
    safeReasons: [
      'It is about an order you placed, and it says the order is paid.',
      'It passed the email checks that show who really sent it.',
      'It has no link and no attachment, and it reminds you never to share your password or OTP.',
    ],
  },
  {
    id: 'genuine-otp-payment',
    topic: 'One-time code',
    channel: 'sms',
    title: 'Code for a payment you are making',
    text: '482193 is the OTP for your Vandana Bank payment of Rs 2,300 at SwiftKart. It is valid for 5 minutes. Do not share this OTP with anyone. Bank staff will never ask for it.',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
    safeReasons: [
      'It arrives because you are paying for something yourself.',
      'It tells you not to share the code with anyone, not even bank staff.',
      'It has no link and asks you to do nothing else.',
    ],
  },
  {
    id: 'genuine-family-office',
    topic: 'Family message',
    channel: 'whatsapp',
    title: 'Message from your daughter',
    text: 'Papa, I reached the office. The meeting finished early, so I will come home by 6. Do you need anything from the market? - Neha',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
    safeReasons: [
      'It is an ordinary message from someone you know.',
      'It has no link, asks for no money and asks for no code.',
    ],
  },
  {
    id: 'genuine-bill-receipt',
    topic: 'Bill or receipt',
    channel: 'sms',
    title: 'Receipt for a bill you paid',
    text: 'NorthGrid Power: Thank you. We have received your payment of Rs 1,148 for account 4401-2290. Your receipt number is NG-55213.',
    expectedVerdict: 'looks safe',
    expectedFlags: [],
    safeReasons: [
      'It only confirms a payment you already made.',
      'It has no link and asks for nothing.',
    ],
  },
];