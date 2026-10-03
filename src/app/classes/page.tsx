"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Users,
  BookOpen,
  Trash2,
} from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

export default function ClassesPage() {
  const { classes, enrollments, courses, createClass, deleteClass, currentAcademicYear } =
    useSenbet();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [levelCategory, setLevelCategory] = useState("ህጻናት (Children)");
  const [roomNumber, setRoomNumber] = useState("");

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-800" />
            <span>Class Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            የክፍሎች ዝርዝር እና አደረጃጀት — {currentAcademicYear?.name || "2017 ዓ.ም"}
          </p>
        </div>

        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-blue-800 hover:bg-blue-900 text-white shadow-sm flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Class</span>
        </Button>
      </div>

      {/* Class Cards Grid */}
      {classes.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-8 w-8 text-slate-400" />}
          title="No classes created yet"
          description="Create your first class to begin enrolling students, assigning courses, and marking attendance."
          action={
            <Button onClick={() => setAddDialogOpen(true)} className="bg-blue-800 text-white">
              Create First Class
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const studentCount = getStudentCount(cls.id);
            const courseCount = getCourseCount(cls.id);

            return (
              <Card
                key={cls.id}
                className="border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-2 text-[10px]">
                        {cls.level_category || "General"}
                      </Badge>
                      <CardTitle className="text-lg text-slate-900">
                        <Link
                          href={`/classes/${cls.id}`}
                          className="hover:text-blue-800 hover:underline"
                        >
                          {cls.name}
                        </Link>
                      </CardTitle>
                      {cls.room_number && (
                        <CardDescription className="mt-0.5 text-xs text-slate-500">
                          Room: {cls.room_number}
                        </CardDescription>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${cls.name}?`)) {
                          deleteClass(cls.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Delete Class"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-2">
                      <div className="text-base font-bold text-blue-900">{studentCount}</div>
                      <div className="text-[11px] text-blue-600 flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" /> Students
                      </div>
                    </div>
                    <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-2">
                      <div className="text-base font-bold text-amber-900">{courseCount}</div>
                      <div className="text-[11px] text-amber-700 flex items-center justify-center gap-1">
                        <BookOpen className="h-3 w-3" /> Courses
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <Link href={`/classes/${cls.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      Class Details
                    </Button>
                  </Link>
                  <Link href={`/roster?classId=${cls.id}`} className="w-full">
                    <Button
                      size="sm"
                      className="w-full bg-blue-800 hover:bg-blue-900 text-white text-xs h-8"
                    >
                      View Roster
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Class Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogHeader>
          <DialogTitle>Add New Class (አዲስ ክፍል ፍጠር)</DialogTitle>
          <DialogDescription>
            Specify the grade level or section for{" "}
            {currentAcademicYear?.name || "this academic year"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Class Name (የክፍሉ ስም) *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2ኛ ክፍል (Grade 2), 6ኛ ክፍል..."
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Level Category (ደረጃ)
            </label>
            <select
              value={levelCategory}
              onChange={(e) => setLevelCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ቅድመ መደበኛ (Preschool)">ቅድመ መደበኛ (Preschool)</option>
              <option value="ህጻናት (Children)">ህጻናት (Children - Grades 1-4)</option>
              <option value="መካከለኛ (Intermediate)">መካከለኛ (Intermediate - Grades 5-8)</option>
              <option value="ወጣቶች (Youth)">ወጣቶች (Youth - Grades 9-12)</option>
              <option value="ማህበራትና አበው (Adults/Fellowship)">
                ማህበራትና አበው (Adults / Fellowship)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Room / Location (የክፍል ቁጥር ወይም አዳራሽ)
            </label>
            <Input
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. ክፍል 201, ዋና አዳራሽ..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-800 text-white hover:bg-blue-900">
              Create Class
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
