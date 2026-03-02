import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_PREFIX = "sha256=";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function isFacebookVerificationRequest(searchParams: URLSearchParams): boolean {
  return searchParams.get("hub.mode") === "subscribe";
}

export function verifyFacebookChallenge(searchParams: URLSearchParams): string | null {
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (!mode || !token || !challenge) {
    return null;
  }

  const expectedVerifyToken = requireEnv("FACEBOOK_WEBHOOK_VERIFY_TOKEN");
  if (mode !== "subscribe" || token !== expectedVerifyToken) {
    return null;
  }

  return challenge;
}

export function verifyFacebookRequestSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !signatureHeader.startsWith(SIGNATURE_PREFIX)) {
    return false;
  }

  const appSecret = requireEnv("FACEBOOK_APP_SECRET");
  const expectedDigest = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const expectedSignature = `${SIGNATURE_PREFIX}${expectedDigest}`;

  const received = Buffer.from(signatureHeader, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}
