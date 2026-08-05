import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import consultoresRouter from './src/routes/consultores.js';
import agendaRouter from './src/routes/agenda.js';
import iaRouter from './src/routes/ia.js';
import { integracaoReal } from './src/services/sheetsService.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    servico: 'sistolica-agenda-backend',
    googleSheets: integracaoReal ? 'integração real' : 'simulado',
  });
});

app.use('/api/consultores', consultoresRouter);
app.use('/api/agenda', agendaRouter);
app.use('/api/ia', iaRouter);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.listen(PORT, () => {
  console.log(`API da Agenda Sistólica rodando em http://localhost:${PORT}`);
});
