import { useEffect, useState } from 'react';

const DURACAO_MAXIMA_MINUTOS = 90; // 1h30

function paraMinutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export default function NewAppointmentModal({
  aberto,
  onFechar,
  onSalvar,
  consultorNome,
  data,
  valoresIniciais,
  erroConflito,
}) {
  const [form, setForm] = useState({
    horaInicio: '09:00',
    horaFim: '10:00',
    cliente: '',
    descricao: '',
    tipo: '',
  });
  const [erroDuracao, setErroDuracao] = useState(null);

  useEffect(() => {
    if (aberto) {
      setForm((prev) => ({ ...prev, ...valoresIniciais }));
      setErroDuracao(null);
    }
  }, [aberto, valoresIniciais]);

  if (!aberto) return null;

  function atualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErroDuracao(null);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-ink border border-white/10 rounded-xl shadow-2xl">
        <div className="px-6 py-5 border-b border-white/10">
          <p className="font-mono text-[11px] uppercase tracking-wide text-pulse-400">
            Novo agendamento
          </p>
          <h2 className="font-display text-lg text-white mt-0.5">
            {consultorNome} · {data}
          </h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (paraMinutos(form.horaFim) - paraMinutos(form.horaInicio) > DURACAO_MAXIMA_MINUTOS) {
              setErroDuracao('O agendamento não pode ultrapassar 1h30 de duração.');
              return;
            }
            onSalvar(form);
          }}
          className="px-6 py-5 space-y-4"
        >
          {erroConflito && (
            <div className="bg-vital-500/15 border border-vital-500/40 text-vital-400 text-sm rounded-md px-3 py-2">
              {erroConflito}
            </div>
          )}

          {erroDuracao && (
            <div className="bg-vital-500/15 border border-vital-500/40 text-vital-400 text-sm rounded-md px-3 py-2">
              {erroDuracao}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Início</label>
              <input
                type="time"
                required
                value={form.horaInicio}
                onChange={(e) => atualizar('horaInicio', e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pulse-500"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Fim</label>
              <input
                type="time"
                required
                value={form.horaFim}
                onChange={(e) => atualizar('horaFim', e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pulse-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Cliente</label>
            <input
              type="text"
              required
              placeholder="Nome do cliente ou empresa"
              value={form.cliente}
              onChange={(e) => atualizar('cliente', e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pulse-500"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">
              Tipo de atendimento
            </label>
            <input
              type="text"
              placeholder="ex: Consultoria financeira"
              value={form.tipo}
              onChange={(e) => atualizar('tipo', e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pulse-500"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Descrição</label>
            <textarea
              rows={3}
              placeholder="Detalhes do atendimento..."
              value={form.descricao}
              onChange={(e) => atualizar('descricao', e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pulse-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 text-sm text-white/60 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-md bg-pulse-500 hover:bg-pulse-600 text-white transition-colors"
            >
              Salvar agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}