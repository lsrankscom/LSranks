// pages/api/sync-ils-world-records.js
// Vollständige API-Route zum Scrapen der ILSF-Weltrekorde und Upsert in public.records

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * ENV, Supabase-Client und Token-Check
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Erwarte folgende ENV Variablen in Vercel:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE   (oder alternativ ADMIN_TOKEN – wir unterstützen beides)
 * - ILS_WR_URLS (optional; Standard = https://sport.ilsf.org/records)
 * - SYNC_SECRET  (optional; du kannst stattdessen ?token=... nutzen)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.ADMIN_TOKEN || // Fallback, falls du diesen Namen verwendet hast
  '';

const ILS_URL =
  process.env.ILS_WR_URLS?.trim() || 'https://sport.ilsf.org/records';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.warn('[sync-ils-world-records] Supabase ENV fehlt.');
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function ok(res, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).send(JSON.stringify(payload));
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Hilfsfunktionen
 * ──────────────────────────────────────────────────────────────────────────────
 */

// "01:26.10" oder "1:02,78" → ms (Integer)
function parseTimeToMs(raw) {
  if (!raw) return null;
  const t = String(raw).trim().replace(',', '.'); // Komma in Punkt
  // Fälle: mm:ss.xx   oder  ss.xx
  const parts = t.split(':');
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 1) {
    seconds = parseFloat(parts[0]);
  } else if (parts.length === 2) {
    minutes = parseInt(parts[0], 10) || 0;
    seconds = parseFloat(parts[1]);
  } else {
    return null;
  }
  const ms = Math.round((minutes * 60 + seconds) * 1000);
  return Number.isFinite(ms) ? ms : null;
}

// Event-Text → Disziplin-Code (z. B. "OPEN – 100M OBSTACLE SWIM")
function toDisciplineCode(eventText) {
  if (!eventText) return null;
  let s = eventText
    .replace(/\s+/g, ' ')
    .replace(/[–—-]/g, ' ')
    .trim()
    .toUpperCase();

  // Prefix "OPEN" drauf, um klar vom Altersklassen-Kram getrennt zu sein
  if (!s.startsWith('OPEN')) s = 'OPEN ' + s;

  // raus mit Klammerzusätzen im Code
  s = s.replace(/\(POOL\)/g, '').replace(/\(OPEN\)/g, '').trim();

  // Leerzeichen & Sonderzeichen → Unterstrich
  s = s.replace(/[^A-Z0-9]+/g, '_');
  s = s.replace(/^_+|_+$/g, '');

  return s;
}

// Geschlecht aus Event-Text ableiten
function inferGender(eventText) {
  const t = (eventText || '').toLowerCase();
  if (t.includes('women') || t.includes('female') || t.includes('frau')) return 'W';
  if (t.includes('men') || t.includes('male') || t.includes('männer')) return 'M';
  // Notfalls am Ende aus dem Kopf des Abschnitts lesen – hier default:
  return 'M';
}

// 50m-Pool heuristisch erkennen
function poolLengthFromEvent(eventText) {
  const t = (eventText || '').toLowerCase();
  if (t.includes('(pool)')) return 50;
  if (t.includes('stillwater')) return 50; // ILSF nutzt bei Pool-Rekorden 50m
  // open water / ocean → null
  return null;
}

// Timing-Label (i. d. R. „ET“)
function timingFromContext(eventText) {
  return 'ET';
}

// Datum aus Zelle "City + Date" extrahieren (z. B. "Kaohsiung 23-07-2009")
function extractDate(cellText) {
  if (!cellText) return null;
  const t = String(cellText).trim();
  // Versuche DD-MM-YYYY oder DD/MM/YYYY
  const m = t.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }
  // Fallback: kein Datum gefunden
  return null;
}

// City extrahieren (alles vor dem Datum)
function extractCity(cellText) {
  if (!cellText) return null;
  const t = String(cellText).trim();
  const m = t.match(/^(.*?)[\s-]*\d{2}[./-]\d{2}[./-]\d{4}/);
  if (m && m[1]) return m[1].trim();
  // wenn kein Datum → gib kompletten Text zurück, die Seite ist inkonsistent
  return t;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Scraper: Lädt sport.ilsf.org/records und baut Record-Payloads
 * ──────────────────────────────────────────────────────────────────────────────
 */
async function scrapeIlsfRecords() {
  const resp = await axios.get(ILS_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; LSRanksBot/1.0; +https://lsranks.com)',
      Accept: 'text/html,application/xhtml+xml',
    },
    timeout: 30000,
  });

  const $ = cheerio.load(resp.data);

  // Auf der Seite stehen mehrere Sektionen mit Tabellen (wir sammeln alle)
  const payloads = [];
  $('table').each((_, table) => {
    const $table = $(table);

    // Kopfzeile identifizieren
    const header = [];
    $table.find('thead tr th').each((__, th) => {
      header.push($(th).text().trim().toLowerCase());
    });

    // Fallback, wenn kein thead: erste Zeile als Kopf
    const $rows =
      header.length > 0
        ? $table.find('tbody tr')
        : $table.find('tr').slice(1); // ohne erste Zeile

    $rows.each((__, tr) => {
      const $tds = $(tr).find('td');
      if ($tds.length < 4) return;

      // ILSF: Spalten sind typischerweise:
      // 0: Event, 1: Competitor(+Nation/Team), 2: (Location + Date), 3: Time
      const ev = $tds.eq(0).text().trim();
      const competitor = $tds.eq(1).text().trim().replace(/\s+/g, ' ');
      const placeDate = $tds.eq(2).text().trim().replace(/\s+/g, ' ');
      const timeStr = $tds.eq(3).text().trim();

      // Disziplin & Attribute
      const discipline_code = toDisciplineCode(ev);
      const gender = inferGender(ev);
      const pool_length = poolLengthFromEvent(ev);
      const timing = timingFromContext(ev);

      const athlete_name = competitor || null;
      const meet_name = null; // auf der ILS-Seite nicht als
