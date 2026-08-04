/**
 * conflictService.js
 * ------------------------------------------------------------------
 * Regra de negócio obrigatória: "Gestão de Conflitos".
 * Um consultor não pode ter dois agendamentos que se sobrepõem no
 * mesmo dia. Duas faixas de horário [inicioA, fimA) e [inicioB, fimB)
 * conflitam quando inicioA < fimB E inicioB < fimA.
 * ------------------------------------------------------------------
 */

function paraMinutos(horaHHMM) {
  const [h, m] = horaHHMM.split(':').map(Number);
  return h * 60 + m;
}

export function horariosConflitam(inicioA, fimA, inicioB, fimB) {
  const iA = paraMinutos(inicioA);
  const fA = paraMinutos(fimA);
  const iB = paraMinutos(inicioB);
  const fB = paraMinutos(fimB);
  return iA < fB && iB < fA;
}

/**
 * Verifica se um novo agendamento colide com algum já existente
 * para o mesmo consultor, no mesmo dia.
 * @param {Array} agendamentosDoDia - agendamentos já existentes (mesmo consultor + data)
 * @param {{horaInicio: string, horaFim: string}} novo
 * @param {string} [ignorarId] - usado ao editar um agendamento existente
 * @returns {object|null} o agendamento conflitante, ou null se não houver conflito
 */
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

/**
 * Dado o expediente (ex: 08:00-18:00) e os agendamentos do dia,
 * retorna os intervalos livres, em blocos de `passoMinutos`.
 */
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
      const h = (min) =>
        `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(
          min % 60
        ).padStart(2, '0')}`;
      livres.push({ inicio: h(cursor), fim: h(blocoFim) });
    }
    cursor += passoMinutos;
  }
  return livres;
}
