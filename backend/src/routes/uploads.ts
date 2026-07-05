
import { Router, Request, Response } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import { z } from 'zod';
import prisma from '../lib/prisma';


// Helper to parse dates in multiple formats
function parseDate(dateStr: string): Date {
  if (!dateStr) throw new Error('Empty date');

  // Try direct parse first (works for YYYY-MM-DD)
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime())) return direct;

  // Try DD-MM-YYYY format (Excel default in NZ/AU)
  const ddmmyyyy = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d;
  }

  // Try DD/MM/YY format
  const ddmmyy = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/);
  if (ddmmyy) {
    const [, day, month, year] = ddmmyy;
    const d = new Date(`20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d;
  }

  throw new Error(`Cannot parse date: ${dateStr}`);
}

const router = Router();



// Multer config — store file in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Zod schema for one CSV row
const HealthRowSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  sleep_hours: z.coerce.number().min(0).max(24),
  hrv_ms: z.coerce.number().min(0),
  resting_hr: z.coerce.number().min(0),
  steps: z.coerce.number().int().min(0),
  active_minutes: z.coerce.number().int().min(0),
  workout_type: z.string().optional(),
  distance_km: z.coerce.number().min(0).optional(),
  calories: z.coerce.number().int().min(0).optional(),
});

// POST /api/uploads — upload and parse CSV
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvText = req.file.buffer.toString('utf-8');

    // Parse CSV with PapaParse
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data as Record<string, string>[];
    const validRows: any[] = [];
    const invalidRows: { rowNumber: number; error: string }[] = [];

    // Validate each row with Zod
    rows.forEach((row, index) => {
      const result = HealthRowSchema.safeParse(row);
      if (result.success) {
        validRows.push(result.data);
      } else {
        // Fix 1: use .issues instead of .errors
        const errorMsg = result.error.issues
			.map(e => `${String(e.path[0])}: ${e.message}`)
			.join(', ');
        invalidRows.push({ rowNumber: index + 2, error: errorMsg });
      }
    });

    return res.json({
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      previewRows: validRows.slice(0, 10),
      invalidRows,
      validRows,
      filename: req.file.originalname,
    });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to process CSV' });
  }
});

// POST /api/uploads/import — save valid rows to DB
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { validRows, filename } = req.body;

    if (!validRows || validRows.length === 0) {
      return res.status(400).json({ error: 'No valid rows to import' });
    }

    // Fix 2: cast req to any to access our custom auth property
    const authPayload = (req as any).auth;
    const keycloakId = authPayload.sub;

    // Find or create user in DB
    let user = await prisma.user.findUnique({ where: { keycloakId } });
    if (!user) {
      const email = authPayload.email || `${keycloakId}@unknown.com`;
      user = await prisma.user.create({
        data: { keycloakId, email }
      });
    }

    // Check for existing dates to avoid duplicates
    const existingDates = await prisma.healthRecord.findMany({
      where: { upload: { userId: user.id } },
      select: { date: true },
    });

    const existingDateStrings = new Set(
      existingDates.map(r => r.date.toISOString().split('T')[0])
    );

    // Filter out duplicate dates
    const newRows = validRows.filter((row: any) => {
      const rowDate = parseDate(row.date).toISOString().split('T')[0];
      return !existingDateStrings.has(rowDate);
    });

    const skippedCount = validRows.length - newRows.length;

    // Create Upload record
    const uploadRecord = await prisma.upload.create({
      data: {
        userId: user.id,
        filename: filename || 'upload.csv',
        rowCount: newRows.length,
      }
    });

    // Bulk insert HealthRecords
    await prisma.healthRecord.createMany({
      data: newRows.map((row: any) => ({
        uploadId: uploadRecord.id,
        date: parseDate(row.date),
        sleepHours: row.sleep_hours,
        hrvMs: row.hrv_ms,
        restingHr: row.resting_hr,
        steps: row.steps,
        activeMinutes: row.active_minutes,
        workoutType: row.workout_type || null,
        distanceKm: row.distance_km || null,
        calories: row.calories || null,
      }))
    });

    return res.json({
      success: true,
      imported: newRows.length,
      skipped: skippedCount,
      uploadId: uploadRecord.id,
    });

  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ error: 'Failed to import data' });
  }
});
// ── GET /api/uploads/history — get all uploads for current user
router.get('/history', async (req: Request, res: Response) => {
  try {
    const authPayload = (req as any).auth;
    const keycloakId = authPayload.sub;

    // Find user
    const user = await prisma.user.findUnique({ where: { keycloakId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all uploads for this user, newest first
    const uploads = await prisma.upload.findMany({
      where: { userId: user.id },
      orderBy: { importedAt: 'desc' },
      select: {
        id: true,
        filename: true,
        rowCount: true,
        importedAt: true,
      },
    });

    return res.json({ uploads });

  } catch (error) {
    console.error('History error:', error);
    return res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

// ── DELETE /api/uploads/:id — delete an upload and its health records
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const authPayload = (req as any).auth;
    const keycloakId = authPayload.sub;

    // Extract and explicitly type as string
    const uploadId: string = String(req.params.id);

    // Find user
    const user = await prisma.user.findUnique({ where: { keycloakId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify the upload belongs to this user
    const upload = await prisma.upload.findFirst({
      where: {
        id: { equals: uploadId },
        userId: user.id
      },
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Delete upload — HealthRecords deleted automatically via CASCADE
    await prisma.upload.delete({
      where: { id: String(uploadId) }
    });

    return res.json({
      success: true,
      message: `Deleted ${upload.rowCount} health records`,
    });

  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete upload' });
  }
});
export default router;

