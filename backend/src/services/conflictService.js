/**
 * conflictService.js
 * ------------------------------------------------------------------
 * Regra de negócio:
 * "Gestão de Conflitos": um consultor não pode ter dois agendamentos
 * que se sobrepõem no mesmo dia (mesmo horário, ou horários que se cruzam).
 * ------------------------------------------------------------------
 */

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

    if (!ocupado) {
      livres.push({ inicio: paraHHMM(cursor), fim: paraHHMM(blocoFim) });
    }
    cursor += passoMinutos;
  }
  return livres;
}