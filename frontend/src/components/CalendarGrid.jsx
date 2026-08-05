const INICIO_EXPEDIENTE = 8 * 60; // 08:00
const FIM_EXPEDIENTE = 18 * 60; // 18:00
const PASSO = 30; // minutos

function paraMinutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function paraHHMM(min) {
  const h = String(Math.floor(min / 60)).padStart(2, '0');
  const m = String(min % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function gerarSlots() {
  const slots = [];
  for (let m = INICIO_EXPEDIENTE; m < FIM_EXPEDIENTE; m += PASSO) {
    slots.push({ inicio: m, fim: m + PASSO });
  }
  return slots;
}

export default function CalendarGrid({ agendamentos, onSlotLivreClick, onExcluir }) {
  const slots = gerarSlots();

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-ink/60">
      {slots.map((slot) => {
        const ocupante = agendamentos.find(
          (ag) =>
            paraMinutos(ag.horaInicio) < slot.fim &&
            paraMinutos(ag.horaFim) > slot.inicio
        );

        const candidatoFim = Math.min(slot.inicio + 60, FIM_EXPEDIENTE);
        const ocupado = !!ocupante;
        const livre = !ocupado;

        return (
          <div
            key={slot.inicio}
            className={`flex items-stretch border-b border-white/5 last:border-b-0 ${
              livre ? 'group cursor-pointer hover:bg-pulse-500/10' : ''
            }`}
            onClick={() => {
              if (livre) {
                onSlotLivreClick({
                  horaInicio: paraHHMM(slot.inicio),
                  horaFim: paraHHMM(candidatoFim),
                });
              }
            }}
          >
            <div
              className={`w-16 shrink-0 py-2.5 pl-4 font-mono text-[11px] ${
                ocupado ? 'text-red-300' : 'text-white/35'
              }`}
            >
              {paraHHMM(slot.inicio)}
            </div>

            {ocupado ? (
              <div className="flex-1 my-0.5 mr-3 px-3 py-2 bg-red-500/20 border-l-4 border-red-500/70 rounded-md flex items-center justify-between">
                <span className="text-xs text-red-200 font-mono tracking-wide">
                  Horário já agendado
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExcluir(ocupante.id);
                  }}
                  className="text-white/40 hover:text-red-300 text-xs font-mono shrink-0"
                  title="Cancelar agendamento"
                >
                  remover
                </button>
              </div>
            ) : (
              <div className="flex-1 my-0.5 mr-3 px-3 py-2 flex items-center">
                <span className="text-xs text-pulse-400/0 group-hover:text-pulse-400 transition-colors font-mono">
                  + agendar às {paraHHMM(slot.inicio)}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}