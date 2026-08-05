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
 * Regra: nenhum consultor pode ficar mais de `duracaoMaximaSeguidaMin`
 * minutos em atendimentos emendados (sem intervalo) sem um descanso de
 * pelo menos `descansoMinimoMin` minutos. Isso vale mesmo que os
 * atendimentos sejam vários horários menores encostados um no outro
 * (ex: 08:00–08:30 + 08:30–09:00 = 1h seguida).
 *
 * @param {Array} agendamentosDoDia - agendamentos já existentes (mesmo consultor + data)
 * @param {{horaInicio: string, horaFim: string}} novo
 * @param {string} [ignorarId] - usado ao editar um agendamento existente
 * @returns {{violacao: boolean, duracaoBlocoMin?: number, mensagem?: string}}
 */
export function validarDescansoObrigatorio(
  agendamentosDoDia,
  novo,
  ignorarId = null,
  { duracaoMaximaSeguidaMin = 60, descansoMinimoMin = 30 } = {}
) {
  const existentes = agendamentosDoDia
    .filter((a) => !ignorarId || a.id !== ignorarId)
    .map((a) => ({
      inicio: paraMinutos(a.horaInicio),
      fim: paraMinutos(a.horaFim),
    }))
    .sort((a, b) => a.inicio - b.inicio);

  const novoInicio = paraMinutos(novo.horaInicio);
  const novoFim = paraMinutos(novo.horaFim);

  // Soma a duração do bloco contíguo (sem intervalo) imediatamente ANTES do novo horário.
  let duracaoAntes = 0;
  let alvoAntes = novoInicio;
  for (let i = existentes.length - 1; i >= 0; i--) {
    const ex = existentes[i];
    if (ex.fim === alvoAntes) {
      duracaoAntes += ex.fim - ex.inicio;
      alvoAntes = ex.inicio;
    }
  }

  // Soma a duração do bloco contíguo (sem intervalo) imediatamente DEPOIS do novo horário.
  let duracaoDepois = 0;
  let alvoDepois = novoFim;
  for (let i = 0; i < existentes.length; i++) {
    const ex = existentes[i];
    if (ex.inicio === alvoDepois) {
      duracaoDepois += ex.fim - ex.inicio;
      alvoDepois = ex.fim;
    }
  }

  const duracaoBlocoMin = duracaoAntes + (novoFim - novoInicio) + duracaoDepois;

  if (duracaoBlocoMin > duracaoMaximaSeguidaMin) {
    return {
      violacao: true,
      duracaoBlocoMin,
      mensagem: `Esse horário formaria ${duracaoBlocoMin} minutos seguidos de atendimento sem intervalo. É necessário um descanso de pelo menos ${descansoMinimoMin} minutos a cada ${duracaoMaximaSeguidaMin} minutos seguidos de atendimento.`,
    };
  }

  return { violacao: false };
}

export function paraHHMM(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(
    min % 60
  ).padStart(2, '0')}`;
}

/**
 * Dado o expediente (ex: 08:00-18:00) e os agendamentos do dia, retorna os
 * horários livres em blocos de 1h (o mesmo padrão usado ao clicar num
 * horário livre na agenda), pulando os que violariam a regra do descanso
 * obrigatório (calculada por validarDescansoObrigatorio).
 */
export function calcularHorariosLivres(
  agendamentosDoDia,
  {
    inicioExpediente = '08:00',
    fimExpediente = '18:00',
    passoMinutos = 30,
    duracaoSugestao = 60,
  } = {}
) {
  const livres = [];
  let cursor = paraMinutos(inicioExpediente);
  const fim = paraMinutos(fimExpediente);

  const ocupados = agendamentosDoDia
    .map((a) => [paraMinutos(a.horaInicio), paraMinutos(a.horaFim)])
    .sort((a, b) => a[0] - b[0]);

  while (cursor + duracaoSugestao <= fim) {
    const blocoFim = cursor + duracaoSugestao;
    const ocupado = ocupados.some(([i, f]) => cursor < f && i < blocoFim);
    const candidato = { horaInicio: paraHHMM(cursor), horaFim: paraHHMM(blocoFim) };
    const descanso = validarDescansoObrigatorio(agendamentosDoDia, candidato);

    if (!ocupado && !descanso.violacao) {
      livres.push(candidato);
    }
    cursor += passoMinutos;
  }
  return livres;
}