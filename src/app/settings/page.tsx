"use client";

import React, { useState } from "react";
import {
  Settings,
  Building2,
  Calendar,
  Shield,
  RotateCcw,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    resetToSampleData,
    user,
  } = useSenbet();

  const [savedAlert, setSavedAlert] = useState(false);

  // New Academic Year state
  const [newYearName, setNewYearName] = useState("");

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

  const handleResetData = () => {
    if (confirm("Reset all classes, students, and attendance back to the demo sample dataset?")) {
      resetToSampleData();
      alert("Sample data restored successfully!");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-800" />
          <span>School & System Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          የሰንበት ትምህርት ቤት መረጃ፣ የትምህርት ዘመን እና የተጠቃሚ ፈቃድ ቅንብሮች
        </p>
      </div>

      {savedAlert && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Settings successfully updated!</span>
        </div>
      )}

      {/* School Profile Info */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-900">School Identity & Parish</CardTitle>
              <CardDescription>Primary profile details for this Sunday school</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">School Name (የሰ/ት/ቤቱ ስም):</span>
              <p className="font-semibold text-slate-900 text-sm mt-0.5">{school?.name}</p>
            </div>
            <div>
              <span className="text-slate-500 block">Parish Church (ደብር/አጥቢያ):</span>
              <p className="font-semibold text-slate-900 text-sm mt-0.5">{school?.parish_name}</p>
            </div>
            <div>
              <span className="text-slate-500 block">Unique Code (መለያ ኮድ):</span>
              <p className="font-mono text-slate-700 mt-0.5">{school?.code}</p>
            </div>
            <div>
              <span className="text-slate-500 block">Contact Phone:</span>
              <p className="font-medium text-slate-700 mt-0.5">
                {school?.phone || "+251 91 123 4567"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block">Address / Location:</span>
              <p className="font-medium text-slate-700 mt-0.5">
                {school?.address || "Addis Ababa, Ethiopia"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Years Management */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-900">
                Academic Years (የትምህርት ዘመን)
              </CardTitle>
              <CardDescription>Configure and activate academic periods</CardDescription>
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
                      ? "border-amber-300 bg-amber-50/60 text-amber-950 font-semibold"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{ay.name}</span>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-[10px]">
                        Active Term
                      </Badge>
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
            className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2"
          >
            <Input
              value={newYearName}
              onChange={(e) => setNewYearName(e.target.value)}
              placeholder="e.g. 2018 ዓ.ም (2025-2026)"
              className="text-xs"
              required
            />
            <Button type="submit" size="sm" className="bg-blue-800 text-white shrink-0 text-xs h-9">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Year
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Role-Based Access Control Simulation */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-900">Active Role & Permissions</CardTitle>
              <CardDescription>
                Simulate role-based views (Owner/Admin, Teacher, Student, Staff)
              </CardDescription>
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
                className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                  currentRole === role
                    ? "bg-blue-800 text-white border-blue-800 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {role === "admin" ? "Owner / Admin" : role}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Currently acting as:{" "}
            <strong className="capitalize text-slate-900">{currentRole}</strong> (User:{" "}
            {user?.full_name || "Admin"}).
          </p>
        </CardContent>
      </Card>

      {/* Demo Reset */}
      <Card className="border-rose-200 bg-rose-50/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-rose-950">Reset Demo Data</CardTitle>
              <CardDescription className="text-xs text-rose-700">
                Restore default classes, students, assessment scores, and attendance records
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetData}
              className="text-xs h-8 flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Sample Data</span>
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
