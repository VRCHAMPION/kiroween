import type { AnalysisResult, FlagType } from '../../detection';

export interface StepLink {
  label: string;
  href: string;
}

export interface Step {
  id: string;
  /** A short instruction in plain words. */
  title: string;
  /** One sentence explaining it. */
  detail: string;
  /** Urgent steps come first. */
  urgent?: boolean;
  /** Only Phantom Inbox's own fixed links, never anything from the message. */
  links?: readonly StepLink[];
}

export interface FamilyWarning {
  en: string;
  hi: string;
}

export interface Plan {
  intro: string;
  steps: Step[];
  warning: FamilyWarning;
}

export const REPORT_LINKS: readonly StepLink[] = [
  { label: 'Report at cybercrime.gov.in', href: 'https://cybercrime.gov.in' },
  { label: 'Call 1930', href: 'tel:1930' },
];

/** The five steps every plan has, in order. */
export const BASE_STEPS: readonly Step[] = [
  {
    id: 'do-not-reply',
    title: 'Do not reply',
    detail: 'Replying, even to say no, tells the sender your number is active.',
  },
  {
    id: 'do-not-click',
    title: 'Do not click links or open files',
    detail: 'Links and files in scam messages can open fake websites or install harmful apps.',
  },
  {
    id: 'never-share-or-pay',
    title: 'Never share an OTP, PIN or password, and do not pay',
    detail: 'No real bank, courier, company or police officer will ask for these, or ask you to pay this way.',
  },
  {
    id: 'block-sender',
    title: 'Block the sender',
    detail: 'Block the number or email address so they cannot message you again. You can also report it as spam in the app.',
  },
  {
    id: 'report',
    title: 'Report it',
    detail: 'Report the message on the National Cyber Crime Reporting Portal, or call the cyber crime helpline 1930. If you have lost money, call 1930 at once.',
    links: REPORT_LINKS,
  },
];

export const BASE_STEP_IDS: readonly string[] = BASE_STEPS.map((s) => s.id);

interface FlagStep extends Step {
  triggers: readonly FlagType[];
}

/** Extra steps, in the order they are shown. Urgent ones go before the base steps. */
export const FLAG_STEPS: readonly FlagStep[] = [
  {
    id: 'uninstall-remote-app',
    urgent: true,
    triggers: ['remote-access-app'],
    title: 'Uninstall any screen-sharing app now',
    detail: 'If you installed AnyDesk, TeamViewer or a similar app because of this message, uninstall it, then call your bank on the number printed on your card.',
  },
  {
    id: 'already-shared',
    urgent: true,
    triggers: ['sensitive-info-request', 'upi-refund', 'payment-request'],
    title: 'If you already shared a code or paid, call your bank now',
    detail: 'Ask the bank to block your card or account, then call 1930 straight away. Acting quickly gives the best chance of stopping the money.',
  },
  {
    id: 'police-never-video-arrest',
    triggers: ['digital-arrest'],
    title: 'Police never arrest anyone on a video call',
    detail: 'Hang up. Do not stay on the call or pay anything to "clear your name", and tell a family member straight away.',
  },
  {
    id: 'do-not-install-file',
    triggers: ['risky-attachment'],
    title: 'Do not open or install the file',
    detail: 'If you already installed an app from it, uninstall it and change your banking passwords from another phone or computer.',
  },
  {
    id: 'change-password',
    triggers: ['lookalike-domain', 'link-text-mismatch', 'url-shortener', 'ip-link', 'risky-tld'],
    title: 'If you typed a password on that website, change it',
    detail: 'Change it in the real app, or on the real website typed in yourself, not through the link in the message.',
  },
  {
    id: 'kyc-in-branch',
    triggers: ['kyc-expiry'],
    title: 'Banks never ask you to update KYC through a link',
    detail: "If you are unsure, visit your branch or open your bank's official app yourself.",
  },
  {
    id: 'courier-official',
    triggers: ['courier-fee'],
    title: "Track parcels only on the courier's real website",
    detail: 'Open the courier\'s app or type its website yourself. Real couriers do not ask for small fees by message.',
  },
  {
    id: 'electricity-official',
    triggers: ['electricity-disconnection'],
    title: 'Check your bill with your electricity board',
    detail: "Use the board's official app or website, or the phone number printed on your paper bill.",
  },
  {
    id: 'never-pay-for-job',
    triggers: ['job-task-scam'],
    title: 'Never pay to get a job or to withdraw earnings',
    detail: 'Real employers do not charge fees, deposits or "task" money.',
  },
  {
    id: 'sender-name-fake',
    triggers: ['email-auth-fail'],
    title: "Do not trust the sender's name",
    detail: 'This email failed the checks that show who really sent it, so the name shown may be fake.',
  },
  {
    id: 'take-your-time',
    triggers: ['urgency', 'threat'],
    title: 'Take your time',
    detail: 'Real organisations give you time to check. Pressure to act fast is a trick.',
  },
];

