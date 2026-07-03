import { Router, Request, Response } from 'express';
import path from 'path';

const router = Router();

// GET /api/template — download the CSV template
router.get('/', (req: Request, res: Response) => {
  const filePath = path.join(__dirname, '../../templates/pulseboard_template.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="pulseboard_template.csv"');

  res.download(filePath, 'pulseboard_template.csv', (err) => {
    if (err) {
      res.status(500).json({ error: 'Could not download template' });
    }
  });
});

export default router;