# Agenda Sistólica — MVP de agenda inteligente para consultores

Sistema interno de controle de agendas com **gestão de conflitos de horário**,
**visualização em tempo real** dos horários livres/ocupados, **integração
(simulada) com Google Sheets** e uma **sugestão inteligente de horários via
Gemini API**.

Feito para o desafio prático de Desenvolvedor Júnior / Analista de Automação.

---

## Estrutura do projeto

```
sistolica-agenda/
├── backend/          # API REST em Node.js + Express
│   ├── server.js
│   ├── .env.example
│   └── src/
│       ├── data/db.json          # "planilha" simulada (Google Sheets)
│       ├── services/
│       │   ├── sheetsService.js  # integração com dados (mock, plugável)
│       │   ├── conflictService.js# lógica de conflito de horários
│       │   └── geminiService.js  # integração com a IA (Gemini)
│       └── routes/
│           ├── consultores.js
│           ├── agenda.js
│           └── ia.js
└── frontend/         # React + Vite + TailwindCSS
    └── src/
        ├── App.jsx
        ├── api.js
        └── components/
```

## Como as regras obrigatórias foram atendidas

| Regra | Onde está |
|---|---|
| **Gestão de Conflitos** | `backend/src/services/conflictService.js` — verifica sobreposição de horário do mesmo consultor antes de salvar (`POST /api/agenda` retorna `409` em caso de conflito). |
| **Organização Visual** | `frontend/src/components/CalendarGrid.jsx` — grade do dia (08h–18h) com horários livres (clicáveis) e ocupados (destacados), atualizada em tempo real após cada ação. |
| **Integração de Dados** | `backend/src/services/sheetsService.js` — simula a leitura/gravação de uma planilha Google Sheets. A assinatura das funções já é a mesma que a integração real usaria; o topo do arquivo explica passo a passo como plugar a API real do Google Sheets. |
| **Inteligência Artificial** | `backend/src/services/geminiService.js` — usa o pacote `@google/genai` para, a partir da agenda do dia e da descrição do atendimento, sugerir o melhor horário livre e classificar o tipo de atendimento. Se não houver `GEMINI_API_KEY`, cai automaticamente em um modo heurístico (não quebra a demo). |

---

## Rodando localmente

Pré-requisitos: **Node.js 18+** instalado.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Abra o `.env` e, se quiser a IA funcionando de verdade, cole sua chave do Gemini
em `GEMINI_API_KEY` (veja como pegar a chave logo abaixo). Sem chave, o app
funciona normalmente, só que com sugestão heurística em vez de IA real.

```bash
npm run dev
```

A API sobe em `http://localhost:4000`. Teste com `http://localhost:4000/api/health`.

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. O Vite já faz proxy de `/api` para o backend
local (configurado em `vite.config.js`), então não precisa configurar nada a mais.

### Como pegar uma chave do Gemini (gratuita)

