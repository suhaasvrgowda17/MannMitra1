import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword, createToken, requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email.toLowerCase()));
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = createToken(user.id);
  req.log.info({ userId: user.id }, "User logged in");
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      examType: user.examType,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email.toLowerCase()));
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = hashPassword(parsed.data.password);
  const [user] = await db
    .insert(usersTable)
    .values({
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      name: parsed.data.name,
      examType: parsed.data.examType,
    })
    .returning();

  const token = createToken(user.id);
  logger.info({ userId: user.id }, "New user registered");
  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      examType: user.examType,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    examType: user.examType,
    preferredLanguage: user.preferredLanguage,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
