/**
 * sheetsService.js
 * ------------------------------------------------------------------
 * INTEGRAÇÃO COM GOOGLE SHEETS (real, com fallback simulado)
 * ------------------------------------------------------------------
 * Se as variáveis de ambiente GOOGLE_SHEET_ID e GOOGLE_SERVICE_ACCOUNT_B64
 * estiverem configuradas, este serviço lê e grava diretamente numa
 * planilha real do Google Sheets. Caso contrário, cai automaticamente
 * no modo simulado (lê/grava em src/data/db.json), para que o app nunca
 * quebre em desenvolvimento ou demonstração sem credenciais.
 *
 * ESTRUTURA ESPERADA DA PLANILHA (duas abas):
 *
 *   Aba "Consultores"     colunas: id | nome | especialidade
 *   Aba "Agendamentos"    colunas: id | consultorId | data | horaInicio | horaFim | cliente | descricao | tipo
 *
 * A primeira linha de cada aba deve ser o cabeçalho (será ignorada na leitura).
 *
 * COMO CONFIGURAR (veja o passo a passo completo no README.md):
 *   1. Criar a planilha no Google Sheets com as duas abas acima.
 *   2. Criar uma Service Account no Google Cloud e baixar a chave JSON.
 *   3. Compartilhar a planilha com o e-mail da service account (permissão de Editor).
 *   4. Codificar o conteúdo do JSON da chave em base64 e colocar em
 *      GOOGLE_SERVICE_ACCOUNT_B64 no .env.
 *   5. Colocar o ID da planilha (está na URL) em GOOGLE_SHEET_ID no .env.
 * ------------------------------------------------------------------
 */

import { readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CREDS_B64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
const MODO_REAL = Boolean(SHEET_ID && CREDS_B64);

const ABA_CONSULTORES = 'Consultores';
const ABA_AGENDAMENTOS = 'Agendamentos';

let sheetsClientPromise = null;
let sheetIdNumericoCache = null;

async function getSheetsClient() {
  if (!sheetsClientPromise) {
    sheetsClientPromise = (async () => {
      const credenciais = JSON.parse(
        Buffer.from(CREDS_B64, 'base64').toString('utf-8')
      );
      const auth = new google.auth.GoogleAuth({
        credentials: credenciais,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      return google.sheets({ version: 'v4', auth });
    })();
  }
  return sheetsClientPromise;
}

// Descobre o ID numérico interno da aba "Agendamentos" (necessário para excluir linhas)
async function getSheetIdNumerico(sheets) {
  if (sheetIdNumericoCache !== null) return sheetIdNumericoCache;
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const aba = meta.data.sheets.find(
    (s) => s.properties.title === ABA_AGENDAMENTOS
  );
  sheetIdNumericoCache = aba.properties.sheetId;
  return sheetIdNumericoCache;
}

// -------------------- MODO SIMULADO (db.json) --------------------

async function readDb() {
  const raw = await readFile(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function writeDb(db) {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// -------------------- FUNÇÕES PÚBLICAS --------------------

export async function getConsultores() {
  if (!MODO_REAL) {
    const db = await readDb();
    return db.consultores;
  }
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${ABA_CONSULTORES}!A2:C`,
  });
  const linhas = res.data.values || [];
  return linhas
    .filter((l) => l[0])
    .map(([id, nome, especialidade]) => ({ id, nome, especialidade }));
}

export async function getAgendamentos({ consultorId, data } = {}) {
  if (!MODO_REAL) {
    const db = await readDb();
    return db.agendamentos.filter((ag) => {
      if (consultorId && ag.consultorId !== consultorId) return false;
      if (data && ag.data !== data) return false;
      return true;
    });
  }

  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${ABA_AGENDAMENTOS}!A2:H`,
  });
  const linhas = res.data.values || [];
  const todos = linhas
    .filter((l) => l[0])
    .map(([id, cId, dt, horaInicio, horaFim, cliente, descricao, tipo]) => ({
      id,
      consultorId: cId,
      data: dt,
      horaInicio,
      horaFim,
      cliente,
      descricao,
      tipo,
    }));

  return todos.filter((ag) => {
    if (consultorId && ag.consultorId !== consultorId) return false;
    if (data && ag.data !== data) return false;
    return true;
  });
}

export async function addAgendamento(novoAgendamento) {
  const registro = { id: randomUUID(), ...novoAgendamento };

  if (!MODO_REAL) {
    const db = await readDb();
    db.agendamentos.push(registro);
    await writeDb(db);
    return registro;
  }

  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${ABA_AGENDAMENTOS}!A2`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          registro.id,
          registro.consultorId,
          registro.data,
          registro.horaInicio,
          registro.horaFim,
          registro.cliente,
          registro.descricao || '',
          registro.tipo || '',
        ],
      ],
    },
  });

  return registro;
}

export async function deleteAgendamento(id) {
  if (!MODO_REAL) {
    const db = await readDb();
    const antes = db.agendamentos.length;
    db.agendamentos = db.agendamentos.filter((ag) => ag.id !== id);
    await writeDb(db);
    return db.agendamentos.length < antes;
  }

  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${ABA_AGENDAMENTOS}!A2:A`,
  });
  const linhas = res.data.values || [];
  const indice = linhas.findIndex((l) => l[0] === id);
  if (indice === -1) return false;

  const sheetIdNumerico = await getSheetIdNumerico(sheets);
  const linhaReal = indice + 1; // +1 porque a leitura começou em A2 (índice 0 = linha 2)

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetIdNumerico,
              dimension: 'ROWS',
              startIndex: linhaReal, // linha 2 = índice 1 (0-based, cabeçalho é a 0)
              endIndex: linhaReal + 1,
            },
          },
        },
      ],
    },
  });

  return true;
}

export const integracaoReal = MODO_REAL;
