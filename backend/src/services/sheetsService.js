/**
 * sheetsService.js
 * ------------------------------------------------------------------
 * INTEGRAÇÃO SIMULADA COM GOOGLE SHEETS
 * ------------------------------------------------------------------
 * Este serviço se comporta como se fosse a "planilha" de agendas:
 * lê e grava dados em src/data/db.json, mas a API exposta aos routers
 * (getConsultores, getAgendamentos, addAgendamento, deleteAgendamento)
 * é exatamente a que uma integração real usaria. Isso significa que
 * trocar o mock pela integração real do Google Sheets não exige mudar
 * nenhuma rota nem o frontend — só o conteúdo deste arquivo.
 *
 * COMO LIGAR A INTEGRAÇÃO REAL (Google Sheets API):
 *   1. Crie um projeto no Google Cloud e ative a "Google Sheets API".
 *   2. Crie uma Service Account e gere uma chave JSON.
 *   3. Compartilhe a planilha do Google Sheets com o e-mail da service
 *      account (ela precisa ter permissão de Editor).
 *   4. `npm install googleapis` no backend.
 *   5. Substitua as funções abaixo por chamadas como:
 *
 *      import { google } from 'googleapis';
 *      const auth = new google.auth.GoogleAuth({
 *        keyFile: 'credenciais.json',
 *        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
 *      });
 *      const sheets = google.sheets({ version: 'v4', auth });
 *
 *      // Leitura:
 *      const res = await sheets.spreadsheets.values.get({
 *        spreadsheetId: process.env.SHEET_ID,
 *        range: 'Agendamentos!A2:H',
 *      });
 *
 *      // Escrita:
 *      await sheets.spreadsheets.values.append({
 *        spreadsheetId: process.env.SHEET_ID,
 *        range: 'Agendamentos!A2',
 *        valueInputOption: 'USER_ENTERED',
 *        requestBody: { values: [[...linha]] },
 *      });
 * ------------------------------------------------------------------
 */

import { readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

async function readDb() {
  const raw = await readFile(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function writeDb(db) {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function getConsultores() {
  const db = await readDb();
  return db.consultores;
}

export async function getAgendamentos({ consultorId, data } = {}) {
  const db = await readDb();
  return db.agendamentos.filter((ag) => {
    if (consultorId && ag.consultorId !== consultorId) return false;
    if (data && ag.data !== data) return false;
    return true;
  });
}

export async function addAgendamento(novoAgendamento) {
  const db = await readDb();
  const registro = { id: randomUUID(), ...novoAgendamento };
  db.agendamentos.push(registro);
  await writeDb(db);
  return registro;
}

export async function deleteAgendamento(id) {
  const db = await readDb();
  const antes = db.agendamentos.length;
  db.agendamentos = db.agendamentos.filter((ag) => ag.id !== id);
  await writeDb(db);
  return db.agendamentos.length < antes;
}
