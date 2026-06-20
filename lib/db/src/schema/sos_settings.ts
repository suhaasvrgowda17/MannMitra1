import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sosSettingsTable = pgTable("sos_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email"),
  message: text("message"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSosSettingsSchema = createInsertSchema(sosSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSosSettings = z.infer<typeof insertSosSettingsSchema>;
export type SosSettings = typeof sosSettingsTable.$inferSelect;
