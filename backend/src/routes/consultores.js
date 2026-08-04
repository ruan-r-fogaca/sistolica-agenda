import { Router } from 'express';
import { getConsultores } from '../services/sheetsService.js';

const router = Router();

router.get('/', async (req, res) => {
  const consultores = await getConsultores();
  res.json(consultores);
});

export default router;
