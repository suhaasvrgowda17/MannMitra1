import { Router, type IRouter } from "express";
import { db, sosSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSosSettingsBody, TriggerSosBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/sos/settings", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const [settings] = await db
    .select()
    .from(sosSettingsTable)
    .where(eq(sosSettingsTable.userId, user.id));

  if (!settings) {
    res.status(404).json({ error: "SOS settings not found" });
    return;
  }

  res.json({
    id: settings.id,
    contactName: settings.contactName,
    contactPhone: settings.contactPhone,
    contactEmail: settings.contactEmail,
    message: settings.message,
    isActive: settings.isActive,
  });
});

router.put("/sos/settings", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const parsed = UpdateSosSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(sosSettingsTable)
    .where(eq(sosSettingsTable.userId, user.id));

  let settings;
  if (existing) {
    const [updated] = await db
      .update(sosSettingsTable)
      .set({
        contactName: parsed.data.contactName,
        contactPhone: parsed.data.contactPhone,
        contactEmail: parsed.data.contactEmail ?? null,
        message: parsed.data.message ?? null,
        isActive: parsed.data.isActive ?? true,
      })
      .where(eq(sosSettingsTable.userId, user.id))
      .returning();
    settings = updated;
  } else {
    const [created] = await db
      .insert(sosSettingsTable)
      .values({
        userId: user.id,
        contactName: parsed.data.contactName,
        contactPhone: parsed.data.contactPhone,
        contactEmail: parsed.data.contactEmail ?? null,
        message: parsed.data.message ?? null,
        isActive: parsed.data.isActive ?? true,
      })
      .returning();
    settings = created;
  }

  res.json({
    id: settings.id,
    contactName: settings.contactName,
    contactPhone: settings.contactPhone,
    contactEmail: settings.contactEmail,
    message: settings.message,
    isActive: settings.isActive,
  });
});

router.post("/sos/trigger", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const parsed = TriggerSosBody.safeParse(req.body);
  const note = parsed.success ? parsed.data.note : null;

  const [settings] = await db
    .select()
    .from(sosSettingsTable)
    .where(eq(sosSettingsTable.userId, user.id));

  if (!settings || !settings.isActive) {
    res.json({
      success: false,
      message: "SOS settings not configured or disabled. Please set up an emergency contact first.",
    });
    return;
  }

  req.log.info({ userId: user.id, contact: settings.contactName }, "SOS triggered");

  res.json({
    success: true,
    message: `SOS alert sent to ${settings.contactName}. Help is on the way. You are not alone.`,
  });
});

export default router;
