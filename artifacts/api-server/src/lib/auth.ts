import crypto from "crypto";
import { type Request } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "mannmitra-secret-key";

export function hashPassword(password: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function createToken(userId: number): string {
  const payload = JSON.stringify({ userId, iat: Date.now() });
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
    if (expected !== sig) return null;
    return JSON.parse(payload) as { userId: number };
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: Request): Promise<typeof usersTable.$inferSelect | null> {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId));
  return user ?? null;
}

export async function requireAuth(req: Request, res: import("express").Response): Promise<typeof usersTable.$inferSelect | null> {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}
