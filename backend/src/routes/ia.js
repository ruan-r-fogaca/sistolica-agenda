import { Router } from 'express';
import { getAgendamentos, getConsultores } from '../services/sheetsService.js';
import { sugerirHorario } from '../services/geminiService.js';

const router = Router();

// POST /api/ia/sugestao  { consultorId, data, descricao }
router.post('/sugestao', async (req, res) => {
  const { consultorId, data, descricao } = req.body;

  if (!consultorId || !data || !descricao) {
    return res.status(400).json({
      erro: 'Campos obrigatórios: consultorId, data, descricao.',
    });
  }

  const consultores = await getConsultores();
  const consultor = consultores.find((c) => c.id === consultorId);
  if (!consultor) {
    return res.status(404).json({ erro: 'Consultor não encontrado.' });
  }

  const agendamentosDoDia = await getAgendamentos({ consultorId, data });

  const sugestao = await sugerirHorario({
    agendamentosDoDia,
    descricao,
    nomeConsultor: consultor.nome,
    data,
  });

  res.json(sugestao);
});

export default router;
