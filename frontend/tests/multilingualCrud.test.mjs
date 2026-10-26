import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Reusable nestedText resolution mirroring SchoolManagementWorkspace.tsx
 */
function resolveNestedText(value, language = "en") {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        return resolveNestedText(parsed, language);
      } catch {
        return value;
      }
    }
    return value;
  }
  if (typeof value === "object") {
    const item = value;
    if (item.en !== undefined || item.am !== undefined || item.om !== undefined) {
      const current = item[language];
      if (typeof current === "string" && current.trim() !== "") {
        return current.trim();
      }
      return String(item.en || item.am || item.om || "—");
    }
    if (item.name) return resolveNestedText(item.name, language);
    if (item.title) return resolveNestedText(item.title, language);
    return String(item.full_name ?? item.code ?? item.id ?? "—");
  }
  return String(value);
}

/**
 * Clean localized payload serializer mirroring SchoolManagementWorkspace.tsx
 */
function serializeLocalizedPayload(formFields, fieldConfigs) {
  return Object.fromEntries(
    Object.entries(formFields).map(([key, value]) => {
      const config = fieldConfigs.find((f) => f.name === key);
      if (config?.type === "localized") {
        const localized = value ?? {};
        const clean = {};
        if (typeof localized.en === "string" && localized.en.trim()) clean.en = localized.en.trim();
        if (typeof localized.am === "string" && localized.am.trim()) clean.am = localized.am.trim();
        if (typeof localized.om === "string" && localized.om.trim()) clean.om = localized.om.trim();
        return [key, clean];
      }
      return [key, value === "" ? null : value];
    })
  );
}

/**
 * Validation checker mirroring SchoolManagementWorkspace.tsx
 */
function validateLocalizedForm(formFields, fieldConfigs) {
  for (const field of fieldConfigs) {
    if (field.type === "localized" && field.required) {
      const val = formFields[field.name];
      if (!val || typeof val.en !== "string" || !val.en.trim()) {
        return { valid: false, error: `English ${field.name} is mandatory.` };
      }
    }
  }
  return { valid: true };
}

describe("Central Reusable Multilingual CRUD Modals", () => {
  const sampleFields = [
    { name: "name", label: "name", type: "localized", required: true },
    { name: "code", label: "code", type: "text", required: true },
    { name: "description", label: "description", type: "localized", required: false },
  ];

  it("enforces English is mandatory for required translatable fields", () => {
    // Empty English should fail
    const invalidForm = {
      name: { en: "", am: "1ኛ ክፍል", om: "Kutaa 1ffaa" },
      code: "G1",
    };
    const check1 = validateLocalizedForm(invalidForm, sampleFields);
    assert.strictEqual(check1.valid, false);
    assert.match(check1.error, /English name is mandatory/i);

    // Whitespace only English should fail
    const whitespaceForm = {
      name: { en: "   ", am: "1ኛ ክፍል", om: "" },
      code: "G1",
    };
    const check2 = validateLocalizedForm(whitespaceForm, sampleFields);
    assert.strictEqual(check2.valid, false);

    // Filled English should succeed even if optional languages are empty
    const validEnglishOnly = {
      name: { en: "Grade 1", am: "", om: "" },
      code: "G1",
    };
    const check3 = validateLocalizedForm(validEnglishOnly, sampleFields);
    assert.strictEqual(check3.valid, true);
  });

  it("switches single-input value seamlessly when language is changed", () => {
    // Simulate user state transitions
    let activeLanguage = "en";
    const draft = { en: "Grade 1", am: "", om: "" };

    // 1. Current value in English
    assert.strictEqual(draft[activeLanguage], "Grade 1");

    // 2. User switches to Amharic (not set yet -> empty string)
    activeLanguage = "am";
    assert.strictEqual(draft[activeLanguage] || "", "");

    // 3. User types in Amharic
    draft.am = "1ኛ ክፍል";
    assert.strictEqual(draft[activeLanguage], "1ኛ ክፍል");

    // 4. User switches back to English -> old data preserved
    activeLanguage = "en";
    assert.strictEqual(draft[activeLanguage], "Grade 1");
  });

  it("serializes translatable data to clean JSON omitting empty optional translations", () => {
    const form = {
      name: { en: "Grade 1", am: "1ኛ ክፍል", om: "" },
      code: "G1",
      description: { en: "Basic foundations", am: "", om: "Bu'uura" },
    };

    const payload = serializeLocalizedPayload(form, sampleFields);

    assert.deepStrictEqual(payload.name, {
      en: "Grade 1",
      am: "1ኛ ክፍል",
    });

    assert.deepStrictEqual(payload.description, {
      en: "Basic foundations",
      om: "Bu'uura",
    });

    assert.strictEqual(payload.code, "G1");
  });

  it("dynamically resolves localized display based on active app language with fallback to English", () => {
    const recordName = {
      en: "Grade 1",
      am: "1ኛ ክፍል",
      om: "Kutaa 1ffaa",
    };

    // When app is in Amharic
    assert.strictEqual(resolveNestedText(recordName, "am"), "1ኛ ክፍል");

    // When app is in Afaan Oromoo
    assert.strictEqual(resolveNestedText(recordName, "om"), "Kutaa 1ffaa");

    // When app is in English
    assert.strictEqual(resolveNestedText(recordName, "en"), "Grade 1");

    // When translation is missing for the active language, gracefully fallback to English
    const partialRecord = { en: "Biology", am: "", om: "" };
    assert.strictEqual(resolveNestedText(partialRecord, "am"), "Biology");
    assert.strictEqual(resolveNestedText(partialRecord, "om"), "Biology");

    // When backend returns stringified JSON
    const stringified = JSON.stringify({ en: "Physics", am: "ፊዚክስ" });
    assert.strictEqual(resolveNestedText(stringified, "am"), "ፊዚክስ");
    assert.strictEqual(resolveNestedText(stringified, "om"), "Physics");
  });
});
