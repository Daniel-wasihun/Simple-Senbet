/**
 * Senbet School Management — Import / Export & Storage Utilities
 * Provides CSV export with UTF-8 BOM (for Excel Ge'ez support), CSV template download,
 * formula injection prevention, CSV parser, and JSON Backup & Restore.
 */

import type { ClassModel, StudentStatus } from "../types/index.ts";

/**
 * Escapes CSV cell value and guards against spreadsheet formula injection (CSV injection).
 */
export function csvEscape(value: unknown): string {
  let v = value === undefined || value === null ? "" : String(value);

  // Spreadsheet formula-injection guard: force cells starting with =, +, -, @, \t to plain text
  if (/^[=@\t\r]/.test(v) || /^[+\-][^0-9\s.]/.test(v)) {
    v = "'" + v;
  }

  if (v.includes(",") || v.includes('"') || v.includes("\n") || v.includes("\r")) {
    v = '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

/**
 * Triggers client-side download of a text/CSV/JSON file with UTF-8 BOM.
 */
export function downloadTextFile(filename: string, content: string, mime: string = "text/csv"): void {
  if (typeof window === "undefined") return;

  // \uFEFF UTF-8 BOM ensures Excel cleanly renders Amharic (Ge'ez) and Afaan Oromoo fonts
  const blob = new Blob(["\uFEFF" + content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Converts headers and row data into a CSV string.
 */
export function toCSV(headers: string[], rows: (string | number | undefined | null)[][]): string {
  const headerLine = headers.map(csvEscape).join(",");
  const dataLines = rows.map((r) => r.map(csvEscape).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Robust CSV string parser handling quotes, multiline values, and comma/tab/semicolon delimiters.
 */
export function parseCSV(text: string): string[][] {
  const cleanText = String(text || "").replace(/^\uFEFF/, "");
  if (!cleanText.trim()) return [];

  const firstLine = cleanText.split(/\r\n|\n|\r/)[0] || "";
  let delim = ",";
  if (!firstLine.includes(",")) {
    if (firstLine.includes("\t")) delim = "\t";
    else if (firstLine.includes(";")) delim = ";";
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    if (inQ) {
      if (ch === '"') {
        if (cleanText[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === delim) {
      row.push(cur.trim());
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && cleanText[i + 1] === "\n") i++;
      row.push(cur.trim());
      cur = "";
      rows.push(row);
      row = [];
    } else {
      cur += ch;
    }
  }

  row.push(cur.trim());
  rows.push(row);

  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

export interface StudentExportItem {
  student_id: string;
  full_name: string;
  baptismal_name?: string;
  gender: string;
  current_class_name?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;
  date_of_birth?: string;
  status: StudentStatus;
}

/**
 * Exports students list to CSV format with Ge'ez UTF-8 BOM.
 */
export function exportStudentsToCSV(students: StudentExportItem[], filenamePrefix: string = "senbet-students"): void {
  const headers = [
    "Student ID",
    "Full Name",
    "Baptismal Name",
    "Gender",
    "Class",
    "Parent Name",
    "Parent Phone",
    "Parent Email",
    "Address",
    "Date of Birth",
    "Status",
  ];

  const rows = students.map((s) => [
    s.student_id,
    s.full_name,
    s.baptismal_name || "",
    s.gender,
    s.current_class_name || "",
    s.parent_name || "",
    s.parent_phone || "",
    s.parent_email || "",
    s.address || "",
    s.date_of_birth || "",
    s.status,
  ]);

  const csvContent = toCSV(headers, rows);
  const dateStr = new Date().toISOString().split("T")[0];
  downloadTextFile(`${filenamePrefix}-${dateStr}.csv`, csvContent);
}

/**
 * Downloads a sample CSV import template for students.
 */
export function downloadStudentCSVTemplate(): void {
  const headers = [
    "Full Name",
    "Baptismal Name",
    "Gender",
    "Class",
    "Parent Name",
    "Parent Phone",
    "Parent Email",
    "Address",
    "Date of Birth",
  ];

  const sampleRows = [
    [
      "ዳዊት ተክለሃይማኖት",
      "ወልደ ገብርኤል",
      "male",
      "Grade 1",
      "ተክለሃይማኖት ወልዴ",
      "+251 91 122 3344",
      "parent1@senbet.org",
      "አዲስ አበባ",
      "2016-04-12",
    ],
    [
      "ማርታ አስረስ",
      "ወለተ ማርያም",
      "female",
      "Grade 2",
      "አስረስ ካሳ",
      "+251 92 333 4455",
      "parent2@senbet.org",
      "አዲስ አበባ",
      "2015-08-20",
    ],
    [
      "Chaltu Tolosa",
      "Wolete Petros",
      "female",
      "Grade 1",
      "Tolosa Bekele",
      "+251 93 444 5566",
      "parent3@senbet.org",
      "Finfinnee",
      "2016-01-15",
    ],
  ];

  downloadTextFile("senbet-student-import-template.csv", toCSV(headers, sampleRows));
}

export interface ParsedImportStudent {
  fullName: string;
  baptismalName?: string;
  gender: "male" | "female";
  classId: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
  dateOfBirth?: string;
}

/**
 * Parses and maps CSV student records, resolving the class name to matching class ID.
 */
export function parseStudentImportCSV(
  csvText: string,
  classes: ClassModel[]
): { success: boolean; students: ParsedImportStudent[]; error?: string } {
  try {
    const rawRows = parseCSV(csvText);
    if (rawRows.length < 2) {
      return { success: false, students: [], error: "No data rows found in CSV." };
    }

    const header = rawRows[0].map((h) => h.toLowerCase().trim());

    // Detect column indexes flexibly
    const findCol = (keywords: string[]): number => {
      return header.findIndex((h) => keywords.some((k) => h.includes(k.toLowerCase())));
    };

    const nameIdx = findCol(["name", "full name", "ስም", "ሙሉ ስም", "maqaa"]);
    const bapIdx = findCol(["baptismal", "christian", "የክርስትና", "kiristinnaa"]);
    const genderIdx = findCol(["gender", "sex", "ጾታ", "saala"]);
    const classIdx = findCol(["class", "grade", "ክፍል", "kutaa"]);
    const parentNameIdx = findCol(["parent name", "guardian", "የወላጅ ስም", "ወላጅ", "maatii"]);
    const parentPhoneIdx = findCol(["phone", "mobile", "tel", "ስልክ", "bilbila"]);
    const parentEmailIdx = findCol(["email", "mail", "ኢሜይል", "imeelii"]);
    const addressIdx = findCol(["address", "residence", "አድራሻ", "መኖሪያ", "teessoo"]);
    const dobIdx = findCol(["birth", "dob", "ልደት", "dhaloota"]);

    if (nameIdx === -1) {
      return {
        success: false,
        students: [],
        error: "Missing required 'Full Name' column.",
      };
    }

    const fallbackClassId = classes[0]?.id || "";
    const results: ParsedImportStudent[] = [];

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      const fullName = row[nameIdx]?.trim();
      if (!fullName) continue;

      const baptismalName = bapIdx !== -1 ? row[bapIdx]?.trim() : undefined;

      // Gender normalization
      let gender: "male" | "female" = "male";
      if (genderIdx !== -1 && row[genderIdx]) {
        const rawG = row[genderIdx].toLowerCase().trim();
        if (
          rawG.includes("f") ||
          rawG.includes("female") ||
          rawG.includes("ሴት") ||
          rawG.includes("dubara")
        ) {
          gender = "female";
        }
      }

      // Class resolution
      let targetClassId = fallbackClassId;
      if (classIdx !== -1 && row[classIdx]) {
        const rawCls = row[classIdx].toLowerCase().trim();
        const matchedClass = classes.find(
          (c) =>
            c.name.toLowerCase() === rawCls ||
            c.name.toLowerCase().includes(rawCls) ||
            rawCls.includes(c.name.toLowerCase())
        );
        if (matchedClass) {
          targetClassId = matchedClass.id;
        }
      }

      results.push({
        fullName,
        baptismalName: baptismalName || undefined,
        gender,
        classId: targetClassId,
        parentName: parentNameIdx !== -1 && row[parentNameIdx] ? row[parentNameIdx].trim() : undefined,
        parentPhone: parentPhoneIdx !== -1 && row[parentPhoneIdx] ? row[parentPhoneIdx].trim() : undefined,
        parentEmail: parentEmailIdx !== -1 && row[parentEmailIdx] ? row[parentEmailIdx].trim() : undefined,
        address: addressIdx !== -1 && row[addressIdx] ? row[addressIdx].trim() : undefined,
        dateOfBirth: dobIdx !== -1 && row[dobIdx] ? row[dobIdx].trim() : undefined,
      });
    }

    return { success: true, students: results };
  } catch (err) {
    return {
      success: false,
      students: [],
      error: err instanceof Error ? err.message : "Failed to parse CSV file.",
    };
  }
}

/**
 * Downloads complete JSON backup of the Senbet School database.
 */
export function exportSchoolBackupJSON(state: Record<string, unknown>): void {
  const payload = {
    app: "senbet-school-management",
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const dateStr = new Date().toISOString().split("T")[0];
  downloadTextFile(`senbet-school-backup-${dateStr}.json`, jsonStr, "application/json");
}

/**
 * Validates and extracts state from an imported JSON backup file.
 */
export function validateAndParseBackupJSON(jsonStr: string): {
  success: boolean;
  state?: Record<string, unknown>;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Invalid JSON format." };
    }

    const state = parsed.state || parsed.data || parsed;
    if (!state.classes || !state.students) {
      return {
        success: false,
        error: "Backup file is missing required Sunday school collections (classes, students).",
      };
    }

    return { success: true, state };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to parse JSON backup file.",
    };
  }
}