/** Which flag types bring in each extra step. */
export const STEP_TRIGGERS: Readonly<Record<string, readonly FlagType[]>> = Object.fromEntries(FLAG_STEPS.map((s) => [s.id, s.triggers]));

const stripTriggers = ({ triggers, ...step }: FlagStep): Step => {
  void triggers;
  return step;
};

// ---------- Family warning ----------

interface ScamKind {
  triggers: readonly FlagType[];
  en: string;
  hi: string;
  extraEn?: string;
  extraHi?: string;
}

/** The kind of scam named in the family warning, by priority. Fixed text only. */
const SCAM_KINDS: readonly ScamKind[] = [
  {
    triggers: ['digital-arrest'],
    en: 'from someone pretending to be the police, saying I was under "digital arrest" and had to pay',
    hi: "जिसमें कोई ख़ुद को पुलिस बताकर कह रहा था कि मैं 'डिजिटल अरेस्ट' में हूँ और मुझे पैसे देने होंगे",
    extraEn: 'Police never arrest anyone on a video call.',
    extraHi: 'पुलिस कभी वीडियो कॉल पर किसी को गिरफ़्तार नहीं करती।',
  },
  {
    triggers: ['remote-access-app'],
    en: 'asking me to install a screen-sharing app like AnyDesk',
    hi: 'जिसमें AnyDesk जैसा स्क्रीन-शेयरिंग ऐप इंस्टॉल करने को कहा गया',
  },
  {
    triggers: ['upi-refund'],
    en: 'offering a refund that needed me to approve a UPI request or enter my PIN',
    hi: 'जिसमें रिफ़ंड के बहाने UPI रिक्वेस्ट मंज़ूर करने या PIN डालने को कहा गया',
  },
  {
    triggers: ['kyc-expiry'],
    en: 'saying my bank KYC had expired and my account would be blocked',
    hi: 'जिसमें लिखा था कि मेरे बैंक का KYC ख़त्म हो गया है और खाता बंद हो जाएगा',
  },
  {
    triggers: ['electricity-disconnection'],
    en: 'saying our electricity would be cut tonight unless we paid or called a number',
    hi: 'जिसमें लिखा था कि आज रात बिजली काट दी जाएगी, जब तक हम पैसे न भरें या किसी नंबर पर कॉल न करें',
  },
  {
    triggers: ['courier-fee'],
    en: 'saying a parcel was held and asking for a small fee',
    hi: 'जिसमें लिखा था कि एक पार्सल रुका हुआ है और थोड़ी फ़ीस मांगी गई',
  },
  {
    triggers: ['job-task-scam'],
    en: 'offering easy money for liking videos or doing small online tasks',
    hi: 'जिसमें वीडियो लाइक करने या छोटे ऑनलाइन काम के बदले आसान कमाई का लालच दिया गया',
  },
  {
    triggers: ['payment-request'],
    en: 'asking me to pay with gift cards or approve a payment request',
    hi: 'जिसमें गिफ़्ट कार्ड से पैसे देने या पेमेंट रिक्वेस्ट मंज़ूर करने को कहा गया',
  },
  {
    triggers: ['sensitive-info-request'],
    en: 'asking for my OTP, PIN or card details',
    hi: 'जिसमें मेरा OTP, PIN या कार्ड की जानकारी मांगी गई',
  },
  {
    triggers: ['risky-attachment'],
    en: 'with a file that could install a harmful app on the phone',
    hi: 'जिसमें एक फ़ाइल थी जो फ़ोन में ख़तरनाक ऐप डाल सकती है',
  },
  {
    triggers: ['lookalike-domain', 'link-text-mismatch'],
    en: "with a link to a fake website that copies a real company's name",
    hi: 'जिसमें किसी असली कंपनी के नाम से मिलती-जुलती नकली वेबसाइट का लिंक था',
  },
  {
    triggers: ['url-shortener', 'ip-link', 'risky-tld'],
    en: 'with a suspicious link',
    hi: 'जिसमें एक संदिग्ध लिंक था',
  },
  {
    triggers: ['email-auth-fail'],
    en: 'pretending to come from a company it did not come from',
    hi: 'जो किसी कंपनी के नाम से भेजा गया था, पर असल में वहाँ से नहीं आया था',
  },
];

