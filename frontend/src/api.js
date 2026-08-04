// Em desenvolvimento, o Vite faz proxy de /api para o backend local (veja vite.config.js).
// Em produção (ex: Vercel), defina VITE_API_URL com a URL pública do backend
// (ex: https://sua-api.onrender.com/api).
const BASE = import.meta.env.VITE_API_URL || '/api';

async function tratarResposta(res) {
  const dados = await res.json().catch(() => null);
  if (!res.ok) {
    const erro = new Error(dados?.erro || 'Erro inesperado na API.');
    erro.status = res.status;
    erro.payload = dados;
    throw erro;
  }
  return dados;
}

export async function listarConsultores() {
  const res = await fetch(`${BASE}/consultores`);
  return tratarResposta(res);
}

export async function listarAgendamentos({ consultorId, data } = {}) {
  const params = new URLSearchParams();
  if (consultorId) params.set('consultorId', consultorId);
  if (data) params.set('data', data);
  const res = await fetch(`${BASE}/agenda?${params.toString()}`);
  return tratarResposta(res);
}

export async function criarAgendamento(payload) {
  const res = await fetch(`${BASE}/agenda`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return tratarResposta(res);
}

export async function excluirAgendamento(id) {
  const res = await fetch(`${BASE}/agenda/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    const dados = await res.json().catch(() => null);
    throw new Error(dados?.erro || 'Erro ao excluir agendamento.');
  }
  return true;
}

export async function pedirSugestaoIA(payload) {
  const res = await fetch(`${BASE}/ia/sugestao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return tratarResposta(res);
}
