// Shared utility functions

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert calendar days to nearest trading days (approximate).
 * Actual implementation must use a trading-calendar library with NSE/BSE holidays.
 */
export function calendarToTradingDays(calendarDays: number): number {
  // Approximate: ~5/7 of calendar days are trading days
  // TODO: replace with actual NSE/BSE trading calendar
  return Math.round(calendarDays * (5 / 7));
}

/**
 * Format a return percentage for display.
 */
export function formatReturnPct(ret: number): string {
  const pct = (ret * 100).toFixed(2);
  return ret >= 0 ? `+${pct}%` : `${pct}%`;
}

/**
 * Format a price in INR.
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Check if current time is within Indian market hours.
 */
export function isMarketOpen(): boolean {
  // TODO: implement with proper timezone handling and holiday calendar
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const hours = istNow.getUTCHours();
  const minutes = istNow.getUTCMinutes();
  const timeInMinutes = hours * 60 + minutes;
  const openTime = 9 * 60 + 15;
  const closeTime = 15 * 60 + 30;
  const dayOfWeek = istNow.getUTCDay();
  return dayOfWeek >= 1 && dayOfWeek <= 5 && timeInMinutes >= openTime && timeInMinutes < closeTime;
}

/**
 * Get the previous market close timestamp in IST.
 * Returns ISO 8601 string.
 */
export function getPreviousMarketCloseTimestamp(): string {
  // TODO: implement with proper trading calendar
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  // Placeholder: return yesterday 15:30 IST
  istNow.setUTCHours(10, 0, 0, 0); // 15:30 IST = 10:00 UTC
  istNow.setUTCDate(istNow.getUTCDate() - 1);
  return istNow.toISOString();
}
