"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft, CheckCircle2, AlertTriangle, Sparkles, Save } from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import { validateAssessmentBreakdown } from "@/lib/calculations";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { InlineAlert } from "@/components/common/InlineAlert";
import { AssessmentType } from "@/types";

interface AssessmentDraft {
  id?: string;
  name: string;
  assessment_type: AssessmentType;
  max_score: number;
  weight_percentage: number;
}

export default function CourseAssessmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;

  const { courses, classes, assessments, saveCourseAssessments } = useSenbet();
  const { t, tCourse, tClass } = useLanguage();

  const course = courses.find((c) => c.id === courseId);
  const courseClass = course ? classes.find((c) => c.id === course.class_id) : null;

  const [items, setItems] = useState<AssessmentDraft[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing assessments on mount
  useEffect(() => {
    const existing = assessments.filter((a) => a.course_id === courseId);
    if (existing.length > 0) {
      setItems(
        existing.map((a) => ({
          id: a.id,
          name: a.name,
          assessment_type: a.assessment_type,
          max_score: a.max_score,
          weight_percentage: a.weight_percentage,
        }))
      );
    } else {
      // Default initial layout
      setItems([
        {
          name: "የክፍል ፈተና (Quiz)",
          assessment_type: "quiz",
          max_score: 10,
          weight_percentage: 10,
        },
        {
          name: "የግማሽ ዓመት ፈተና (Midterm Exam)",
          assessment_type: "midterm",
          max_score: 30,
          weight_percentage: 30,
        },
        {
          name: "ተሳትፎና ክትትል (Attendance / Participation)",
          assessment_type: "attendance",
          max_score: 10,
          weight_percentage: 10,
        },
        {
          name: "የዓመት ማጠቃለያ ፈተና (Final Exam)",
          assessment_type: "final",
          max_score: 50,
          weight_percentage: 50,
        },
      ]);
    }
  }, [courseId, assessments]);

  if (!course) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          {t("courses.noCourses")}
        </h2>
        <Link href="/courses" className="mt-4 inline-block">
          <Button variant="outline">{t("courses.title")}</Button>
        </Link>
      </div>
    );
  }

  // Calculate totals and validation
  const validation = validateAssessmentBreakdown(items);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        name: "አዲስ ምዘና (New Assessment)",
        assessment_type: "assignment",
        max_score: 10,
        weight_percentage: Math.max(
          0,
          validation.remainingWeight > 0 ? validation.remainingWeight : 10
        ),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof AssessmentDraft, value: string | number) => {
    setItems(items.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const applyPreset = (presetType: "standard" | "simple4060" | "equal25") => {
    if (presetType === "standard") {
      setItems([
        { name: "የክፍል ፈተና (Quiz)", assessment_type: "quiz", max_score: 10, weight_percentage: 10 },
        {
          name: "የግማሽ ዓመት ፈተና (Midterm Exam)",
          assessment_type: "midterm",
          max_score: 30,
          weight_percentage: 30,
        },
        {
          name: "ተሳትፎና ክትትል (Attendance)",
          assessment_type: "attendance",
          max_score: 10,
          weight_percentage: 10,
        },
        {
          name: "የዓመት ማጠቃለያ (Final Exam)",
          assessment_type: "final",
          max_score: 50,
          weight_percentage: 50,
        },
      ]);
    } else if (presetType === "simple4060") {
      setItems([
        {
          name: "የግማሽ ዓመት (Midterm)",
          assessment_type: "midterm",
          max_score: 40,
          weight_percentage: 40,
        },
        {
          name: "የዓመት ማጠቃለያ (Final)",
          assessment_type: "final",
          max_score: 60,
          weight_percentage: 60,
        },
      ]);
    } else if (presetType === "equal25") {
      setItems([
        { name: "ምዕራፍ 1 (Term 1)", assessment_type: "quiz", max_score: 25, weight_percentage: 25 },
        {
          name: "ምዕራፍ 2 (Term 2)",
          assessment_type: "midterm",
          max_score: 25,
          weight_percentage: 25,
        },
        {
          name: "ምዕራፍ 3 (Term 3)",
          assessment_type: "assignment",
          max_score: 25,
          weight_percentage: 25,
        },
        { name: "ምዕራፍ 4 (Term 4)", assessment_type: "final", max_score: 25, weight_percentage: 25 },
      ]);
    }
  };

  const handleSave = () => {
    saveCourseAssessments(courseId, items);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/courses"
          className="inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-brand-blue dark:hover:text-blue-400 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> {t("courses.title")}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
                {tCourse(course.name)}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {course.code || "COURSE"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {courseClass ? `${t("classes.className")}: ${tClass(courseClass.name)} · ` : ""}
              {t("assessments.title")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} variant="primary" className="flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              <span>{t("common.save")}</span>
            </Button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <InlineAlert
          variant="success"
          title={t("common.success")}
          message={t("assessments.validTotal")}
          onClose={() => setSaveSuccess(false)}
        />
      )}

      {/* Preset Quick Fill */}
      <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300 font-medium">
            <Sparkles className="h-4 w-4 text-brand-gold" />
            <span>{t("assessments.presets")}:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset("standard")}
              className="text-xs h-7 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              Standard (30% Mid / 50% Final / 10% Quiz / 10% Att)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset("simple4060")}
              className="text-xs h-7 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              Simple (40% Mid / 60% Final)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applyPreset("equal25")}
              className="text-xs h-7 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              4 Terms (25% each)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Components List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("assessments.title")}</CardTitle>
              <CardDescription>{t("courses.subtitle")}</CardDescription>
            </div>
            <Button size="sm" onClick={handleAddItem} variant="outline" className="text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> {t("assessments.addComponent")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-colors grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
            >
              {/* Name */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t("assessments.componentName")}
                </label>
                <Input
                  value={item.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  placeholder="e.g. Midterm Exam"
                  className="text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Type */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t("common.role")}
                </label>
                <Select
                  value={item.assessment_type}
                  onChange={(e) =>
                    handleChange(index, "assessment_type", e.target.value as AssessmentType)
                  }
                  className="py-1 text-xs sm:text-sm"
                >
                  <option value="quiz">Quiz (የክፍል ፈተና)</option>
                  <option value="midterm">Midterm (ግማሽ ዓመት)</option>
                  <option value="final">Final Exam (ማጠቃለያ)</option>
                  <option value="assignment">Assignment (የቤት ሥራ)</option>
                  <option value="attendance">Attendance / Participation (ክትትል)</option>
                  <option value="other">Practical / Other (ሌላ)</option>
                </Select>
              </div>

              {/* Max Score */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t("assessments.maxScore")}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={item.max_score}
                  onChange={(e) => handleChange(index, "max_score", Number(e.target.value))}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Weight Percentage */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t("assessments.weight")} (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={item.weight_percentage}
                  onChange={(e) => handleChange(index, "weight_percentage", Number(e.target.value))}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Remove */}
              <div className="md:col-span-1 flex justify-end md:pt-4">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length <= 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  title={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>

        {/* Validation and Summary Footer */}
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 py-3.5 px-6 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {t("assessments.maxScore")}:{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {validation.totalMaxScore}
              </strong>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {t("assessments.totalWeight")}:{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {validation.totalWeight}%
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{t("assessments.validTotal")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>
                  {validation.totalWeight < 100
                    ? `Remaining: ${validation.remainingWeight}% to reach 100%`
                    : `Exceeds by ${Math.abs(validation.remainingWeight)}% (Total must equal 100%)`}
                </span>
              </span>
            )}

            <Button onClick={handleSave} variant="primary" size="sm" className="text-xs h-8 ml-2">
              {t("common.save")}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
