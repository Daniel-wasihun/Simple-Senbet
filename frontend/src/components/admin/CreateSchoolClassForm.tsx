
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Globe, X, School, Loader2 } from "lucide-react";

import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { schoolClassApi } from "@/services/schoolManagement.service";

type SupportedLocale = "en" | "am" | "om";

type LocalizedValue = Record<SupportedLocale, string>;

export interface SchoolClassFormData {
  name: LocalizedValue;
  code: string;
  number_of_sections: number;
  passing_score: number;
  next_class_id: number | null;
}

interface SchoolClass {
  id?: number;
  name?: LocalizedValue | string;
  code?: string;
  number_of_sections?: number;
  passing_score?: number;
  next_class_id?: number | null;
}

interface CreateSchoolClassFormProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void | Promise<void>;
  selectedClass?: SchoolClass | null | any;
  isSaving?: boolean | undefined;
}

const emptyTranslations = (): LocalizedValue => ({
  en: "",
  am: "",
  om: "",
});

const getTranslations = (
  value?: LocalizedValue | string
): LocalizedValue => {
  if (value && typeof value === "object") {
    return {
      en: value.en ?? "",
      am: value.am ?? "",
      om: value.om ?? "",
    };
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);

      if (parsed && typeof parsed === "object") {
        const translations = parsed as Partial<LocalizedValue>;

        return {
          en: translations.en ?? "",
          am: translations.am ?? "",
          om: translations.om ?? "",
        };
      }
    } catch {
      return { en: value, am: "", om: "" };
    }

    return { en: value, am: "", om: "" };
  }

  return emptyTranslations();
};

const initialValues = (
  schoolClass?: SchoolClass | null
): SchoolClassFormData => ({
  name: getTranslations(schoolClass?.name),
  code: schoolClass?.code ?? "",
  number_of_sections: schoolClass?.number_of_sections ?? 1,
  passing_score: schoolClass?.passing_score ?? 0,
  next_class_id: schoolClass?.next_class_id ?? null,
});

