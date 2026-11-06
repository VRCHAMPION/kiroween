import type { Rule } from './types';
import { courierFee } from './rules/courier-fee';
import { digitalArrest } from './rules/digital-arrest';
import { electricityDisconnection } from './rules/electricity-disconnection';
import { emailAuthFail } from './rules/email-auth-fail';
import { ipLink } from './rules/ip-link';
import { jobTaskScam } from './rules/job-task-scam';
import { kycExpiry } from './rules/kyc-expiry';
import { linkTextMismatch } from './rules/link-text-mismatch';
import { lookalikeDomain } from './rules/lookalike-domain';
import { paymentRequest } from './rules/payment-request';
import { remoteAccessApp } from './rules/remote-access-app';
import { riskyAttachment } from './rules/risky-attachment';
import { riskyTld } from './rules/risky-tld';
import { sensitiveInfoRequest } from './rules/sensitive-info-request';
import { upiRefund } from './rules/upi-refund';
import { urgencyThreats } from './rules/urgency-threats';
import { urlShortener } from './rules/url-shortener';

/** Every rule, in the fixed order the engine runs them. */
export const RULES: readonly Rule[] = [
  lookalikeDomain,
  linkTextMismatch,
  urlShortener,
  ipLink,
  riskyTld,
  emailAuthFail,
  urgencyThreats,
  sensitiveInfoRequest,
  remoteAccessApp,
  paymentRequest,
  kycExpiry,
  courierFee,
  electricityDisconnection,
  upiRefund,
  jobTaskScam,
  digitalArrest,
  riskyAttachment,
];