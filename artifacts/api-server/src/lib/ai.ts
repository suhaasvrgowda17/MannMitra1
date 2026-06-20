import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface JournalAnalysis {
  moodScore: number;
  stressLevel: string;
  stressTriggers: string[];
  aiInsight: string;
  subjects: string[];
}

export interface BurnoutAnalysis {
  riskLevel: "low" | "moderate" | "high" | "critical";
  riskScore: number;
  analysis: string;
  suggestions: string[];
  warningSigns: string[];
}

const EXAM_CONTEXT = `You are MannMitra, a deeply empathetic AI wellness companion for Indian competitive exam aspirants (JEE, NEET, UPSC, GATE, CAT, CUET). You understand the immense pressure of these exams and the unique cultural context of Indian student life — family expectations, comparison with peers, long study hours, and the weight of academic aspirations.`;

export async function analyzeJournal(content: string, language: string = "en"): Promise<JournalAnalysis> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `${EXAM_CONTEXT}
Analyze the following journal entry and return a JSON object with:
- moodScore: number 0-10 (0=very distressed, 10=very positive)
- stressLevel: "low" | "moderate" | "high" | "critical"
- stressTriggers: array of detected stress triggers (exam subjects, family pressure, comparison, burnout, etc.)
- aiInsight: a 1-2 sentence warm, personalized insight that shows deep understanding
- subjects: array of exam subjects mentioned (Physics, Chemistry, Math, Biology, etc.)
Language: ${language}. Respond ONLY with valid JSON.`,
        },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return {
      moodScore: Math.min(10, Math.max(0, Number(result.moodScore ?? 5))),
      stressLevel: result.stressLevel ?? "moderate",
      stressTriggers: Array.isArray(result.stressTriggers) ? result.stressTriggers : [],
      aiInsight: result.aiInsight ?? "Thank you for sharing. Keep going — every step forward matters.",
      subjects: Array.isArray(result.subjects) ? result.subjects : [],
    };
  } catch {
    return {
      moodScore: 5,
      stressLevel: "moderate",
      stressTriggers: [],
      aiInsight: "Thank you for sharing your thoughts. You're doing better than you think.",
      subjects: [],
    };
  }
}

export async function predictBurnout(journalEntries: Array<{ content: string; moodScore: number | null; stressLevel: string | null; createdAt: Date }>): Promise<BurnoutAnalysis> {
  if (journalEntries.length === 0) {
    return {
      riskLevel: "low",
      riskScore: 10,
      analysis: "Not enough journal entries to predict burnout. Keep journaling to unlock insights.",
      suggestions: ["Start journaling daily to track your wellness", "Take short breaks between study sessions"],
      warningSigns: [],
    };
  }

  try {
    const summary = journalEntries.map(e => ({
      date: e.createdAt.toISOString().split("T")[0],
      mood: e.moodScore,
      stress: e.stressLevel,
      excerpt: e.content.slice(0, 200),
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `${EXAM_CONTEXT}
Based on the last ${journalEntries.length} journal entries, predict burnout risk and return JSON with:
- riskLevel: "low" | "moderate" | "high" | "critical"
- riskScore: number 0-100 (higher = more risk)
- analysis: 2-3 sentence empathetic analysis of the pattern
- suggestions: array of 3-5 specific, actionable recovery suggestions tailored to exam aspirants
- warningSigns: array of specific warning signs detected
Respond ONLY with valid JSON.`,
        },
        { role: "user", content: JSON.stringify(summary) },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return {
      riskLevel: result.riskLevel ?? "moderate",
      riskScore: Math.min(100, Math.max(0, Number(result.riskScore ?? 40))),
      analysis: result.analysis ?? "Keep monitoring your wellness patterns.",
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      warningSigns: Array.isArray(result.warningSigns) ? result.warningSigns : [],
    };
  } catch {
    return {
      riskLevel: "moderate",
      riskScore: 40,
      analysis: "Unable to analyze patterns right now. Keep journaling for better insights.",
      suggestions: ["Take a 10-minute break every hour", "Sleep at least 7 hours", "Talk to a friend or family member"],
      warningSigns: [],
    };
  }
}

export async function generateChatResponse(
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userContext: { name: string; examType: string },
  language: string = "en"
): Promise<string> {
  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `${EXAM_CONTEXT}
You are talking with ${userContext.name}, a ${userContext.examType} aspirant. 
Adapt your tone based on their emotional state:
- Exam anxiety: provide structured, calm guidance
- Burnout: focus on recovery and self-compassion  
- Comparison with peers: provide reassurance and perspective
- Family pressure: validate feelings and help reframe
Never give generic replies. Be context-aware, warm, and genuinely helpful.
If they write in ${language !== "en" ? language : "any language"}, respond in the same language.
Keep responses concise (2-4 sentences) unless they need more.`,
      },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 400,
      messages,
    });

    return completion.choices[0]?.message?.content ?? "I'm here with you. Can you tell me more about what you're feeling?";
  } catch {
    return "I'm here for you. Take a deep breath — you're not alone in this journey.";
  }
}
