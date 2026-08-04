export default function Sidebar({
  consultores,
  consultorSelecionado,
  onSelecionarConsultor,
  data,
  onMudarData,
}) {
  return (
    <aside className="w-72 shrink-0 bg-ink border-r border-white/10 flex flex-col h-full">
      <div className="px-6 py-6 border-b border-white/10">
        <p className="font-mono text-[11px] tracking-[0.2em] text-pulse-400 uppercase">
          Sistólica
        </p>
        <h1 className="font-display text-xl text-white mt-1 leading-tight">
          Agenda de
          <br />
          Consultores
        </h1>
      </div>

      <div className="px-6 py-4 border-b border-white/10">
        <label className="block text-[11px] uppercase tracking-wide text-white/50 font-mono mb-1.5">
          Dia
        </label>
        <input
          type="date"
          value={data}
          onChange={(e) => onMudarData(e.target.value)}
          className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pulse-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <p className="px-3 text-[11px] uppercase tracking-wide text-white/40 font-mono mb-2">
          Consultores
        </p>
        <ul className="space-y-1">
          {consultores.map((c) => {
            const ativo = c.id === consultorSelecionado;
            return (
              <li key={c.id}>
                <button
                  onClick={() => onSelecionarConsultor(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
                    ativo
                      ? 'bg-pulse-500/15 border border-pulse-500/50'
                      : 'border border-transparent hover:bg-white/5'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      ativo ? 'text-pulse-100' : 'text-white/85'
                    }`}
                  >
                    {c.nome}
                  </p>
                  <p className="text-xs text-white/45">{c.especialidade}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="px-6 py-4 border-t border-white/10 text-[11px] text-white/35 font-mono leading-relaxed">
        Dados sincronizados com a
        <br />
        planilha Google Sheets (simulado)
      </div>
    </aside>
  );
}