1. Acesse [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Faça login com uma conta Google e clique em **Create API key**.
3. Copie a chave gerada e cole em `backend/.env`, na variável `GEMINI_API_KEY`.

---

## Integração real com Google Sheets

Por padrão o app roda no modo simulado (grava em `backend/src/data/db.json`).
Para ligar a integração real:

### 1. Criar a planilha

1. Crie uma planilha nova em [sheets.google.com](https://sheets.google.com).
2. Renomeie a primeira aba para `Consultores` e, na primeira linha, coloque
   os cabeçalhos: `id | nome | especialidade`.
3. Crie uma segunda aba chamada `Agendamentos` com os cabeçalhos:
   `id | consultorId | data | horaInicio | horaFim | cliente | descricao | tipo`.
4. Copie o ID da planilha: é o trecho da URL entre `/d/` e `/edit`, por
   exemplo em `https://docs.google.com/spreadsheets/d/AAAA1234BBBB/edit`
   o ID é `AAAA1234BBBB`.

### 2. Criar a Service Account no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com) e
   crie um projeto novo (ou use um existente).
2. No menu, vá em **APIs e serviços → Biblioteca**, procure **Google Sheets
   API** e clique em **Ativar**.
3. Vá em **APIs e serviços → Credenciais → Criar credenciais → Conta de
   serviço**. Dê um nome qualquer e conclua a criação.
4. Clique na conta de serviço criada → aba **Chaves** → **Adicionar chave →
   Criar nova chave → JSON**. Isso baixa um arquivo `.json` no seu
   computador — guarde-o, ele é a credencial.
5. Copie o e-mail da conta de serviço (algo como
   `nome@projeto.iam.gserviceaccount.com`, aparece na tela de detalhes).

### 3. Compartilhar a planilha com a Service Account

Na planilha do passo 1, clique em **Compartilhar** e cole o e-mail da conta
de serviço (do passo anterior), dando permissão de **Editor**.

### 4. Converter a chave para base64 e configurar o `.env`

No PowerShell (Windows), dentro da pasta onde está o arquivo `.json` baixado:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("nome-do-arquivo.json")) | Set-Clipboard
```

Isso copia o valor para a área de transferência. Cole no `backend/.env`:

```
GOOGLE_SHEET_ID=AAAA1234BBBB
GOOGLE_SERVICE_ACCOUNT_B64=(cole aqui o texto copiado)
```

Reinicie o backend (`Ctrl+C` e `npm run dev` de novo). Se der certo, ao
acessar `http://localhost:4000/api/health` o campo `googleSheets` deve
aparecer como `"integração real"` em vez de `"simulado"`.

Para o deploy (Render), adicione essas duas mesmas variáveis em
**Environment Variables** do serviço, com os mesmos valores.

---

## Deploy

O frontend (Vite/React) é 100% estático e sobe direto no **Vercel**. O
backend é um servidor Express tradicional, então recomendamos publicá-lo em
um serviço de hospedagem de Node (ex: **Render**, gratuito), e apontar o
frontend para essa URL.

### Backend → Render (ou similar)

1. Suba o repositório no GitHub (veja seção abaixo).
2. No [render.com](https://render.com), crie um **Web Service** apontando
   para a pasta `backend/` do repositório.
   - Build command: `npm install`
   - Start command: `npm start`
3. Em **Environment**, adicione a variável `GEMINI_API_KEY` com sua chave.
4. Copie a URL pública gerada (ex: `https://sistolica-agenda.onrender.com`).

### Frontend → Vercel

1. No [vercel.com](https://vercel.com), importe o mesmo repositório e
   configure o **Root Directory** como `frontend`.
2. Em **Environment Variables**, adicione:
   `VITE_API_URL = https://sistolica-agenda.onrender.com/api`
   (troque pela URL do seu backend, do passo anterior).
3. Deploy. Pronto — o link público do Vercel é o que deve ser enviado.

---

## Subindo para o GitHub

```bash
cd sistolica-agenda
git init
git add .
git commit -m "MVP agenda inteligente - desafio Sistólica"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git push -u origin main
```

Se o repositório for privado, lembre-se de liberar acesso para quem for
avaliar o desafio.

---

## Principais endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/consultores` | Lista os consultores |
| GET | `/api/agenda?consultorId=&data=` | Lista agendamentos de um consultor/dia |
| GET | `/api/agenda/livres?consultorId=&data=` | Lista horários livres do dia |
| POST | `/api/agenda` | Cria agendamento (bloqueia conflito com `409`) |
| DELETE | `/api/agenda/:id` | Remove um agendamento |
| POST | `/api/ia/sugestao` | Pede à IA o melhor horário + tipo de atendimento |

---

## Próximos passos (fora do escopo do MVP)

- Trocar `sheetsService.js` pela integração real com Google Sheets API.
- Autenticação/login por consultor.
- Edição de agendamentos existentes (hoje só cria e remove).
- Testes automatizados (Jest/Vitest) para `conflictService.js`.