const FALLBACK_KIND: ScamKind = {
  triggers: [],
  en: 'that tried to scare me into acting fast',
  hi: 'जिसमें मुझे डराकर जल्दी कुछ करने को कहा गया',
};

function familyWarning(types: ReadonlySet<FlagType>, likely: boolean): FamilyWarning {
  const kind = SCAM_KINDS.find((k) => k.triggers.some((t) => types.has(t))) ?? FALLBACK_KIND;
  const en = [
    `${likely ? 'Scam alert!' : 'Please be careful!'} I got a message that ${likely ? 'looks like' : 'might be'} a scam, ${kind.en}.`,
    ...(kind.extraEn ? [kind.extraEn] : []),
    'If you get a message like this:',
    '- Do not click any link or open any file.',
    '- Never share your OTP, PIN or password with anyone.',
    '- Do not pay any money or approve any UPI request.',
    '- Block the number and report it at cybercrime.gov.in or call 1930.',
  ].join('\n');
  const hi = [
    `${likely ? 'स्कैम अलर्ट!' : 'सावधान!'} मुझे एक मैसेज मिला जो स्कैम ${likely ? 'लगता है' : 'हो सकता है'}, ${kind.hi}।`,
    ...(kind.extraHi ? [kind.extraHi] : []),
    'अगर आपको भी ऐसा मैसेज आए:',
    '- किसी भी लिंक पर क्लिक न करें और कोई फ़ाइल न खोलें।',
    '- अपना OTP, PIN या पासवर्ड किसी को न बताएं।',
    '- कोई पैसा न भेजें और कोई UPI रिक्वेस्ट मंज़ूर न करें।',
    '- नंबर ब्लॉक करें और cybercrime.gov.in पर शिकायत करें या 1930 पर कॉल करें।',
  ].join('\n');
  return { en, hi };
}

// ---------- Plan ----------

/**
 * What to do after a check. Undefined for "looks safe". Built only from fixed text, so nothing
 * from the checked message can reach the steps or the family warning.
 */
export function exorcismPlan(result: Pick<AnalysisResult, 'verdict' | 'flags'>): Plan | undefined {
  if (result.verdict === 'looks safe') return undefined;
  const likely = result.verdict === 'likely scam';
  const types = new Set(result.flags.map((f) => f.type));
  const extra = FLAG_STEPS.filter((s) => s.triggers.some((t) => types.has(t))).map(stripTriggers);
  const steps = [...extra.filter((s) => s.urgent), ...BASE_STEPS, ...extra.filter((s) => !s.urgent)];
  return {
    intro: likely
      ? 'This message is likely a scam. Follow these steps to stay safe.'
      : 'This message might be a scam. Until you are sure, follow these steps.',
    steps,
    warning: familyWarning(types, likely),
  };
}