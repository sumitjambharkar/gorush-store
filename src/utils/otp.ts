import { ApiError } from "@/api/client";

/** SMS login / change-mobile codes. */
export const OTP_LENGTH = 6;

/** Server default: one OTP every 3 minutes (also how long an OTP is valid). */
export const RESEND_SECONDS = 180;

/** 179 → "2:59" */
export const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

/** Seconds to wait before another OTP may be requested (from a 429), else null. */
export function retryAfterSeconds(err: unknown): number | null {
  if (!(err instanceof ApiError) || err.status !== 429) return null;
  const s = Number(err.data?.retryAfterSeconds);
  return Number.isFinite(s) && s > 0 ? s : null;
}
