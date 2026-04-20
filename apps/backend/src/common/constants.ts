// 5+ reports auto-hide a listing.
export const AUTO_HIDE_REPORT_THRESHOLD = 5;

// Only reports from accounts older than 24h count toward auto-hide.
export const REPORT_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_PAGE_LIMIT = 20;

export const MAX_LISTING_IMAGES = 10;

// OTP expires 15 min after issuance.
export const OTP_EXPIRY_MS = 15 * 60 * 1000;

// Max wrong OTP submissions per code before it's invalidated.
export const OTP_MAX_ATTEMPTS = 5;

// Minimum messages between buyer and seller before reviews unlock.
export const MIN_REVIEW_MESSAGE_THRESHOLD = 2;
