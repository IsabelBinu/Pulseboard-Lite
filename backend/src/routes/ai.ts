import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import groq from '../lib/groq';

const router = Router();

// ── Helper: format health records as a readable table for the prompt
function formatHealthData(records: any[]): string {
  if (records.length === 0) return 'No data available.';

  const lines = records.map(r => {
    const date = r.date.toISOString().split('T')[0];
    return [
      `Date: ${date}`,
      r.sleepHours   !== null ? `Sleep: ${r.sleepHours}hrs`     : null,
      r.hrvMs        !== null ? `HRV: ${r.hrvMs}ms`             : null,
      r.restingHr    !== null ? `Resting HR: ${r.restingHr}bpm` : null,
      r.steps        !== null ? `Steps: ${r.steps}`             : null,
      r.activeMinutes!== null ? `Active: ${r.activeMinutes}min` : null,
      r.workoutType              ? `Workout: ${r.workoutType}`   : null,
    ].filter(Boolean).join(' | ');
  });

  return lines.join('\n');
}

// ── Helper: calculate mean and std deviation
function calcStats(values: number[]) {
  if (values.length === 0) return { mean: 0, std: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  );
  return { mean, std };
}

// ════════════════════════════════════════════════════
// FEATURE 1 — AI Health Insights
// POST /api/ai/insights
// ════════════════════════════════════════════════════
router.post('/insights', async (req: Request, res: Response) => {
  try {
    const authPayload = (req as any).auth;
    const keycloakId = authPayload.sub;

    const user = await prisma.user.findUnique({ where: { keycloakId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get last 14 days of records
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 14);

    const records = await prisma.healthRecord.findMany({
      where: {
        upload: { userId: user.id },
        date: { gte: fromDate },
      },
      orderBy: { date: 'asc' },
    });

    if (records.length < 3) {
      return res.json({
        insights: 'Upload at least 3 days of data to receive AI health insights.',
        hasInsights: false,
      });
    }

    const formattedData = formatHealthData(records);

    const completion = await groq.chat.completions.create({
  model: 'qwen/qwen3-32b',
  max_tokens: 500,
  reasoning_effort: 'none',   // <-- disables the <think> block
  messages: [
    {
      role: 'system',
      content: `You are an expert health and performance coach analysing wearable data.
Write in plain, friendly language anyone can understand.

Rules:
- Reference actual numbers from the data
- Keep it to 1–2 short paragraphs
- Be encouraging but honest
- Focus on sleep, HRV, resting HR, and activity trends
- Skip minor or noisy metrics
- Never give a medical diagnosis
- End with one clear recommendation for the coming days`,
    },
    {
      role: 'user',
      content: `Here is my health data for the last 14 days:\n\n${formattedData}\n\nAnalyse my trends and give specific, personalised insights.`,
    },
  ],
});
    const insights = completion.choices[0]?.message?.content || 'Unable to generate insights.';

    return res.json({ insights, hasInsights: true });

  } catch (error) {
    console.error('AI insights error:', error);
    return res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// ════════════════════════════════════════════════════
// FEATURE 3 — Anomaly Detection
// GET /api/ai/anomalies
// ════════════════════════════════════════════════════
router.get('/anomalies', async (req: Request, res: Response) => {
  try {
    const authPayload = (req as any).auth;
    const keycloakId = authPayload.sub;

    const user = await prisma.user.findUnique({ where: { keycloakId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get last 30 days for baseline calculation
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    const records = await prisma.healthRecord.findMany({
      where: {
        upload: { userId: user.id },
        date: { gte: fromDate },
      },
      orderBy: { date: 'asc' },
    });

    if (records.length < 7) {
      return res.json({
        anomalies: [],
        message: 'Need at least 7 days of data for anomaly detection.',
      });
    }

    // Calculate Z-scores for each metric
    const metrics = [
      { key: 'hrvMs',        label: 'HRV',          unit: 'ms',    direction: 'low'  },
      { key: 'restingHr',    label: 'Resting HR',   unit: 'bpm',   direction: 'high' },
      { key: 'sleepHours',   label: 'Sleep',        unit: 'hrs',   direction: 'both' },
      { key: 'steps',        label: 'Steps',        unit: 'steps', direction: 'low'  },
    ];

    const anomalies: any[] = [];

    for (const metric of metrics) {
      const values = records
        .map(r => r[metric.key as keyof typeof r] as number | null)
        .filter((v): v is number => v !== null);

      if (values.length < 5) continue;

      const { mean, std } = calcStats(values);
      if (std === 0) continue;

      // Check each record for anomalies
      for (const record of records) {
        const value = record[metric.key as keyof typeof record] as number | null;
        if (value === null) continue;

        const zScore = (value - mean) / std;
        const threshold = 2;

        const isAnomaly =
          metric.direction === 'low'  ? zScore < -threshold :
          metric.direction === 'high' ? zScore > threshold  :
          Math.abs(zScore) > threshold;

        if (isAnomaly) {
          anomalies.push({
            date: record.date.toISOString().split('T')[0],
            metric: metric.label,
            value: `${value}${metric.unit}`,
            average: `${Math.round(mean * 10) / 10}${metric.unit}`,
            zScore: Math.round(zScore * 10) / 10,
            direction: zScore < 0 ? 'below' : 'above',
          });
        }
      }
    }

    // Sort anomalies by date, most recent first
    anomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Limit to 5 most recent
    const topAnomalies = anomalies.slice(0, 5);

    if (topAnomalies.length === 0) {
      return res.json({ anomalies: [], message: 'No anomalies detected — your data looks consistent!' });
    }

    // Ask Groq to explain the anomalies
    const anomalyText = topAnomalies.map(a =>
      `${a.date}: ${a.metric} was ${a.value} (${a.direction} average of ${a.average}, z-score: ${a.zScore})`
    ).join('\n');

    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3-32b',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are a health analytics assistant explaining statistical anomalies in health data.
For each anomaly provide a brief, plain-English explanation of what it might mean.
Be specific, concise (1-2 sentences per anomaly), and never give medical diagnoses.
Format your response as a numbered list matching the anomalies provided.`,
        },
        {
          role: 'user',
          content: `These anomalies were detected in my health data (values more than 2 standard deviations from my 30-day average):\n\n${anomalyText}\n\nPlease explain what each anomaly might indicate.`,
        },
      ],
    });

    const explanations = completion.choices[0]?.message?.content || '';

    return res.json({ anomalies: topAnomalies, explanations });

  } catch (error) {
    console.error('Anomaly detection error:', error);
    return res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// ════════════════════════════════════════════════════
// FEATURE 5 — Weekly AI Summary
// GET /api/ai/weekly-summary
// ════════════════════════════════════════════════════
router.get('/weekly-summary', async (req: Request, res: Response) => {
  try {
    const authPayload = (req as any).auth;
    const keycloakId = authPayload.sub;

    const user = await prisma.user.findUnique({ where: { keycloakId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Check if we already have a summary for this week
    const existing = await prisma.weeklySummary.findFirst({
      where: {
        userId: user.id,
        weekStart: { gte: weekStart },
      },
    });

    if (existing) {
      return res.json({
        summary: existing.content,
        weekStart: weekStart.toISOString().split('T')[0],
        cached: true,
      });
    }

    // Get last 7 days of records
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);

    const records = await prisma.healthRecord.findMany({
      where: {
        upload: { userId: user.id },
        date: { gte: fromDate },
      },
      orderBy: { date: 'asc' },
    });

    if (records.length < 3) {
      return res.json({
        summary: 'Upload at least 3 days of data this week to receive your weekly summary.',
        weekStart: weekStart.toISOString().split('T')[0],
        cached: false,
      });
    }

    const formattedData = formatHealthData(records);

    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3-32b',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are a supportive health and performance coach writing a weekly health summary.
Write in a warm, encouraging but honest tone — like a coach giving a Monday debrief.
Structure your response with exactly these four sections:
1. Overall week assessment (2 sentences)
2. Standout moment or strongest metric (1-2 sentences, be specific with numbers)
3. Biggest opportunity for improvement (1-2 sentences)
4. Recommendation for the coming week (1-2 sentences)
Keep the total under 200 words. Use plain English, no bullet points.`,
        },
        {
          role: 'user',
          content: `Here is my health data for the past week:\n\n${formattedData}\n\nPlease write my weekly health summary.`,
        },
      ],
    });

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary.';

    // Cache the summary in DB
    await prisma.weeklySummary.create({
      data: {
        userId: user.id,
        weekStart,
        content: summary,
      },
    });

    return res.json({
      summary,
      weekStart: weekStart.toISOString().split('T')[0],
      cached: false,
    });

  } catch (error) {
    console.error('Weekly summary error:', error);
    return res.status(500).json({ error: 'Failed to generate weekly summary' });
  }
});

// ════════════════════════════════════════════════════
// FEATURE 2 — RAG Health Chatbot
// POST /api/ai/chat
// ════════════════════════════════════════════════════
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const authPayload = (req as any).auth;
    const keycloakId = authPayload.sub;
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const user = await prisma.user.findUnique({ where: { keycloakId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // RAG — retrieve ALL user health records as context
    const allRecords = await prisma.healthRecord.findMany({
      where: { upload: { userId: user.id } },
      orderBy: { date: 'asc' },
    });

    if (allRecords.length === 0) {
      return res.json({
        response: 'You have no health data uploaded yet. Please upload a CSV file first, then I can answer questions about your health trends.',
      });
    }

    // Format all records as context
    const healthContext = formatHealthData(allRecords);

    // Build conversation messages
    const messages = [
      // Inject health data as first user message + assistant acknowledgement
      {
        role: 'user' as const,
        content: `Here is my complete health data:\n\n${healthContext}`,
      },
      {
        role: 'assistant' as const,
        content: 'I have reviewed your health data. I can now answer specific questions about your sleep, HRV, resting heart rate, activity, and recovery trends. What would you like to know?',
      },
      // Include conversation history for multi-turn
      ...conversationHistory,
      // Current user message
      { role: 'user' as const, content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3-32b',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are a personal health analytics assistant with access to the user's complete health data.
Rules:
- Answer questions using ONLY the data provided — never invent values
- Be specific — reference actual dates and numbers
- Be concise — 2 to 4 sentences unless more detail is needed
- If you cannot answer from the data, say so honestly
- Never give medical diagnoses or replace professional medical advice
- You can perform calculations: averages, trends, comparisons, best/worst days`,
        },
        ...messages,
      ],
    });

    const response = completion.choices[0]?.message?.content || 'I was unable to process your question. Please try again.';

    return res.json({ response });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;