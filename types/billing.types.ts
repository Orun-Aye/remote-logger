// types/billing.types.ts

export type PlanId =
  | "developer"
  | "starter"
  | "professional"
  | "team"
  | "enterprise";

export type BillingCycle = "monthly" | "annual";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete";

export interface PlanLimits {
  maxLogs: number;
  maxProjects: number;
  maxTeamMembers: number;
  retentionDays: number;
  maxAlertRules: number;
  maxApiTokens: number;
  aiInsights: "none" | "basic" | "full";
  aiInsightsPerDay: number;
  anomalyDetection: boolean;
  auditLogDays: number;
  mfa: "none" | "optional" | "enforced";
}

export interface PlanConfig {
  id: string;
  name: string;
  monthlyPrice: number; // in cents
  annualPrice: number; // in cents per month
  limits: PlanLimits;
  features: string[];
  support: string;
}

export interface SubscriptionUsage {
  logsIngested: number;
  apiCalls: number;
  lastResetAt: string;
}

export interface Subscription {
  _id: string;
  organizationId?: string;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: PlanId;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  usage: SubscriptionUsage;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageData {
  plan: string;
  planName: string;
  limits: PlanLimits;
  usage: {
    logsIngested: number;
    apiCalls: number;
    projects: number;
    teamMembers: number;
    alertRules: number;
    apiTokens: number;
  };
  percentages: {
    logsIngested: number;
    apiCalls: number;
    projects: number;
    teamMembers: number;
    alertRules: number;
    apiTokens: number;
  };
}

export interface Invoice {
  id: string;
  date: string;
  amount: number; // in cents
  status: "paid" | "pending" | "failed";
  plan: string;
  billingCycle: BillingCycle;
  description: string;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export interface PortalSession {
  url: string;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
}

export interface ChangePlanPayload {
  plan: PlanId;
  billingCycle: BillingCycle;
}

export interface CheckoutPayload {
  planId: PlanId;
  billingCycle: BillingCycle;
}
