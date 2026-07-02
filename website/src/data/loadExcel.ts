// =================================================================
//  שכבת טעינת הנתונים (Data Loading Layer)
//  -----------------------------------------------------------------
//  מודל העבודה: המשתמש מעלה קובץ Excel לאתר, והנתונים מתעדכנים
//  לפיו. בכל העלאה מחדש — הנתונים מתחלפים לחלוטין לפי הקובץ החדש.
//
//  שתי דרכים:
//   1. loadFromMock()         — נתוני דמו (תצוגה ראשונית, עד שמעלים קובץ)
//   2. loadFromArrayBuffer()  — פירוק קובץ ה-Excel שהמשתמש העלה
//
//  שתיהן מחזירות אותו DataSet מנורמל. הקובץ נקרא בלבד — לעולם לא
//  נכתב/משתנה.
// =================================================================

import * as XLSX from "xlsx";
import { DataSet } from "./types";
import { buildMockDataSet } from "./mockData";
import {
  normalizeProperties,
  normalizePlatformCommissions,
  normalizeRooms,
  normalizeOccupation,
  normalizeExtras,
  normalizeMaintenance,
  normalizeExpenses,
  canon,
} from "./normalize";

/** מצב 1 — נתוני דמו */
export function loadFromMock(): DataSet {
  return buildMockDataSet();
}

/**
 * מצב 2 — פירוק חוברת Excel מתוך ArrayBuffer.
 * משמש גם להעלאה ידנית (Upload) וגם לתשובת Backend.
 * כאן מטופלת גם הבעיה ששתי טבלאות יושבות בגיליון Properties
 * (עמודות A-C ו-E-H), על ידי קריאה לפי טווחי עמודות.
 */
export function loadFromArrayBuffer(buffer: ArrayBuffer): DataSet {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });

  // אינדוקס גיליונות בצורה גמישה (case-insensitive, ללא רווחים)
  const sheetByCanon = new Map<string, XLSX.WorkSheet>();
  for (const name of wb.SheetNames) {
    sheetByCanon.set(canon(name), wb.Sheets[name]);
  }
  const getSheet = (...aliases: string[]): XLSX.WorkSheet | null => {
    for (const a of aliases) {
      const ws = sheetByCanon.get(canon(a));
      if (ws) return ws;
    }
    return null;
  };
  const rowsOf = (ws: XLSX.WorkSheet | null): Record<string, unknown>[] =>
    ws ? (XLSX.utils.sheet_to_json(ws, { defval: "", raw: false, dateNF: "yyyy-mm-dd" }) as Record<string, unknown>[]) : [];

  // --- גיליון Properties: שתי טבלאות בתוך אותו גיליון ---
  // טבלה ראשונה: עמודות A-C. טבלה שנייה: עמודות E-H.
  const propsWs = getSheet("Properties");
  let propsRows: Record<string, unknown>[] = [];
  let commRows: Record<string, unknown>[] = [];
  if (propsWs) {
    const ref = propsWs["!ref"] || "A1";
    const range = XLSX.utils.decode_range(ref);
    // טבלה 1 — עמודות A..C
    const r1 = { s: { r: range.s.r, c: 0 }, e: { r: range.e.r, c: 2 } };
    propsRows = XLSX.utils.sheet_to_json(propsWs, {
      range: XLSX.utils.encode_range(r1),
      defval: "",
      raw: false,
    }) as Record<string, unknown>[];
    // טבלה 2 — עמודות E..H (אינדקסים 4..7)
    const r2 = { s: { r: range.s.r, c: 4 }, e: { r: range.e.r, c: 7 } };
    commRows = XLSX.utils.sheet_to_json(propsWs, {
      range: XLSX.utils.encode_range(r2),
      defval: "",
      raw: false,
    }) as Record<string, unknown>[];
  }

  const data: DataSet = {
    properties: normalizeProperties(propsRows),
    platformCommissions: normalizePlatformCommissions(commRows),
    rooms: normalizeRooms(rowsOf(getSheet("Rooms"))),
    occupation: normalizeOccupation(rowsOf(getSheet("occupation", "Occupation"))),
    extras: normalizeExtras(rowsOf(getSheet("Extras"))),
    // טיפול בשגיאת הכתיב Maintence
    maintenance: normalizeMaintenance(rowsOf(getSheet("Maintence", "Maintenance"))),
    expenses: normalizeExpenses(rowsOf(getSheet("Expenses"))),
    profitAndLoss: [],
  };
  return data;
}
/**
 * עזר — קריאת קובץ File (מ-input/גרירה) והמרתו ל-DataSet.
 */
export async function loadFromFileObject(file: File): Promise<DataSet> {
  const buf = await file.arrayBuffer();
  return loadFromArrayBuffer(buf);
}
