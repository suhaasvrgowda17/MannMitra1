import { Router, type IRouter } from "express";
import { db, journalsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { CreateJournalBody, ListJournalsQueryParams, GetJournalParams, DeleteJournalParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { analyzeJournal } from "../lib/ai";

const router: IRouter = Router();

router.get("/journals", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const queryParsed = ListJournalsQueryParams.safeParse(req.query);
  const page = queryParsed.success ? (queryParsed.data.page ?? 1) : 1;
  const limit = queryParsed.success ? (queryParsed.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;

  const whereClause = eq(journalsTable.userId, user.id);

  const entries = await db
    .select()
    .from(journalsTable)
    .where(whereClause)
    .orderBy(desc(journalsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: journalsTable.id })
    .from(journalsTable)
    .where(whereClause);

  res.json({
    entries: entries.map(e => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
    total: countResult ? Number(countResult.count) : 0,
    page,
    limit,
  });
});

router.post("/journals", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const parsed = CreateJournalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const language = parsed.data.language ?? "en";
  const analysis = await analyzeJournal(parsed.data.content, language);

  const subjects = parsed.data.subjects?.length
    ? parsed.data.subjects
    : analysis.subjects;

  const [journal] = await db
    .insert(journalsTable)
    .values({
      userId: user.id,
      content: parsed.data.content,
      language,
      subjects,
      moodScore: analysis.moodScore,
      stressLevel: analysis.stressLevel,
      stressTriggers: analysis.stressTriggers,
      aiInsight: analysis.aiInsight,
    })
    .returning();

  res.status(201).json({
    ...journal,
    createdAt: journal.createdAt.toISOString(),
  });
});

router.get("/journals/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetJournalParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid journal ID" });
    return;
  }

  const [journal] = await db
    .select()
    .from(journalsTable)
    .where(and(eq(journalsTable.id, params.data.id), eq(journalsTable.userId, user.id)));

  if (!journal) {
    res.status(404).json({ error: "Journal not found" });
    return;
  }

  res.json({ ...journal, createdAt: journal.createdAt.toISOString() });
});

router.delete("/journals/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteJournalParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid journal ID" });
    return;
  }

  const [deleted] = await db
    .delete(journalsTable)
    .where(and(eq(journalsTable.id, params.data.id), eq(journalsTable.userId, user.id)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Journal not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
