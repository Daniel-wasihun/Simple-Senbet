import test from "node:test";
import assert from "node:assert/strict";

/**
 * Model helper verifying print layout contract and metadata rules.
 */
function generatePrintDocumentModel(reportCard) {
  const isIncomplete = reportCard.summary.is_incomplete || reportCard.summary.status === "INCOMPLETE";

  return {
    letterhead: {
      institution: "Simple Senbet Sunday School (የሰንበት ትምህርት ቤት)",
      documentTitle: "Official Student Academic Report Card (የተማሪ የውጤት መግለጫ)",
      academicYear: reportCard.academic_year.name,
      semester: reportCard.semester,
    },
    studentDetails: {
      fullName: reportCard.student.full_name,
      christianName: reportCard.student.christian_name || null,
      className: reportCard.class.name,
      section: reportCard.section,
    },
    marks: {
      coursesCount: reportCard.courses.length,
      overallAverage: reportCard.summary.overall_average,
      status: isIncomplete ? "INCOMPLETE" : reportCard.summary.status,
      sectionRank: isIncomplete ? null : reportCard.summary.section_rank,
      classRank: isIncomplete ? null : reportCard.summary.class_rank,
    },
    printRules: {
      fontFamily: "'Noto Sans Ethiopic', 'Abyssinica SIL', 'Nyala', sans-serif",
      hideScreenControlsSelector: ".no-print",
      pageBreakPolicy: "avoid-inside",
      isOfficialTranscript: !isIncomplete,
      watermarkNotice: isIncomplete
        ? "PROVISIONAL / INCOMPLETE REPORT — NOT AN OFFICIAL FINAL TRANSCRIPT"
        : null,
    },
    signatures: [
      { role: "Class Teacher (የክፍሉ መምህር)", required: true },
      { role: "Academic Director (የትምህርት ክፍል ኃላፊ)", required: true },
    ],
  };
}

test("Printable Report Card — Layout Structure & Policy", async (t) => {
  await t.test("generates complete official transcript layout for completed student", () => {
    const reportCard = {
      student: { id: 1, full_name: "Dawit Wolde", christian_name: "Hailemaryam" },
      academic_year: { id: 1, name: "2018 E.C." },
      class: { id: 1, name: "Grade 9" },
      section: "A",
      semester: "semester_1",
      courses: [{ course_id: 101, percentage: 88.0 }],
      summary: {
        overall_average: 88.0,
        status: "PASS",
        is_incomplete: false,
        section_rank: 1,
        class_rank: 2,
      },
    };

    const doc = generatePrintDocumentModel(reportCard);
    assert.equal(doc.letterhead.institution.includes("Simple Senbet"), true);
    assert.equal(doc.printRules.isOfficialTranscript, true);
    assert.equal(doc.printRules.watermarkNotice, null);
    assert.equal(doc.marks.sectionRank, 1);
    assert.equal(doc.signatures.length, 2);
    assert.equal(doc.printRules.fontFamily.includes("Noto Sans Ethiopic"), true);
  });

  await t.test("provisional incomplete report includes explicit watermark notice and hides final ranks", () => {
    const reportCard = {
      student: { id: 2, full_name: "Sara Daniel", christian_name: null },
      academic_year: { id: 1, name: "2018 E.C." },
      class: { id: 1, name: "Grade 9" },
      section: "B",
      semester: "semester_1",
      courses: [{ course_id: 101, percentage: 40.0 }],
      summary: {
        overall_average: 40.0,
        status: "INCOMPLETE",
        is_incomplete: true,
        section_rank: null,
        class_rank: null,
      },
    };

    const doc = generatePrintDocumentModel(reportCard);
    assert.equal(doc.printRules.isOfficialTranscript, false);
    assert.match(doc.printRules.watermarkNotice, /PROVISIONAL \/ INCOMPLETE/);
    assert.equal(doc.marks.sectionRank, null);
    assert.equal(doc.marks.classRank, null);
  });
});
