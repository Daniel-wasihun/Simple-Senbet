import type { SupportedLanguage } from "./translations.ts";
import type { AttendanceStatus, UserRole, StudentStatus, AssessmentType } from "../types/index.ts";

export const DOMAIN_CLASSES: Record<string, Record<SupportedLanguage, string>> = {
  preschool: {
    en: "Preschool",
    am: "ቅድመ መደበኛ",
    or: "Barnoota Duraa",
  },
  "grade 1": {
    en: "Grade 1",
    am: "1ኛ ክፍል",
    or: "Kutaa 1ffaa",
  },
  "grade 2": {
    en: "Grade 2",
    am: "2ኛ ክፍል",
    or: "Kutaa 2ffaa",
  },
  "grade 3": {
    en: "Grade 3",
    am: "3ኛ ክፍል",
    or: "Kutaa 3ffaa",
  },
  "grade 4": {
    en: "Grade 4",
    am: "4ኛ ክፍል",
    or: "Kutaa 4ffaa",
  },
  "grade 5": {
    en: "Grade 5",
    am: "5ኛ ክፍል",
    or: "Kutaa 5ffaa",
  },
  "grade 6": {
    en: "Grade 6",
    am: "6ኛ ክፍል",
    or: "Kutaa 6ffaa",
  },
  "grade 7": {
    en: "Grade 7",
    am: "7ኛ ክፍል",
    or: "Kutaa 7ffaa",
  },
  "grade 8": {
    en: "Grade 8",
    am: "8ኛ ክፍል",
    or: "Kutaa 8ffaa",
  },
  "grade 9": {
    en: "Grade 9",
    am: "9ኛ ክፍል",
    or: "Kutaa 9ffaa",
  },
  "grade 10": {
    en: "Grade 10",
    am: "10ኛ ክፍል",
    or: "Kutaa 10ffaa",
  },
  "grade 11": {
    en: "Grade 11",
    am: "11ኛ ክፍል",
    or: "Kutaa 11ffaa",
  },
  "grade 12": {
    en: "Grade 12",
    am: "12ኛ ክፍል",
    or: "Kutaa 12ffaa",
  },
  youth: {
    en: "Youth Fellowship",
    am: "ወጣቶች",
    or: "Dargaggoota",
  },
  adults: {
    en: "Adult Fellowship",
    am: "ማህበራትና አበው",
    or: "Maahibaraa fi Maanguddoota",
  },
};

export const DOMAIN_COURSES: Record<string, Record<SupportedLanguage, string>> = {
  "bible study": {
    en: "Bible Study",
    am: "መጽሐፍ ቅዱስ ጥናት",
    or: "Qo'annoo Kitaaba Qulqulluu",
  },
  mezmur: {
    en: "Mezmur & Zema",
    am: "ዝማሬና ዜማ",
    or: "Faarfannaa fi Zemaa",
  },
  "church history": {
    en: "Church History",
    am: "የቤተክርስቲያን ታሪክ",
    or: "Seenaa Waldaa Qulqulluu",
  },
  faith: {
    en: "Faith & Dogma",
    am: "ሥርዓተ ቤተክርስቲያንና ሃይማኖት",
    or: "Amantaa fi Sirna Waldaa",
  },
  "christian ethics": {
    en: "Christian Ethics & Morals",
    am: "ክርስቲያናዊ ሥነ ምግባር",
    or: "Naamusaa Kiristaanummaa",
  },
  language: {
    en: "Language (Ge'ez / Amharic)",
    am: "ቋንቋ (ግዕዝ/አማርኛ)",
    or: "Afaan (Gi'izii / Afaan Oromoo)",
  },
};

export function translateClassName(rawName: string, lang: SupportedLanguage): string {
  if (!rawName) return "";
  const lower = rawName.toLowerCase();
  for (const [key, mapping] of Object.entries(DOMAIN_CLASSES)) {
    if (lower.includes(key) || rawName.includes(mapping.am) || rawName.includes(mapping.en)) {
      return mapping[lang] || rawName;
    }
  }
  return rawName;
}

export function translateCourseName(rawName: string, lang: SupportedLanguage): string {
  if (!rawName) return "";
  const lower = rawName.toLowerCase();
  for (const [key, mapping] of Object.entries(DOMAIN_COURSES)) {
    if (lower.includes(key) || rawName.includes(mapping.am) || rawName.includes(mapping.en)) {
      return mapping[lang] || rawName;
    }
  }
  return rawName;
}

