export default function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg border ${
            t.tipo === 'erro'
              ? 'bg-vital-500/95 border-vital-400 text-white'
              : 'bg-pulse-500/95 border-pulse-400 text-white'
          }`}
        >
          {t.mensagem}
        </div>
      ))}
    </div>
  );
}
