import crypto from "crypto";

const PUBLIC_BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")
    ? process.env.NEXTAUTH_URL
    : "https://www.roboticexplorer.site")
).replace(/\/+$/, "");

function getReceiptSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    "apka-by-dn-secret-key-2026-change-in-production"
  );
}

/**
 * Menghasilkan tanda tangan HMAC pendek (12 karakter hex) untuk mengizinkan
 * akses aman ke proxy bukti transfer tanpa membocorkan URL storage Supabase.
 */
export function signReceiptToken(rekapId: string, type: "h" | "t"): string {
  return crypto
    .createHmac("sha256", getReceiptSecret())
    .update(`${rekapId}:${type}`)
    .digest("hex")
    .slice(0, 12);
}

export function verifyReceiptToken(
  rekapId: string,
  type: "h" | "t",
  token?: string | null
): boolean {
  if (!token) return false;
  const expected = signReceiptToken(rekapId, type);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(token.trim(), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function buildSignedReceiptUrl(rekapId: string, type: "h" | "t"): string {
  const token = signReceiptToken(rekapId, type);
  return `${PUBLIC_BASE_URL}/b/${encodeURIComponent(rekapId)}/${type}?k=${token}`;
}
