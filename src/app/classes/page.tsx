"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, Plus, Users, BookOpen, Trash2 } from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";

export default function ClassesPage() {
  const { classes, enrollments, courses, createClass, deleteClass, currentAcademicYear } =
    useSenbet();
  const { t, tClass } = useLanguage();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [levelCategory, setLevelCategory] = useState("children");
  const [roomNumber, setRoomNumber] = useState("");

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createClass({
      name: name.trim(),
      levelCategory,
      roomNumber: roomNumber.trim(),
    });
    setName("");
    setRoomNumber("");
    setAddDialogOpen(false);
  };

  const getStudentCount = (classId: string) => {
    return enrollments.filter((e) => e.class_id === classId).length;
  };

  const getCourseCount = (classId: string) => {
    return courses.filter((c) => c.class_id === classId).length;
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <PageHeader
        title={t("classes.title")}
        subtitle={`${t("classes.subtitle")} — ${currentAcademicYear?.name || "2017 ዓ.ም"}`}
        action={
          <Button
            onClick={() => setAddDialogOpen(true)}
            variant="primary"
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{t("classes.addClass")}</span>
          </Button>
        }
      />

      {/* Class Cards Grid */}
      {classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={t("classes.noClasses")}
          description={t("classes.subtitle")}
          actionLabel={t("classes.addClass")}
          onAction={() => setAddDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const studentCount = getStudentCount(cls.id);
            const courseCount = getCourseCount(cls.id);

            return (
              <Card
                key={cls.id}
                className="hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2">
                        {cls.level_category || "General"}
                      </span>
                      <CardTitle className="text-lg">
                        <Link
                          href={`/classes/${cls.id}`}
                          className="hover:text-brand-blue dark:hover:text-blue-400 hover:underline"
                        >
                          {tClass(cls.name)}
                        </Link>
                      </CardTitle>
                      {cls.room_number && (
                        <CardDescription className="mt-0.5">{cls.room_number}</CardDescription>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setClassToDelete({ id: cls.id, name: tClass(cls.name) });
                        setDeleteConfirmOpen(true);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                      title={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 p-2.5">
                      <div className="text-lg font-bold text-brand-blue dark:text-blue-400">
                        {studentCount}
                      </div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400/80 flex items-center justify-center gap-1 font-medium">
                        <Users className="h-3 w-3" /> {t("classes.students")}
                      </div>
                    </div>
                    <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 p-2.5">
                      <div className="text-lg font-bold text-amber-900 dark:text-amber-400">
                        {courseCount}
                      </div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-400/80 flex items-center justify-center gap-1 font-medium">
                        <BookOpen className="h-3 w-3" /> {t("classes.courses")}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <Link href={`/classes/${cls.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      {t("common.details")}
                    </Button>
                  </Link>
                  <Link href={`/roster?classId=${cls.id}`} className="w-full">
                    <Button variant="primary" size="sm" className="w-full text-xs h-8">
                      {t("roster.title")}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Class Modal */}
      <Modal
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        title={t("classes.addClass")}
        description={`${t("classes.academicYear")}: ${currentAcademicYear?.name || "2017 ዓ.ም"}`}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label={t("classes.className")} required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 1ኛ ክፍል / Grade 1 / Kutaa 1ffaa"
              required
              autoFocus
            />
          </FormField>

          <FormField label={t("classes.levelCategory")}>
            <Select value={levelCategory} onChange={(e) => setLevelCategory(e.target.value)}>
              <option value="preschool">ቅድመ መደበኛ (Preschool / Oolmaa Daa'immanii)</option>
              <option value="children">ህጻናት (Children - Grades 1-4)</option>
              <option value="intermediate">መካከለኛ (Intermediate - Grades 5-8)</option>
              <option value="youth">ወጣቶች (Youth - Grades 9-12)</option>
              <option value="adults">ማህበራትና አበው (Adults / Fellowship)</option>
            </Select>
          </FormField>

          <FormField label={t("classes.roomNumber")}>
            <Input
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. ክፍል 101 / Hall A"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setClassToDelete(null);
        }}
        onConfirm={() => {
          if (classToDelete) {
            deleteClass(classToDelete.id);
            setDeleteConfirmOpen(false);
            setClassToDelete(null);
          }
        }}
        title={t("common.delete")}
        description={t("classes.deleteConfirm", { name: classToDelete?.name || "" })}
        confirmText={t("common.delete")}
        variant="danger"
      />
    </div>
  );
}