export default function CreateSchoolClassForm({
  isOpen,
  onClose,
  onConfirm,
  selectedClass,
  isSaving = false,
}: CreateSchoolClassFormProps) {
  const { t } = useTranslation();

  const [formLang, setFormLang] = useState<SupportedLocale>("en");
  const [form, setForm] = useState<SchoolClassFormData>(initialValues());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const isEditing = Boolean(selectedClass);

  useEffect(() => {
    if (!isOpen) return;

    setForm(initialValues(selectedClass));
    setFormLang("en");
    setErrors({});
    setSubmitError("");
  }, [isOpen, selectedClass]);

  const updateField = <K extends keyof SchoolClassFormData>(
    field: K,
    value: SchoolClassFormData[K]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));

    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });

    setSubmitError("");
  };

  const updateName = (value: string) => {
    setForm((current) => ({
      ...current,
      name: {
        ...current.name,
        [formLang]: value,
      },
    }));

    setErrors((current) => {
      const next = { ...current };
      delete next.name;
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.name.en.trim()) {
      nextErrors.name = t("management.englishMandatory", {
        defaultValue: "Class name in English is required.",
      });
    }

    if (!form.code.trim()) {
      nextErrors.code = t("management.required", {
        defaultValue: "This field is required.",
      });
    }

    if (
      !Number.isInteger(Number(form.number_of_sections)) ||
      Number(form.number_of_sections) < 1
    ) {
      nextErrors.number_of_sections = t("management.invalidSections", {
        defaultValue: "Enter at least one section.",
      });
    }

    if (
      Number(form.passing_score) < 0 ||
      Number(form.passing_score) > 100
    ) {
      nextErrors.passing_score = t("management.invalidPassingScore", {
        defaultValue: "Passing score must be between 0 and 100.",
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving || !validate()) return;

    setSubmitError("");

    try {
      await onConfirm({
        ...form,
        name: {
          en: form.name.en.trim(),
          am: form.name.am.trim(),
          om: form.name.om.trim(),
        },
        code: form.code.trim(),
        number_of_sections: Number(form.number_of_sections),
        passing_score: Number(form.passing_score),
        next_class_id:
          form.next_class_id === null ? null : form.next_class_id,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : t("administration.saveError", {
              defaultValue: "Unable to save the class.",
            })
      );
    }
  };

  const languageOptions: {
    value: SupportedLocale;
    label: string;
  }[] = [
    { value: "en", label: "EN" },
    { value: "am", label: "አማ" },
    { value: "om", label: "OM" },
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open:any) => {
        if (!open && !isSaving) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-[650px]">
        <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b p-5">
          <div className="flex items-center gap-3">
            <div className="flex item-between">
            <div className="rounded-lg bg-primary/10 p-2">
              <School className="h-5 w-5 text-primary" />
            </div>

            <div>
              <DialogTitle className="text-lg font-semibold">
                {t(
                  isEditing
                    ? "management.editClass"
                    : "management.createClass",
                  {
                    defaultValue: isEditing
                      ? "Edit School Class"
                      : "Create School Class",
                  }
                )}
              </DialogTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {t("management.classFormDescription", {
                  defaultValue: "Enter the class information below.",
                })}
              </p> 
              
            </div>
            </div>
              <div className="flex items-center gap-1 rounded-lg border p-1">
                  <Globe className="mx-1 h-4 w-4 text-muted-foreground" />

                  {languageOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={
                        formLang === option.value ? "default" : "ghost"
                      }
                      className="h-8 px-3"
                      onClick={() => setFormLang(option.value)}
                      aria-pressed={formLang === option.value}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isSaving}
            onClick={onClose}
            aria-label={t("common.close", { defaultValue: "Close" })}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>
                  {t("management.name", { defaultValue: "Class Name" })}
                  <span className="ml-1 text-destructive">*</span>
                </Label>

              
              </div>

              <Input
                value={form.name[formLang]}
                onChange={(event) => updateName(event.target.value)}
                placeholder={t("management.classNamePlaceholder", {
                  defaultValue: `Enter class name in ${
                    formLang === "en"
                      ? "English"
                      : formLang === "am"
                        ? "Amharic"
                        : "Afaan Oromo"
                  }`,
                })}
                aria-invalid={Boolean(errors.name)}
                disabled={isSaving}
              />

              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}

              <p className="text-xs text-muted-foreground">
                {t("management.currentLanguage", {
                  defaultValue: "Editing language:",
                })}{" "}
                {formLang === "en"
                  ? "English"
                  : formLang === "am"
                    ? "አማርኛ"
                    : "Afaan Oromo"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-code">
                {t("management.code", { defaultValue: "Class Code" })}
                <span className="ml-1 text-destructive">*</span>
              </Label>

              <Input
                id="class-code"
                value={form.code}
                onChange={(event) => updateField("code", event.target.value)}
                placeholder={t("management.classCodePlaceholder", {
                  defaultValue: "Enter class code",
                })}
                aria-invalid={Boolean(errors.code)}
                disabled={isSaving}
              />

              {errors.code && (
                <p className="text-sm text-destructive">{errors.code}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="number-of-sections">
                  {t("management.numberOfSections", {
                    defaultValue: "Number of Sections",
                  })}
                  <span className="ml-1 text-destructive">*</span>
                </Label>

                <Input
                  id="number-of-sections"
                  type="number"
                  min={1}
                  step={1}
                  value={form.number_of_sections}
                  onChange={(event) =>
                    updateField(
                      "number_of_sections",
                      event.target.value === ""
                        ? ("" as unknown as number)
                        : Number(event.target.value)
                    )
                  }
                  aria-invalid={Boolean(errors.number_of_sections)}
                  disabled={isSaving}
                />

                {errors.number_of_sections && (
                  <p className="text-sm text-destructive">
                    {errors.number_of_sections}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passing-score">
                  {t("management.passingScore", {
                    defaultValue: "Passing Score (%)",
                  })}
                  <span className="ml-1 text-destructive">*</span>
                </Label>

                <Input
                  id="passing-score"
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  value={form.passing_score}
                  onChange={(event) =>
                    updateField(
                      "passing_score",
                      event.target.value === ""
                        ? ("" as unknown as number)
                        : Number(event.target.value)
                    )
                  }
                  aria-invalid={Boolean(errors.passing_score)}
                  disabled={isSaving}
                />

                {errors.passing_score && (
                  <p className="text-sm text-destructive">
                    {errors.passing_score}
                  </p>
                )}
              </div>
            </div>

            {submitError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {submitError}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t p-5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>

            <Button type="submit" disabled={isSaving}>
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t(
                isEditing ? "common.update" : "common.create",
                { defaultValue: isEditing ? "Update Class" : "Create Class" }
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
