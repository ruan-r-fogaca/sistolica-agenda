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
      {slots.map((slot, idx) => {
        const ocupante = agendamentos.find(
          (ag) =>
            paraMinutos(ag.horaInicio) < slot.fim &&
            paraMinutos(ag.horaFim) > slot.inicio
        );

        const slotAnterior = idx > 0 ? slots[idx - 1] : null;
        const ocupanteAnterior = slotAnterior
          ? agendamentos.find(
              (ag) =>
                paraMinutos(ag.horaInicio) < slotAnterior.fim &&
                paraMinutos(ag.horaFim) > slotAnterior.inicio
            )
          : null;

        const continuaMesmoBloco =
          ocupante && ocupanteAnterior && ocupante.id === ocupanteAnterior.id;

        const primeiraLinhaDoBloco = ocupante && !continuaMesmoBloco;

        return (
          <div
            key={slot.inicio}
            className={`flex items-stretch border-b border-white/5 last:border-b-0 ${
              !ocupante ? 'group cursor-pointer hover:bg-pulse-500/10' : ''
            }`}
            onClick={() => {
              if (!ocupante) {
                onSlotLivreClick({
                  horaInicio: paraHHMM(slot.inicio),
                  horaFim: paraHHMM(slot.fim),
                });
              }
            }}
          >
            <div className="w-16 shrink-0 py-2.5 pl-4 font-mono text-[11px] text-white/35">
              {paraHHMM(slot.inicio)}
            </div>

            {ocupante ? (
              <div
                className={`flex-1 my-0.5 mr-3 px-3 py-2 bg-vital-500/15 border-l-4 border-vital-500 ${
                  primeiraLinhaDoBloco ? 'rounded-t-md mt-2' : ''
                }`}
              >
                {primeiraLinhaDoBloco && (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {ocupante.cliente}
                      </p>
                      <p className="text-xs text-white/60">
                        {ocupante.tipo} · {ocupante.horaInicio}–{ocupante.horaFim}
                      </p>
                      {ocupante.descricao && (
                        <p className="text-xs text-white/40 mt-0.5">
                          {ocupante.descricao}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExcluir(ocupante.id);
                      }}
                      className="text-white/40 hover:text-vital-400 text-xs font-mono shrink-0"
                      title="Cancelar agendamento"
                    >
                      remover
                    </button>
                  </div>
                )}
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
