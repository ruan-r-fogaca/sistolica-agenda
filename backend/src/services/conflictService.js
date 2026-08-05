/**
 * conflictService.js
 * ------------------------------------------------------------------
 * Regras de negócio obrigatórias:
 * 1) "Gestão de Conflitos": um consultor não pode ter dois agendamentos
 *    que se sobrepõem no mesmo dia.
 * 2) "Descanso obrigatório": um consultor não pode ficar mais de 1h
 *    (DURACAO_MAXIMA_SEGUIDA) em atendimentos emendados (sem intervalo)
 *    sem que haja pelo menos 30min (DESCANSO_MINIMO) de descanso antes
 *    de continuar.
 * ------------------------------------------------------------------
 */

const DURACAO_MAXIMA_SEGUIDA = 60; // minutos
const DESCANSO_MINIMO = 30; // minutos

function paraMinutos(horaHHMM) {
  const [h, m] = horaHHMM.split(':').map(Number);
  return h * 60 + m;
}

export function paraHHMM(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(
    min % 60
  ).padStart(2, '0')}`;
}

export function horariosConflitam(inicioA, fimA, inicioB, fimB) {
  const iA = paraMinutos(inicioA);
  const fA = paraMinutos(fimA);
  const iB = paraMinutos(inicioB);
  const fB = paraMinutos(fimB);
  return iA < fB && iB < fA;
}

export function encontrarConflito(agendamentosDoDia, novo, ignorarId = null) {
  for (const existente of agendamentosDoDia) {
    if (ignorarId && existente.id === ignorarId) continue;
    if (
      horariosConflitam(
        novo.horaInicio,
        novo.horaFim,
        existente.horaInicio,
        existente.horaFim
      )
    ) {
      return existente;
    }
  }
  return null;
}

export function excederiaDescanso(
  agendamentosDoDia,
  candidatoInicio,
  candidatoFim,
  ignorarId = null
) {
  const existentes = agendamentosDoDia
    .filter((a) => !ignorarId || a.id !== ignorarId)
    .map((a) => ({ inicio: paraMinutos(a.horaInicio), fim: paraMinutos(a.horaFim) }))
    .sort((a, b) => a.inicio - b.inicio);

  let duracaoAntes = 0;
  let alvoAntes = candidatoInicio;
  for (let i = existentes.length - 1; i >= 0; i--) {
    const ex = existentes[i];
    if (ex.fim === alvoAntes) {
      duracaoAntes += ex.fim - ex.inicio;
      alvoAntes = ex.inicio;
    }
  }

  let duracaoDepois = 0;
  let alvoDepois = candidatoFim;
  for (let i = 0; i < existentes.length; i++) {
    const ex = existentes[i];
    if (ex.inicio === alvoDepois) {
      duracaoDepois += ex.fim - ex.inicio;
      alvoDepois = ex.fim;
    }
  }

  const duracaoBloco =
    duracaoAntes + (candidatoFim - candidatoInicio) + duracaoDepois;
  return duracaoBloco > DURACAO_MAXIMA_SEGUIDA;
}

export function validarNovoAgendamento(
  agendamentosDoDia,
  { horaInicio, horaFim },
  ignorarId = null
) {
  const conflito = encontrarConflito(
    agendamentosDoDia,
    { horaInicio, horaFim },
    ignorarId
  );
  if (conflito) {
    return { ok: false, motivo: 'conflito', conflito };
  }

  if (
    excederiaDescanso(
      agendamentosDoDia,
      paraMinutos(horaInicio),
      paraMinutos(horaFim),
      ignorarId
    )
  ) {
    return {
      ok: false,
      motivo: 'descanso',
      mensagem: `Esse horário ultrapassaria ${DURACAO_MAXIMA_SEGUIDA} min seguidos de atendimento. É necessário pelo menos ${DESCANSO_MINIMO} min de descanso antes.`,
    };
  }

  return { ok: true };
}

export function calcularHorariosLivres(
  agendamentosDoDia,
  { inicioExpediente = '08:00', fimExpediente = '18:00', passoMinutos = 30 } = {}
) {
  const livres = [];
  let cursor = paraMinutos(inicioExpediente);
  const fim = paraMinutos(fimExpediente);

  const ocupados = agendamentosDoDia
    .map((a) => [paraMinutos(a.horaInicio), paraMinutos(a.horaFim)])
    .sort((a, b) => a[0] - b[0]);

  while (cursor + passoMinutos <= fim) {
    const blocoFim = cursor + passoMinutos;
    const ocupado = ocupados.some(([i, f]) => cursor < f && i < blocoFim);
    const bloqueadoPorDescanso =
      !ocupado && excederiaDescanso(agendamentosDoDia, cursor, blocoFim);

    if (!ocupado && !bloqueadoPorDescanso) {
      livres.push({ inicio: paraHHMM(cursor), fim: paraHHMM(blocoFim) });
    }
    cursor += passoMinutos;
  }
  return livres;
}