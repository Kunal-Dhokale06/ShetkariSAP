import { Router } from "express";
import type { RequestHandler } from "express";

const router = Router();

// ── In-memory stores ─────────────────────────────────────────────────────────
interface OtpEntry {
  otp: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpEntry>();

// Per-IP rate limit: max 10 OTP sends per 10 minutes
interface IpEntry { count: number; resetAt: number }
const ipStore = new Map<string, IpEntry>();

// Purge expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of otpStore) {
    if (now > entry.expiresAt) otpStore.delete(key);
  }
  for (const [key, entry] of ipStore) {
    if (now > entry.resetAt) ipStore.delete(key);
  }
}, 10 * 60 * 1000);

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const isDev = process.env["NODE_ENV"] !== "production";

// ── POST /api/auth/send-otp ──────────────────────────────────────────────────
const sendOtp: RequestHandler = (req, res) => {
  const { mobile } = req.body as { mobile?: string };

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    res.status(400).json({ error: "Invalid mobile number (10 digits required)" });
    return;
  }

  const now = Date.now();

  // IP-level rate limit: max 10 OTPs per 10 minutes
  const ip = (req.headers["x-forwarded-for"] as string | undefined)
    ?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "unknown";
  const ipEntry = ipStore.get(ip);
  if (ipEntry && now < ipEntry.resetAt) {
    if (ipEntry.count >= 10) {
      res.status(429).json({ error: "Too many OTP requests. Please try again later." });
      return;
    }
    ipEntry.count++;
  } else {
    ipStore.set(ip, { count: 1, resetAt: now + 10 * 60_000 });
  }

  const existing = otpStore.get(mobile);

  // Per-mobile rate-limit: one OTP per 60 seconds
  if (existing && now - existing.sentAt < 60_000) {
    const remaining = Math.ceil((60_000 - (now - existing.sentAt)) / 1000);
    res
      .status(429)
      .json({ error: `Please wait ${remaining}s before requesting again` });
    return;
  }

  const otp = generateOtp();
  otpStore.set(mobile, {
    otp,
    expiresAt: now + 5 * 60_000, // 5-min expiry
    sentAt: now,
    attempts: 0,
  });

  // TODO production: send SMS via MSG91 / Fast2SMS using process.env.SMS_API_KEY
  // Example MSG91 call would go here.

  const response: Record<string, unknown> = { success: true, expiresIn: 300 };
  if (isDev) {
    // Return OTP in response body in development so testers can verify without a SIM
    response.devOtp = otp;
  }

  res.json(response);
};

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────
const verifyOtp: RequestHandler = (req, res) => {
  const { mobile, otp } = req.body as { mobile?: string; otp?: string };

  if (!mobile || !otp) {
    res.status(400).json({ error: "mobile and otp are required" });
    return;
  }

  const entry = otpStore.get(mobile);
  if (!entry) {
    res.status(400).json({ success: false, error: "OTP not found or already used" });
    return;
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(mobile);
    res.status(400).json({ success: false, error: "OTP expired" });
    return;
  }

  entry.attempts += 1;
  if (entry.attempts > 5) {
    otpStore.delete(mobile);
    res.status(429).json({ success: false, error: "Too many failed attempts" });
    return;
  }

  if (entry.otp !== otp) {
    res.status(400).json({ success: false, error: "Invalid OTP" });
    return;
  }

  // Success – consume the OTP
  otpStore.delete(mobile);
  res.json({ success: true });
};

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

export default router;
