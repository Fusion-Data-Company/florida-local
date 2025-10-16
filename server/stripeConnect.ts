// STRIPE INTEGRATION COMPLETELY REMOVED
// DO NOT IMPLEMENT - USER EXPLICITLY REQUESTED REMOVAL
// ALL STRIPE FUNCTIONALITY HAS BEEN PLACEHOLDERED

import Stripe from "stripe";
import { logger, trackEvent } from "./monitoring";
import { cache } from "./redis";
import { emailQueue } from "./redis";
import type { IStorage } from "./storage";

// Stripe completely disabled - do not implement
const stripe: any = null;

interface ConnectAccountData {
  businessId: string;
  userId: string;
  email: string;
  businessName: string;
  businessType: string;
  country?: string;
}

// PLACEHOLDER - Stripe Connect account creation (not implemented)
export async function createConnectAccount(data: ConnectAccountData): Promise<any | null> {
  logger.warn("Stripe Connect not implemented - placeholder only");
  return null;
}

// PLACEHOLDER - Get Connect account (not implemented)
export async function getConnectAccount(accountId: string): Promise<any | null> {
  logger.warn("Stripe Connect not implemented - placeholder only");
  return null;
}

// PLACEHOLDER - Create account link (not implemented)
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<any | null> {
  logger.warn("Stripe Connect not implemented - placeholder only");
  return null;
}

// PLACEHOLDER - Check if account is onboarded (not implemented)
export function isAccountOnboarded(account: any): boolean {
  return false;
}

// PLACEHOLDER - Get account balance (not implemented)
export async function getAccountBalance(accountId: string): Promise<any | null> {
  logger.warn("Stripe Connect not implemented - placeholder only");
  return null;
}

// PLACEHOLDER - List payouts (not implemented)
export async function listPayouts(accountId: string, limit: number = 10): Promise<any> {
  logger.warn("Stripe Connect not implemented - placeholder only");
  return { data: [], hasMore: false };
}

// PLACEHOLDER - Create payout (not implemented)
export async function createPayout(accountId: string, amount: number, currency: string = "usd"): Promise<any | null> {
  logger.warn("Stripe Connect not implemented - placeholder only");
  return null;
}

// PLACEHOLDER - Get payout settings (not implemented)
export async function getPayoutSettings(accountId: string): Promise<any | null> {
  logger.warn("Stripe Connect not implemented - placeholder only");
  return null;
}

// PLACEHOLDER - Update payout settings (not implemented)
export async function updatePayoutSettings(accountId: string, settings: any): Promise<any | null> {
  logger.warn("Stripe Connect not implemented - placeholder only");
  return null;
}

// PLACEHOLDER - List transactions (not implemented)
export async function listTransactions(accountId: string, limit: number = 10): Promise<any> {
  logger.warn("Stripe Connect not implemented - placeholder only");
  return { data: [], hasMore: false };
}

// PLACEHOLDER - Handle webhook (not implemented)
export async function handleWebhook(payload: any, signature: string): Promise<any> {
  logger.warn("Stripe webhook not implemented - placeholder only");
  return null;
}

// All other Stripe functions are placeholders only
// DO NOT IMPLEMENT WITHOUT USER APPROVAL