export function translateAttendanceStatus(
  status: AttendanceStatus,
  lang: SupportedLanguage
): string {
  switch (status) {
    case "present":
      return lang === "am" ? "ተገኝቷል" : lang === "or" ? "Argameera" : "Present";
    case "absent":
      return lang === "am" ? "ቀረ" : lang === "or" ? "Hafeera" : "Absent";
    case "late":
      return lang === "am" ? "አርፍዷል" : lang === "or" ? "Barfateera" : "Late";
    case "permission":
      return lang === "am" ? "በፈቃድ" : lang === "or" ? "Hayyamaan" : "Permission";
  }
}

export function translateRole(role: UserRole, lang: SupportedLanguage): string {
  switch (role) {
    case "admin":
      return lang === "am"
        ? "ባለቤት / አስተዳዳሪ"
        : lang === "or"
          ? "Abbaa Qabeenyaa / Bulchaa"
          : "Owner / Admin";
    case "teacher":
      return lang === "am" ? "መምህር" : lang === "or" ? "Barsiisaa" : "Teacher";
    case "student":
      return lang === "am" ? "ተማሪ" : lang === "or" ? "Barataa" : "Student";
    case "staff":
      return lang === "am" ? "ሠራተኛ" : lang === "or" ? "Hojjetaa" : "Staff";
  }
}

export function translateGender(gender: "male" | "female", lang: SupportedLanguage): string {
  if (gender === "male") {
    return lang === "am" ? "ወንድ" : lang === "or" ? "Dhiira" : "Male";
  }
  return lang === "am" ? "ሴት" : lang === "or" ? "Dhalaa" : "Female";
}

export function translateStudentStatus(status: StudentStatus, lang: SupportedLanguage): string {
  switch (status) {
    case "active":
      return lang === "am" ? "በሂደት ላይ (ንቁ)" : lang === "or" ? "Hojirra Jira" : "Active";
    case "graduated":
      return lang === "am" ? "ተመርቋል" : lang === "or" ? "Eebbifameera" : "Graduated";
    case "transferred":
      return lang === "am" ? "የተዘዋወረ" : lang === "or" ? "Dabarfameera" : "Transferred";
    case "suspended":
      return lang === "am" ? "የታገደ" : lang === "or" ? "Dhoorkameera" : "Suspended";
  }
}

export function translateResultStatus(
  status: "Passed" | "Failed" | "In Progress",
  lang: SupportedLanguage
): string {
  switch (status) {
    case "Passed":
      return lang === "am" ? "አልፏል" : lang === "or" ? "Darbeera" : "Passed";
    case "Failed":
      return lang === "am" ? "ወድቋል" : lang === "or" ? "Kufeera" : "Failed";
    case "In Progress":
      return lang === "am" ? "በሂደት ላይ" : lang === "or" ? "Adeemsarra Jira" : "In Progress";
  }
}

export function translateAssessmentType(type: AssessmentType, lang: SupportedLanguage): string {
  switch (type) {
    case "quiz":
      return lang === "am" ? "የክፍል ፈተና (Quiz)" : lang === "or" ? "Qormaata Gabaabaa" : "Quiz";
    case "midterm":
      return lang === "am"
        ? "የግማሽ ዓመት ፈተና (Midterm)"
        : lang === "or"
          ? "Qormaata Walakkaa"
          : "Midterm Exam";
    case "final":
      return lang === "am"
        ? "የዓመት ማጠቃለያ (Final)"
        : lang === "or"
          ? "Qormaata Xumuraa"
          : "Final Exam";
    case "assignment":
      return lang === "am" ? "የቤት ሥራ (Assignment)" : lang === "or" ? "Hojii Manaa" : "Assignment";
    case "attendance":
      return lang === "am"
        ? "ተሳትፎና ክትትል (Attendance)"
        : lang === "or"
          ? "Hirmaannaa"
          : "Attendance & Participation";
    case "other":
      return lang === "am"
        ? "ተግባር / ሌላ (Practical)"
        : lang === "or"
          ? "Hojii Qabatamaa"
          : "Practical / Other";
  }
}
