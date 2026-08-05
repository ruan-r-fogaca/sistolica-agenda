import { Router } from 'express';
import {
  getAgendamentos,
  addAgendamento,
  deleteAgendamento,
  getConsultores,
} from '../services/sheetsService.js';
import { validarNovoAgendamento, calcularHorariosLivres } from '../services/conflictService.js';

const router = Router();

// GET /api/agenda?consultorId=&data=
router.get('/', async (req, res) => {
  const { consultorId, data } = req.query;
  const agendamentos = await getAgendamentos({ consultorId, data });
  res.json(agendamentos);
});

// GET /api/agenda/livres?consultorId=&data=  -> horários livres do dia
router.get('/livres', async (req, res) => {
  const { consultorId, data } = req.query;
  if (!consultorId || !data) {
    return res
      .status(400)
      .json({ erro: 'Parâmetros consultorId e data são obrigatórios.' });
  }
  const agendamentosDoDia = await getAgendamentos({ consultorId, data });
  const livres = calcularHorariosLivres(agendamentosDoDia);
  res.json(livres);
});

// POST /api/agenda  -> cria agendamento, bloqueando conflitos
router.post('/', async (req, res) => {
  const { consultorId, data, horaInicio, horaFim, cliente, descricao, tipo } =
    req.body;

  if (!consultorId || !data || !horaInicio || !horaFim || !cliente) {
    return res.status(400).json({
      erro: 'Campos obrigatórios: consultorId, data, horaInicio, horaFim, cliente.',
    });
  }

  if (horaInicio >= horaFim) {
    return res
      .status(400)
      .json({ erro: 'O horário de início deve ser antes do horário de fim.' });
  }

  const consultores = await getConsultores();
  if (!consultores.some((c) => c.id === consultorId)) {
    return res.status(404).json({ erro: 'Consultor não encontrado.' });
  }

  const agendamentosDoDia = await getAgendamentos({ consultorId, data });
  const validacao = validarNovoAgendamento(agendamentosDoDia, { horaInicio, horaFim });

  if (!validacao.ok && validacao.motivo === 'conflito') {
    return res.status(409).json({
      erro: 'Conflito de horário: o consultor já tem um compromisso nesse intervalo.',
      conflito: validacao.conflito,
    });
  }

  if (!validacao.ok && validacao.motivo === 'descanso') {
    return res.status(409).json({ erro: validacao.mensagem });
  }

  const registro = await addAgendamento({
    consultorId,
    data,
    horaInicio,
    horaFim,
    cliente,
    descricao: descricao || '',
    tipo: tipo || 'Atendimento geral',
  });

  res.status(201).json(registro);
});

// DELETE /api/agenda/:id
router.delete('/:id', async (req, res) => {
  const ok = await deleteAgendamento(req.params.id);
  if (!ok) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  res.status(204).send();
});

export default router;