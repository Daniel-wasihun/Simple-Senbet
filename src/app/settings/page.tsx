"use client";

import React, { useState } from "react";
import {
  Building2,
  Calendar,
  Shield,
  RotateCcw,
  Plus,
  Globe,
  Sun,
  Users,
  Trash2,
  ShieldCheck,
  Mail,
  User,
} from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import { useLanguage } from "@/context/language-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { FormField } from "@/components/common/FormField";
import { Modal } from "@/components/common/Modal";
import { PageHeader } from "@/components/common/PageHeader";
import { InlineAlert } from "@/components/common/InlineAlert";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { UserRole } from "@/types";

export default function SettingsPage() {
  const {
    school,
    academicYears,
    currentAcademicYear,
    createAcademicYear,
    switchAcademicYear,
    currentRole,
    switchRole,
    schoolUsers,
    createSchoolUser,
    deleteSchoolUser,
    resetToSampleData,
    user,
    isOwner,
  } = useSenbet();

  const { t, tRole } = useLanguage();

  const [savedAlert, setSavedAlert] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // New Academic Year state
  const [newYearName, setNewYearName] = useState("");

  // Add User Modal state
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("teacher");
  const [newUserPhone, setNewUserPhone] = useState("");

  // User delete confirmation
  const [deleteUserConfirmId, setDeleteUserConfirmId] = useState<string | null>(null);

  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName.trim()) return;
    createAcademicYear({
      name: newYearName.trim(),
    });
    setNewYearName("");
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserFullName.trim()) return;
    createSchoolUser({
      email: newUserEmail.trim(),
      fullName: newUserFullName.trim(),
      role: newUserRole,
      phone: newUserPhone.trim() || undefined,
    });
    setNewUserEmail("");
    setNewUserFullName("");
    setNewUserRole("teacher");
    setNewUserPhone("");
    setAddUserModalOpen(false);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleResetData = () => {
    resetToSampleData();
    setResetConfirmOpen(false);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      {savedAlert && (
        <InlineAlert
          variant="success"
          title={t("common.success")}
          message={t("settings.savedSuccess")}
          onClose={() => setSavedAlert(false)}
        />
      )}

      {/* Language & Appearance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Language Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-brand-blue dark:text-blue-400 flex items-center justify-center">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">{t("settings.language")}</CardTitle>
                <CardDescription>English · አማርኛ · Afaan Oromoo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher variant="full" />
          </CardContent>
        </Card>

        {/* Theme Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 flex items-center justify-center">
                <Sun className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">{t("settings.theme")}</CardTitle>
                <CardDescription>
                  {t("settings.themeLight")} / {t("settings.themeDark")} /{" "}
                  {t("settings.themeSystem")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-center pt-1">
            <ThemeToggle variant="segmented" className="w-full justify-between" />
          </CardContent>
        </Card>
      </div>

      {/* School Staff & Users Management (Hierarchy: Admin at top, created users below) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">{t("users.title")}</CardTitle>
                <CardDescription>{t("users.subtitle")}</CardDescription>
              </div>
            </div>
            {isOwner && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddUserModalOpen(true)}
                className="text-xs h-8 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t("users.addUser")}</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-gold shrink-0" />
            <span>{t("users.roleNotice")}</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            {schoolUsers.map((u) => (
              <div
                key={u.id}
                className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0">
                    {u.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {u.full_name}
                    </p>
                    <p className="text-slate-400 font-mono truncate">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      u.role === "admin"
                        ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        : u.role === "teacher"
                        ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
                        : u.role === "student"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                        : "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300"
                    }`}
                  >
                    {tRole(u.role)}
                    {u.is_owner && " (Owner)"}
                  </span>

                  {!u.is_owner && (
                    <button
                      onClick={() => setDeleteUserConfirmId(u.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title={t("common.delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* School Profile Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-brand-blue dark:text-blue-400 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{t("settings.schoolProfile")}</CardTitle>
              <CardDescription>{t("settings.subtitle")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">
                {t("settings.schoolName")}:
              </span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                {school?.name}
              </p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">
                {t("settings.parishChurch")}:
              </span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                {school?.parish_name}
              </p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">
                {t("settings.schoolCode")}:
              </span>
              <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">{school?.code}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">
                {t("students.parentPhone")}:
              </span>
              <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                {school?.phone || "+251 91 123 4567"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 dark:text-slate-400 block">
                {t("settings.address")}:
              </span>
              <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                {school?.address || "Addis Ababa, Ethiopia"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Years Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{t("settings.academicYears")}</CardTitle>
              <CardDescription>{t("classes.academicYear")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {academicYears.map((ay) => {
              const isCurrent = currentAcademicYear?.id === ay.id;
              return (
                <div
                  key={ay.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    isCurrent
                      ? "border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/30 text-amber-950 dark:text-amber-300 font-semibold"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{ay.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-medium">
                        Active Term
                      </span>
                    )}
                  </div>
                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => switchAcademicYear(ay.id)}
                      className="text-xs h-7"
                    >
                      Make Active
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add New Academic Year Form */}
          <form
            onSubmit={handleAddYear}
            className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2"
          >
            <Input
              value={newYearName}
              onChange={(e) => setNewYearName(e.target.value)}
              placeholder="e.g. 2018 ዓ.ም (2025-2026)"
              className="text-xs"
              required
            />
            <Button type="submit" variant="primary" size="sm" className="shrink-0 text-xs h-9">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Year
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Role-Based Access Control Simulation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-400 flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{t("common.role")}</CardTitle>
              <CardDescription>{t("common.role")}: Admin, Teacher, Student, Staff</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["admin", "teacher", "student", "staff"] as UserRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => switchRole(role)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  currentRole === role
                    ? "bg-brand-blue text-white border-brand-blue shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {tRole(role)}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("common.role")}:{" "}
            <strong className="capitalize text-slate-900 dark:text-slate-100">
              {tRole(currentRole)}
            </strong>{" "}
            ({user?.full_name || "Admin"}).
          </p>
        </CardContent>
      </Card>

      {/* Demo Reset */}
      <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-rose-950 dark:text-rose-300">
                {t("common.reset")}
              </CardTitle>
              <CardDescription className="text-xs text-rose-700 dark:text-rose-400">
                {t("settings.demoResetDesc")}
              </CardDescription>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setResetConfirmOpen(true)}
              className="text-xs h-8 flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t("common.reset")}</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        title={t("users.addUser")}
        description={t("users.subtitle")}
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <FormField label={t("users.fullName")} required>
            <Input
              value={newUserFullName}
              onChange={(e) => setNewUserFullName(e.target.value)}
              placeholder="e.g. መምህር ዳዊት ወልደሚካኤል"
              icon={User}
              required
            />
          </FormField>

          <FormField label={t("users.email")} required>
            <Input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="teacher@senbet.org"
              icon={Mail}
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t("users.role")} required>
              <Select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
              >
                <option value="teacher">{tRole("teacher")}</option>
                <option value="student">{tRole("student")}</option>
                <option value="staff">{tRole("staff")}</option>
              </Select>
            </FormField>

            <FormField label={t("students.parentPhone")}>
              <Input
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="+251 91 222 3344"
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setAddUserModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteUserConfirmId}
        onClose={() => setDeleteUserConfirmId(null)}
        onConfirm={() => {
          if (deleteUserConfirmId) {
            deleteSchoolUser(deleteUserConfirmId);
            setDeleteUserConfirmId(null);
          }
        }}
        title={t("common.delete")}
        description="Are you sure you want to remove this user account from the school?"
        variant="danger"
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title={t("common.reset")}
        description={t("settings.demoResetDesc")}
        confirmText={t("common.reset")}
        variant="danger"
      />
    </div>
  );
}
