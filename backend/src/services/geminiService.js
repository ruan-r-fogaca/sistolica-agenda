/**
 * geminiService.js
 * ------------------------------------------------------------------
 * Requisito obrigatório: "Inteligência Artificial".
 * Usa o pacote @google/genai (API do Gemini) para analisar a agenda
 * de um consultor e a descrição de um novo atendimento, sugerindo o
 * melhor horário livre e classificando o tipo de atendimento.
 *
 * Se GEMINI_API_KEY não estiver configurada, cai em um fallback
 * heurístico simples (primeiro horário livre + classificação por
 * palavra-chave), para que o app nunca quebre em demonstração.
 * ------------------------------------------------------------------
 */

import { GoogleGenAI } from '@google/genai';
import { calcularHorariosLivres } from './conflictService.js';

const apiKey = process.env.GEMINI_API_KEY;
const modelo = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let client = null;
if (apiKey && apiKey !== 'coloque_sua_chave_aqui') {
  client = new GoogleGenAI({ apiKey });
}

function fallbackHeuristico(agendamentosDoDia, descricao) {
  const livres = calcularHorariosLivres(agendamentosDoDia);
  const melhor = livres[0] || null;

  const palavraChave = descricao.toLowerCase();
  let tipo = 'Atendimento geral';
  if (palavraChave.includes('financ')) tipo = 'Consultoria financeira';
  else if (palavraChave.includes('revis')) tipo = 'Reunião de revisão';
  else if (palavraChave.includes('apresent')) tipo = 'Apresentação';
  else if (palavraChave.includes('urgente') || palavraChave.includes('emergênc'))
    tipo = 'Atendimento urgente';

  return {
    fonte: 'heuristica',
    horarioSugerido: melhor,
    tipoSugerido: tipo,
    justificativa: melhor
      ? `Chave da IA não configurada: sugestão heurística usando o primeiro horário livre do dia (${melhor.inicio}–${melhor.fim}).`
      : 'Chave da IA não configurada e não há horários livres neste dia.',
  };
}

/**
 * @param {object} params
 * @param {Array} params.agendamentosDoDia - agendamentos existentes do consultor no dia
 * @param {string} params.descricao - descrição livre do novo atendimento
 * @param {string} params.nomeConsultor
 * @param {string} params.data - data no formato YYYY-MM-DD
 */
export async function sugerirHorario({
  agendamentosDoDia,
  descricao,
  nomeConsultor,
  data,
}) {
  if (!client) {
    return fallbackHeuristico(agendamentosDoDia, descricao);
  }

  const livres = calcularHorariosLivres(agendamentosDoDia);

  const prompt = `Você é um assistente de agendamento para consultores de uma empresa chamada Sistólica.

Consultor: ${nomeConsultor}
Data: ${data}
Agendamentos já existentes nesse dia: ${JSON.stringify(agendamentosDoDia)}
Horários livres disponíveis (blocos de 30 min, expediente 08:00-18:00): ${JSON.stringify(livres)}
Descrição do novo atendimento pedido pelo cliente: "${descricao}"

Tarefa:
1. Escolha o melhor horário livre da lista para esse atendimento (considere duração provável e o restante da agenda do dia).
2. Classifique o tipo de atendimento em uma categoria curta (ex: "Consultoria financeira", "Reunião de revisão", "Apresentação", "Atendimento urgente", "Atendimento geral").
3. Justifique brevemente (1 frase, em português).

Responda SOMENTE com um JSON válido, sem markdown, no formato:
{"horarioSugerido": {"inicio": "HH:MM", "fim": "HH:MM"}, "tipoSugerido": "string", "justificativa": "string"}`;

  try {
    const resposta = await client.models.generateContent({
      model: modelo,
      contents: prompt,
    });

    const texto = resposta.text ?? '';
    const limpo = texto.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(limpo);

    return {
      fonte: 'gemini',
      horarioSugerido: parsed.horarioSugerido,
      tipoSugerido: parsed.tipoSugerido,
      justificativa: parsed.justificativa,
    };
  } catch (erro) {
    console.error('Falha ao consultar Gemini, usando fallback:', erro.message);
    return fallbackHeuristico(agendamentosDoDia, descricao);
  }
}
