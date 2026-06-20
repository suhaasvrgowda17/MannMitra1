import { Router, type IRouter } from "express";
import { db, journalsTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";
import { GetMoodCalendarQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { predictBurnout } from "../lib/ai";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const allEntries = await db
    .select()
    .from(journalsTable)
    .where(eq(journalsTable.userId, user.id))
    .orderBy(desc(journalsTable.createdAt));

  const totalJournals = allEntries.length;

  const moodEntries = allEntries.filter(e => e.moodScore !== null);
  const averageMood = moodEntries.length
    ? moodEntries.reduce((sum, e) => sum + (e.moodScore ?? 0), 0) / moodEntries.length
    : 0;

  // Streak: consecutive days with journal entries
  let currentStreakDays = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const entryDays = new Set(allEntries.map(e => e.createdAt.toISOString().split("T")[0]));
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (entryDays.has(key)) {
      currentStreakDays++;
    } else if (i > 0) {
      break;
    }
  }

  // Weekly mood trend (last 7 days)
  const weeklyMoodTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
    const dayEntries = allEntries.filter(e => e.createdAt.toISOString().split("T")[0] === dayStr);
    const dayMood = dayEntries.length
      ? dayEntries.reduce((sum, e) => sum + (e.moodScore ?? 5), 0) / dayEntries.length
      : null;
    weeklyMoodTrend.push({
      date: dayStr,
      mood: dayMood ?? 0,
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
    });
  }

  // Top stress triggers
  const triggerCounts: Record<string, number> = {};
  allEntries.forEach(e => {
    (e.stressTriggers ?? []).forEach(t => {
      triggerCounts[t] = (triggerCounts[t] ?? 0) + 1;
    });
  });
  const topStressTriggers = Object.entries(triggerCounts)
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]: [string, number]) => t);

  // Recent insights
  const recentInsights = allEntries
    .slice(0, 5)
    .map(e => e.aiInsight)
    .filter(Boolean) as string[];

  res.json({
    totalJournals,
    averageMood: Math.round(averageMood * 10) / 10,
    currentStreakDays,
    weeklyMoodTrend,
    topStressTriggers,
    recentInsights,
    examType: user.examType,
  });
});

router.get("/dashboard/burnout", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);

  const recentEntries = await db
    .select()
    .from(journalsTable)
    .where(gte(journalsTable.createdAt, sevenDaysAgo))
    .orderBy(desc(journalsTable.createdAt));

  const prediction = await predictBurnout(
    recentEntries.map(e => ({
      content: e.content,
      moodScore: e.moodScore,
      stressLevel: e.stressLevel,
      createdAt: e.createdAt,
    }))
  );

  res.json({
    ...prediction,
    basedOnEntries: recentEntries.length,
  });
});

router.get("/dashboard/subject-heatmap", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const entries = await db
    .select()
    .from(journalsTable)
    .where(eq(journalsTable.userId, user.id));

  const subjectData: Record<string, { totalStress: number; count: number }> = {};
  entries.forEach(e => {
    const stress = e.moodScore !== null ? 10 - e.moodScore : 5;
    (e.subjects ?? []).forEach(subject => {
      if (!subjectData[subject]) subjectData[subject] = { totalStress: 0, count: 0 };
      subjectData[subject].totalStress += stress;
      subjectData[subject].count += 1;
    });
  });

  const heatmap = Object.entries(subjectData).map(([subject, data]: [string, { totalStress: number; count: number }]) => ({
    subject,
    stressScore: Math.round((data.totalStress / data.count) * 10) / 10,
    entryCount: data.count,
    trend: null,
  }));

  heatmap.sort((a, b) => b.stressScore - a.stressScore);
  res.json(heatmap);
});

router.get("/dashboard/mood-calendar", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const qp = GetMoodCalendarQueryParams.safeParse(req.query);
  const now = new Date();
  const year = qp.success && qp.data.year ? qp.data.year : now.getFullYear();
  const month = qp.success && qp.data.month ? qp.data.month : now.getMonth() + 1;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const entries = await db
    .select()
    .from(journalsTable)
    .where(eq(journalsTable.userId, user.id));

  const filtered = entries.filter(e => e.createdAt >= start && e.createdAt <= end);

  const dayMap: Record<string, { moods: number[]; stressLevels: string[] }> = {};
  filtered.forEach(e => {
    const day = e.createdAt.toISOString().split("T")[0];
    if (!dayMap[day]) dayMap[day] = { moods: [], stressLevels: [] };
    if (e.moodScore !== null) dayMap[day].moods.push(e.moodScore);
    if (e.stressLevel) dayMap[day].stressLevels.push(e.stressLevel);
  });

  const calendar = Object.entries(dayMap).map(([date, data]) => ({
    date,
    mood: data.moods.length ? data.moods.reduce((a, b) => a + b, 0) / data.moods.length : 5,
    stressLevel: data.stressLevels[0] ?? null,
  }));

  res.json(calendar);
});

export default router;
