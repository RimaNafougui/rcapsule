import { LoopsClient } from "loops";
import type {
  EmailVerificationPayload,
  PasswordResetPayload,
  EmailChangePayload,
  WelcomePayload,
  InvoiceReceiptPayload,
  SubscriptionStartedPayload,
  SubscriptionCancelledPayload,
  SubscriptionUpdatedPayload,
  TrialEndingSoonPayload,
  SupportConfirmationPayload,
  LoopsContactProperties,
} from "./types";

// ─── Client ───────────────────────────────────────────────────────────────────

let _loops: LoopsClient | null = null;

function getLoops(): LoopsClient {
  if (!_loops) {
    if (!process.env.LOOPS_API_KEY) {
      throw new Error("Missing LOOPS_API_KEY environment variable.");
    }
    _loops = new LoopsClient(process.env.LOOPS_API_KEY);
  }
  return _loops;
}

// ─── Template ID Map ──────────────────────────────────────────────────────────
// Replace each value with the actual transactional email ID from your
// Loops dashboard (Transactional > [Template] > copy ID button).

const TEMPLATE_IDS = {
  emailVerification: process.env.LOOPS_TEMPLATE_EMAIL_VERIFICATION!,
  passwordReset: process.env.LOOPS_TEMPLATE_PASSWORD_RESET!,
  emailChange: process.env.LOOPS_TEMPLATE_EMAIL_CHANGE!,
  welcome: process.env.LOOPS_TEMPLATE_WELCOME!,
  invoiceReceipt: process.env.LOOPS_TEMPLATE_INVOICE_RECEIPT!,
  subscriptionStarted: process.env.LOOPS_TEMPLATE_SUBSCRIPTION_STARTED!,
  subscriptionCancelled: process.env.LOOPS_TEMPLATE_SUBSCRIPTION_CANCELLED!,
  subscriptionUpdated: process.env.LOOPS_TEMPLATE_SUBSCRIPTION_UPDATED!,
  trialEndingSoon: process.env.LOOPS_TEMPLATE_TRIAL_ENDING_SOON!,
  supportConfirmation: process.env.LOOPS_TEMPLATE_SUPPORT_CONFIRMATION!,
} as const;

// ─── Auth Emails ──────────────────────────────────────────────────────────────

export async function sendEmailVerification(payload: EmailVerificationPayload) {
  return getLoops().sendTransactionalEmail({
    transactionalId: TEMPLATE_IDS.emailVerification,
    email: payload.email,
    dataVariables: {
      firstName: payload.firstName ?? "",
      confirmationUrl: payload.confirmationUrl,
    },
  });
}

export async function sendPasswordReset(payload: PasswordResetPayload) {
  return getLoops().sendTransactionalEmail({
    transactionalId: TEMPLATE_IDS.passwordReset,
    email: payload.email,
    dataVariables: {
      firstName: payload.firstName ?? "",
      resetUrl: payload.resetUrl,
    },
  });
}

export async function sendEmailChange(payload: EmailChangePayload) {
  return getLoops().sendTransactionalEmail({
    transactionalId: TEMPLATE_IDS.emailChange,
    email: payload.email,
    dataVariables: {
      firstName: payload.firstName ?? "",
      newEmail: payload.newEmail,
      confirmationUrl: payload.confirmationUrl,
    },
  });
}

export async function sendWelcome(payload: WelcomePayload) {
  return getLoops().sendTransactionalEmail({
    transactionalId: TEMPLATE_IDS.welcome,
    email: payload.email,
    dataVariables: {
      firstName: payload.firstName ?? "",
    },
  });
}

// ─── Billing Emails ───────────────────────────────────────────────────────────

export async function sendInvoiceReceipt(payload: InvoiceReceiptPayload) {
  return getLoops().sendTransactionalEmail({
    transactionalId: TEMPLATE_IDS.invoiceReceipt,
    email: payload.email,
    dataVariables: {
      firstName: payload.firstName ?? "",
      invoiceId: payload.invoiceId,
      invoiceUrl: payload.invoiceUrl,
      amountPaid: payload.amountPaid,
      billingPeriodStart: payload.billingPeriodStart,
      billingPeriodEnd: payload.billingPeriodEnd,
      planName: payload.planName,
    },
  });
}

export async function sendSubscriptionStarted(
  payload: SubscriptionStartedPayload,
) {
  return getLoops().sendTransactionalEmail({
    transactionalId: TEMPLATE_IDS.subscriptionStarted,
    email: payload.email,
    dataVariables: {
      firstName: payload.firstName ?? "",
      planName: payload.planName,
      billingInterval: payload.billingInterval,
      nextBillingDate: payload.nextBillingDate,
    },
  });
}

export async function sendSubscriptionCancelled(
  payload: SubscriptionCancelledPayload,
) {
  return getLoops().sendTransactionalEmail({
    transactionalId: TEMPLATE_IDS.subscriptionCancelled,
    email: payload.email,
    dataVariables: {
      firstName: payload.firstName ?? "",
      planName: payload.planName,
      accessUntil: payload.accessUntil,
    },
  });
}

export async function sendSubscriptionUpdated(
  payload: SubscriptionUpdatedPayload,
) {
  return getLoops().sendTransactionalEmail({
    transactionalId: TEMPLATE_IDS.subscriptionUpdated,
    email: payload.email,
    dataVariables: {
      firstName: payload.firstName ?? "",
      oldPlanName: payload.oldPlanName,
      newPlanName: payload.newPlanName,
      effectiveDate: payload.effectiveDate,
    },
  });
}

export async function sendTrialEndingSoon(payload: TrialEndingSoonPayload) {
  return getLoops().sendTransactionalEmail({
    transactionalId: TEMPLATE_IDS.trialEndingSoon,
    email: payload.email,
    dataVariables: {
      firstName: payload.firstName ?? "",
      trialEndDate: payload.trialEndDate,
      upgradeUrl: payload.upgradeUrl,
    },
  });
}

// ─── Support Emails ───────────────────────────────────────────────────────────

export async function sendSupportConfirmation(
  payload: SupportConfirmationPayload,
) {
  return getLoops().sendTransactionalEmail({
    transactionalId: TEMPLATE_IDS.supportConfirmation,
    email: payload.email,
    dataVariables: {
      firstName: payload.firstName ?? "",
      ticketId: payload.ticketId,
      subject: payload.subject,
      message: payload.message,
    },
  });
}

// ─── Contact Sync ─────────────────────────────────────────────────────────────
// Call this on signup and whenever user properties change (plan upgrade,
// cancellation, email update).
// SDK v6: updateContact takes a single object with email included.

export async function syncContact(properties: LoopsContactProperties) {
  // SDK v6: top-level accepts email, userId, mailingLists.
  // All contact properties (including built-in ones like firstName) go inside
  // the nested `properties` object.
  return getLoops().updateContact({
    email: properties.email,
    userId: properties.userId,
    properties: {
      firstName: properties.firstName ?? null,
      lastName: properties.lastName ?? null,
      planTier: properties.planTier ?? null,
      subscriptionStatus: properties.subscriptionStatus ?? null,
      signedUpAt: properties.signedUpAt ?? null,
    },
  });
}

// ─── Delete Contact ───────────────────────────────────────────────────────────
// Call this when a user deletes their RCapsule account (GDPR / CASL compliance).

export async function deleteContact(email: string) {
  return getLoops().deleteContact({ email });
}
