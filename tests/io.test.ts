import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  csvEscape,
  toCSV,
  parseCSV,
  parseStudentImportCSV,
  validateAndParseBackupJSON,
} from "../src/lib/io.ts";

describe("CSV Escaping and Formula Injection Guard", () => {
  test("escapes quotes and wraps comma-containing values", () => {
    assert.equal(csvEscape('Hello, "World"'), '"Hello, ""World"""');
  });

  test("guards against formula injection attacks (=, +, -, @, tab)", () => {
    assert.equal(csvEscape("=SUM(A1:A10)"), "'=SUM(A1:A10)");
    assert.equal(csvEscape("@evil"), "'@evil");
    assert.equal(csvEscape("\tcommand"), "'\tcommand");
    assert.equal(csvEscape("+cmd"), "'+cmd");
    assert.equal(csvEscape("-attack"), "'-attack");
    // Normal negative or positive numbers are not mangled
    assert.equal(csvEscape("-5"), "-5");
    assert.equal(csvEscape("+10"), "+10");
  });

  test("handles undefined and null gracefully", () => {
    assert.equal(csvEscape(undefined), "");
    assert.equal(csvEscape(null), "");
  });
});

describe("CSV String Generator and Parser", () => {
  test("generates and parses standard CSV correctly", () => {
    const headers = ["Name", "Role", "Parish"];
    const rows = [
      ["Abebe", "Teacher", "St. George"],
      ["Marta", "Student", "Bata Maryam"],
    ];
    const csv = toCSV(headers, rows);
    const parsed = parseCSV(csv);

    assert.equal(parsed.length, 3);
    assert.deepEqual(parsed[0], headers);
    assert.deepEqual(parsed[1], rows[0]);
    assert.deepEqual(parsed[2], rows[1]);
  });

  test("handles quotes and multiline values", () => {
    const raw = '"Full Name","Notes"\r\n"Yohannes","Line 1\nLine 2"';
    const parsed = parseCSV(raw);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[1][0], "Yohannes");
    assert.equal(parsed[1][1], "Line 1\nLine 2");
  });
});

describe("Student CSV Import Mapping", () => {
  const dummyClasses = [
    { id: "cls-1", school_id: "sch-1", name: "Grade 1", created_at: "" },
    { id: "cls-2", school_id: "sch-1", name: "Grade 2", created_at: "" },
  ];

  test("maps English headers and normalizes gender", () => {
    const csv =
      "Full Name,Christian Name,Gender,Class,Phone\n" +
      "Dawit Haile,Wolde Gabriel,male,Grade 1,+251911000000\n" +
      "Sara Bekele,Wolete Maryam,female,Grade 2,+251922000000";

    const result = parseStudentImportCSV(csv, dummyClasses);
    assert.equal(result.success, true);
    assert.equal(result.students.length, 2);
    assert.equal(result.students[0].fullName, "Dawit Haile");
    assert.equal(result.students[0].baptismalName, "Wolde Gabriel");
    assert.equal(result.students[0].gender, "male");
    assert.equal(result.students[0].classId, "cls-1");
    assert.equal(result.students[1].gender, "female");
    assert.equal(result.students[1].classId, "cls-2");
  });

  test("maps Amharic headers and normalizes Ge'ez gender", () => {
    const csv =
      "ሙሉ ስም,የክርስትና ስም,ጾታ,ክፍል,ስልክ\n" +
      "ዮሐንስ ተስፋዬ,ወልደ ጊዮርጊስ,ወንድ,Grade 1,+251911223344\n" +
      "ማርታ አስረስ,ወለተ ጴጥሮስ,ሴት,Grade 2,+251933445566";

    const result = parseStudentImportCSV(csv, dummyClasses);
    assert.equal(result.success, true);
    assert.equal(result.students.length, 2);
    assert.equal(result.students[0].fullName, "ዮሐንስ ተስፋዬ");
    assert.equal(result.students[0].gender, "male");
    assert.equal(result.students[1].gender, "female");
  });

  test("rejects CSV without Name column", () => {
    const csv = "Phone,Age\n+251911000000,12";
    const result = parseStudentImportCSV(csv, dummyClasses);
    assert.equal(result.success, false);
    assert.match(result.error || "", /Full Name/i);
  });
});

describe("JSON Backup Validation", () => {
  test("accepts valid backup payload", () => {
    const valid = JSON.stringify({
      app: "senbet-school-management",
      version: 1,
      state: {
        classes: [{ id: "c1" }],
        students: [{ id: "s1" }],
      },
    });

    const res = validateAndParseBackupJSON(valid);
    assert.equal(res.success, true);
    assert.ok(res.state);
  });

  test("rejects malformed or incomplete backup payload", () => {
    const invalidJson = "{ bad json ";
    assert.equal(validateAndParseBackupJSON(invalidJson).success, false);

    const missingCollections = JSON.stringify({ app: "test", state: { other: 1 } });
    const res = validateAndParseBackupJSON(missingCollections);
    assert.equal(res.success, false);
    assert.match(res.error || "", /missing required/i);
  });
});
