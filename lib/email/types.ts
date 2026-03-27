// ─── Loops Email Types ────────────────────────────────────────────────────────
// All transactional email payloads sent through Loops for RCapsule.
// Each type maps directly to a template in the Loops dashboard.
// The transactionalId values must match the IDs from your Loops templates.

export type LoopsTransactionalId =
  | "email_verification"
  | "password_reset"
  | "email_change"
  | "welcome"
  | "invoice_receipt"
  | "subscription_started"
  | "subscription_cancelled"
  | "subscription_updated"
  | "trial_ending_soon"
  | "support_confirmation";

// ─── Auth Emails ──────────────────────────────────────────────────────────────

export interface EmailVerificationPayload {
  email: string;
  firstName?: string;
  confirmationUrl: string;
}

export interface PasswordResetPayload {
  email: string;
  firstName?: string;
  resetUrl: string;
}

export interface EmailChangePayload {
  email: string;
  firstName?: string;
  newEmail: string;
  confirmationUrl: string;
}

export interface WelcomePayload {
  email: string;
  firstName?: string;
}

// ─── Billing Emails ───────────────────────────────────────────────────────────

export interface InvoiceReceiptPayload {
  email: string;
  firstName?: string;
  invoiceId: string;
  invoiceUrl: string;
  amountPaid: string; // formatted string e.g. "$12.00"
  billingPeriodStart: string;
  billingPeriodEnd: string;
  planName: string;
}

export interface SubscriptionStartedPayload {
  email: string;
  firstName?: string;
  planName: string;
  billingInterval: "monthly" | "yearly";
  nextBillingDate: string;
}

export interface SubscriptionCancelledPayload {
  email: string;
  firstName?: string;
  planName: string;
  accessUntil: string; // date the subscription actually expires
}

export interface SubscriptionUpdatedPayload {
  email: string;
  firstName?: string;
  oldPlanName: string;
  newPlanName: string;
  effectiveDate: string;
}

export interface TrialEndingSoonPayload {
  email: string;
  firstName?: string;
  trialEndDate: string;
  upgradeUrl: string;
}

// ─── Support Emails ───────────────────────────────────────────────────────────

export interface SupportConfirmationPayload {
  email: string;
  firstName?: string;
  ticketId: string;
  subject: string;
  message: string;
}

// ─── Contact Sync ─────────────────────────────────────────────────────────────

export interface LoopsContactProperties {
  email: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  planTier?: "free" | "pro" | "enterprise";
  subscriptionStatus?: "active" | "cancelled" | "trialing" | "past_due";
  signedUpAt?: string; // ISO date string
}
