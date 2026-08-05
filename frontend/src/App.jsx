import { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import CalendarGrid from './components/CalendarGrid.jsx';
import NewAppointmentModal from './components/NewAppointmentModal.jsx';
import AISuggestionPanel from './components/AISuggestionPanel.jsx';
import Toast from './components/Toast.jsx';
import {
  listarConsultores,
  listarAgendamentos,
  criarAgendamento,
  excluirAgendamento,
  pedirSugestaoIA,
} from './api.js';

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const [consultores, setConsultores] = useState([]);
  const [consultorId, setConsultorId] = useState(null);
  const [data, setData] = useState(hoje());
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregandoAgenda, setCarregandoAgenda] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [valoresIniciaisModal, setValoresIniciaisModal] = useState({});
  const [erroConflito, setErroConflito] = useState(null);

  const [painelIAAberto, setPainelIAAberto] = useState(false);
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [sugestao, setSugestao] = useState(null);

  const [toasts, setToasts] = useState([]);

  function notificar(mensagem, tipo = 'sucesso') {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  useEffect(() => {
    listarConsultores().then((lista) => {
      setConsultores(lista);
      if (lista.length) setConsultorId(lista[0].id);
    });
  }, []);

  const carregarAgenda = useCallback(async () => {
    if (!consultorId) return;
    setCarregandoAgenda(true);
    try {
      const lista = await listarAgendamentos({ consultorId, data });
      setAgendamentos(lista);
    } catch (e) {
      notificar(e.message, 'erro');
    } finally {
      setCarregandoAgenda(false);
    }
  }, [consultorId, data]);

  useEffect(() => {
    carregarAgenda();
  }, [carregarAgenda]);

  const consultorAtual = consultores.find((c) => c.id === consultorId);

  function abrirModalComHorario(horario) {
    setErroConflito(null);
    setValoresIniciaisModal(horario);
    setModalAberto(true);
  }

  async function salvarAgendamento(form) {
    try {
      await criarAgendamento({ consultorId, data, ...form });
      setModalAberto(false);
      setErroConflito(null);
      notificar('Agendamento criado com sucesso.');
      carregarAgenda();
    } catch (e) {
      if (e.status === 409) {
        setErroConflito(e.message);
      } else {
        notificar(e.message, 'erro');
      }
    }
  }

  async function removerAgendamento(id) {
    try {
      await excluirAgendamento(id);
      notificar('Agendamento removido.');
      carregarAgenda();
    } catch (e) {
      notificar(e.message, 'erro');
    }
  }

  async function pedirSugestao(descricao) {
    setCarregandoIA(true);
    setSugestao(null);
    try {
      const resultado = await pedirSugestaoIA({ consultorId, data, descricao });
      setSugestao(resultado);
    } catch (e) {
      notificar(e.message, 'erro');
    } finally {
      setCarregandoIA(false);
    }
  }

  function usarSugestao(campos) {
    setPainelIAAberto(false);
    abrirModalComHorario(campos);
  }

  return (
    <div className="h-screen w-screen flex bg-slate-950">
      <Sidebar
        consultores={consultores}
        consultorSelecionado={consultorId}
        onSelecionarConsultor={setConsultorId}
        data={data}
        onMudarData={setData}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="px-8 py-6 flex items-center justify-between border-b border-white/10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-white/40">
              {data}
            </p>
            <h2 className="font-display text-2xl text-white">
              {consultorAtual ? consultorAtual.nome : 'Carregando...'}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSugestao(null);
                setPainelIAAberto(true);
              }}
              className="px-4 py-2 text-sm font-medium rounded-md border border-pulse-500/50 text-pulse-100 hover:bg-pulse-500/15 transition-colors"
            >
              ✦ Sugestão da IA
            </button>
            <button
              onClick={() =>
                abrirModalComHorario({ horaInicio: '09:00', horaFim: '10:00' })
              }
              className="px-4 py-2 text-sm font-medium rounded-md bg-pulse-500 hover:bg-pulse-600 text-white transition-colors"
            >
              + Novo agendamento
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-6">
          {carregandoAgenda ? (
            <p className="text-white/40 text-sm font-mono">Carregando agenda...</p>
          ) : (
            <CalendarGrid
              agendamentos={agendamentos}
              onSlotLivreClick={abrirModalComHorario}
              onExcluir={removerAgendamento}
            />
          )}
        </div>
      </main>

      <NewAppointmentModal
        aberto={modalAberto}
        onFechar={() => {
          setModalAberto(false);
          setErroConflito(null);
        }}
        onSalvar={salvarAgendamento}
        consultorNome={consultorAtual?.nome || ''}
        data={data}
        valoresIniciais={valoresIniciaisModal}
        erroConflito={erroConflito}
      />

      <AISuggestionPanel
        aberto={painelIAAberto}
        onFechar={() => setPainelIAAberto(false)}
        onPedirSugestao={pedirSugestao}
        onUsarSugestao={usarSugestao}
        carregando={carregandoIA}
        sugestao={sugestao}
      />

      <Toast toasts={toasts} />
    </div>
    
  );
}
