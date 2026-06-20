import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const journalsTable = pgTable("journals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  language: text("language").notNull().default("en"),
  subjects: text("subjects").array().notNull().default([]),
  moodScore: real("mood_score"),
  stressLevel: text("stress_level"),
  stressTriggers: text("stress_triggers").array().notNull().default([]),
  aiInsight: text("ai_insight"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJournalSchema = createInsertSchema(journalsTable).omit({ id: true, createdAt: true });
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type Journal = typeof journalsTable.$inferSelect;
