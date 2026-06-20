import { Router, type IRouter } from "express";
import { db, chatMessagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SendChatMessageBody, ListChatMessagesQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { generateChatResponse } from "../lib/ai";

const router: IRouter = Router();

router.get("/chat/messages", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const queryParsed = ListChatMessagesQueryParams.safeParse(req.query);
  const limit = queryParsed.success ? (queryParsed.data.limit ?? 50) : 50;

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, user.id))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(limit);

  res.json(
    messages.reverse().map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/chat/messages", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const language = parsed.data.language ?? "en";

  // Store user message
  await db.insert(chatMessagesTable).values({
    userId: user.id,
    role: "user",
    content: parsed.data.content,
  });

  // Get recent history
  const recentMessages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, user.id))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(20);

  const history = recentMessages.reverse().map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Generate AI response
  const aiReply = await generateChatResponse(
    parsed.data.content,
    history.slice(0, -1),
    { name: user.name, examType: user.examType },
    language
  );

  // Store assistant message
  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({
      userId: user.id,
      role: "assistant",
      content: aiReply,
    })
    .returning();

  res.json({
    ...assistantMsg,
    createdAt: assistantMsg.createdAt.toISOString(),
  });
});

export default router;
