// Referral codes are exactly 8 characters: 2 letters + 6 letters/digits
// (e.g. CRK7F3QX). A code from an invite link (?ref=CODE) is remembered
// for 30 days, so it's still applied if the visitor signs up later.

export const REFERRAL_CODE_LENGTH = 8;
const PATTERN = /^[A-Z]{2}[A-Z0-9]{6}$/;
const STORAGE_KEY = 'fanitt.referral';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Uppercase, letters/digits only, max 8 characters — for input fields. */
export function normalizeReferralInput(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, REFERRAL_CODE_LENGTH);
}

export function isValidReferralCode(value: string) {
  return PATTERN.test(value.trim().toUpperCase());
}

/** Reads ?ref=CODE from the current URL and remembers it. */
export function captureReferralFromUrl(search: string = window.location.search) {
  try {
    const code = normalizeReferralInput(new URLSearchParams(search).get('ref') || '');
    if (!isValidReferralCode(code)) return null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, savedAt: Date.now() }));
    return code;
  } catch {
    return null;
  }
}

/** The remembered code, if it's still fresh. */
export function getStoredReferral(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return '';
    const { code, savedAt } = JSON.parse(raw) as { code: string; savedAt: number };
    if (!isValidReferralCode(code) || Date.now() - savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return '';
    }
    return code;
  } catch {
    return '';
  }
}

export function clearStoredReferral() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable — nothing to clear
  }
}

/** Invite link someone can share: opens sign-up with their code filled in. */
export function inviteLinkFor(code: string) {
  return `${window.location.origin}/get-started?ref=${encodeURIComponent(code)}`;
}