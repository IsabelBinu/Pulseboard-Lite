import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ── Recovery score calculation
function calculateRecoveryScore(records: any[]) {
  if (records.length === 0) return null;

  // Get most recent record
  const latest = records[records.length - 1];

  // Need at least 2 records to calculate meaningfully
  if (records.length < 2) {
    return {
      score: 50,
      recommendation: 'Not enough data for accurate score',
      confidence: 'Low',
      explanation: 'Upload more data to improve accuracy',
    };
  }

  // Calculate 7-day averages (or all records if less than 7)
  const recentRecords = records.slice(-7);

  const avgHrv = recentRecords
    .filter(r => r.hrvMs !== null)
    .reduce((sum, r, _, arr) => sum + r.hrvMs / arr.length, 0);

  const avgRestingHr = recentRecords
    .filter(r => r.restingHr !== null)
    .reduce((sum, r, _, arr) => sum + r.restingHr / arr.length, 0);

  // ── HRV Score (50% weight)
  // Higher HRV than average = better recovery
  let hrvScore = 50;
  if (latest.hrvMs !== null && avgHrv > 0) {
    hrvScore = Math.min(100, Math.max(0, 50 + (latest.hrvMs - avgHrv) * 2));
  }

  // ── Sleep Score (30% weight)
  // Based on absolute hours slept
  let sleepScore = 50;
  if (latest.sleepHours !== null) {
    if (latest.sleepHours >= 8)      sleepScore = 100;
    else if (latest.sleepHours >= 7) sleepScore = 80;
    else if (latest.sleepHours >= 6) sleepScore = 60;
    else if (latest.sleepHours >= 5) sleepScore = 40;
    else                             sleepScore = 20;
  }

  // ── Resting HR Score (20% weight)
  // Lower than average = better recovery
  let restingHrScore = 50;
  if (latest.restingHr !== null && avgRestingHr > 0) {
    restingHrScore = Math.min(
      100, Math.max(0, 50 - (latest.restingHr - avgRestingHr) * 3)
    );
  }

  // ── Weighted final score
  const score = Math.round(
    hrvScore * 0.5 +
    sleepScore * 0.3 +
    restingHrScore * 0.2
  );

  // ── Recommendation
  let recommendation: string;
  if      (score >= 80) recommendation = 'Full training — your body is ready';
  else if (score >= 60) recommendation = 'Moderate to hard training';
  else if (score >= 40) recommendation = 'Light training or active recovery';
  else if (score >= 20) recommendation = 'Rest day recommended';
  else                  recommendation = 'Full rest — your body needs recovery';

  // ── Confidence based on data availability
  let confidence: string;
  if      (records.length >= 7) confidence = 'High';
  else if (records.length >= 3) confidence = 'Medium';
  else                          confidence = 'Low';

  return {
    score,
    recommendation,
    confidence,
    explanation: `Based on HRV (50%), Sleep (30%), Resting HR (20%)`,
    breakdown: {
      hrvScore: Math.round(hrvScore),
      sleepScore: Math.round(sleepScore),
      restingHrScore: Math.round(restingHrScore),
    },
  };
}

// ── GET /api/dashboard?days=7|30|90
router.get('/', async (req: Request, res: Response) => {
  try {
    const authPayload = (req as any).auth;
    const keycloakId = authPayload.sub;

    // Find user
    const user = await prisma.user.findUnique({ where: { keycloakId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Date range filter
    const days = parseInt(req.query.days as string) || 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Fetch records in date range
    const records = await prisma.healthRecord.findMany({
      where: {
        upload: { userId: user.id },
        date: { gte: fromDate },
      },
      orderBy: { date: 'asc' },
    });

    if (records.length === 0) {
      return res.json({ empty: true, records: [] });
    }

    // Calculate averages
    const avg = (arr: (number | null)[]) => {
      const valid = arr.filter((v): v is number => v !== null);
      return valid.length > 0
        ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
        : null;
    };

    const summaryCards = {
      avgSleepHours: avg(records.map(r => r.sleepHours)),
      avgHrv:        avg(records.map(r => r.hrvMs)),
      avgRestingHr:  avg(records.map(r => r.restingHr)),
      avgSteps:      avg(records.map(r => r.steps)),
    };

    // Format chart data
    const chartData = records.map(r => ({
      date:          r.date.toISOString().split('T')[0],
      sleepHours:    r.sleepHours,
      hrvMs:         r.hrvMs,
      restingHr:     r.restingHr,
      steps:         r.steps,
      activeMinutes: r.activeMinutes,
      workoutType:   r.workoutType,
    }));

    // Calculate recovery score
    const recoveryScore = calculateRecoveryScore(records);

    return res.json({
      empty: false,
      summaryCards,
      chartData,
      recoveryScore,
      totalRecords: records.length,
      dateRange: { days, from: fromDate.toISOString().split('T')[0] },
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export default router;