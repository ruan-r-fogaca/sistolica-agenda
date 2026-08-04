import { useState } from 'react';

export default function AISuggestionPanel({
  aberto,
  onFechar,
  onPedirSugestao,
  onUsarSugestao,
  carregando,
  sugestao,
}) {
  const [descricao, setDescricao] = useState('');

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onFechar}
      />
      <div className="relative w-full max-w-sm h-full bg-ink border-l border-white/10 shadow-2xl px-6 py-6 overflow-y-auto scrollbar-thin">
        <p className="font-mono text-[11px] uppercase tracking-wide text-pulse-400">
          Assistente de agenda · IA
        </p>
        <h2 className="font-display text-lg text-white mt-0.5 mb-4">
          Sugerir melhor horário
        </h2>

        <label className="block text-xs text-white/50 mb-1">
          Descreva o atendimento pedido pelo cliente
        </label>
        <textarea
          rows={4}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="ex: reunião urgente sobre inadimplência de um contrato financeiro"
          className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pulse-500 resize-none"
        />

        <button
          disabled={!descricao.trim() || carregando}
          onClick={() => onPedirSugestao(descricao)}
          className="mt-3 w-full px-4 py-2 text-sm font-medium rounded-md bg-pulse-500 hover:bg-pulse-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          {carregando ? 'Consultando IA...' : 'Pedir sugestão'}
        </button>

        {sugestao && (
          <div className="mt-6 rounded-lg border border-pulse-500/30 bg-pulse-500/10 p-4">
            <p className="text-[11px] font-mono uppercase tracking-wide text-pulse-400 mb-2">
              {sugestao.fonte === 'gemini'
                ? 'Sugestão do Gemini'
                : 'Sugestão heurística (sem chave de IA)'}
            </p>

            {sugestao.horarioSugerido ? (
              <p className="text-white text-sm mb-1">
                Horário:{' '}
                <span className="font-semibold">
                  {sugestao.horarioSugerido.inicio}–{sugestao.horarioSugerido.fim}
                </span>
              </p>
            ) : (
              <p className="text-white/60 text-sm mb-1">
                Nenhum horário livre encontrado neste dia.
              </p>
            )}

            <p className="text-white text-sm mb-2">
              Tipo: <span className="font-semibold">{sugestao.tipoSugerido}</span>
            </p>

            <p className="text-white/50 text-xs leading-relaxed">
              {sugestao.justificativa}
            </p>

            {sugestao.horarioSugerido && (
              <button
                onClick={() =>
                  onUsarSugestao({
                    horaInicio: sugestao.horarioSugerido.inicio,
                    horaFim: sugestao.horarioSugerido.fim,
                    tipo: sugestao.tipoSugerido,
                    descricao,
                  })
                }
                className="mt-3 w-full px-3 py-2 text-xs font-medium rounded-md border border-pulse-400 text-pulse-100 hover:bg-pulse-500/20 transition-colors"
              >
                Usar esta sugestão
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
