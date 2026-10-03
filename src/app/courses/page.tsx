"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Filter,
  Award,
  Trash2,
  Edit2,
} from "lucide-react";
import { useSenbet } from "@/context/senbet-context";
import {
  Card,
  CardHeader,
  CardTitle,
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
import { Course } from "@/types";

export default function CoursesPage() {
  const { courses, classes, enrollments, assessments, createCourse, updateCourse, deleteCourse } =
    useSenbet();

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [classId, setClassId] = useState("");

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      return selectedClassFilter === "all" || c.class_id === selectedClassFilter;
    });
  }, [courses, selectedClassFilter]);

  const openAddDialog = () => {
    setEditingCourse(null);
    setName("");
    setCode("");
    setClassId(selectedClassFilter !== "all" ? selectedClassFilter : classes[0]?.id || "");
    setDialogOpen(true);
  };

  const openEditDialog = (c: Course) => {
    setEditingCourse(c);
    setName(c.name);
    setCode(c.code || "");
    setClassId(c.class_id);
    setDialogOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !classId) return;

    if (editingCourse) {
      updateCourse(editingCourse.id, {
        name: name.trim(),
        code: code.trim(),
        class_id: classId,
      });
    } else {
      createCourse({
        name: name.trim(),
        code: code.trim() || name.substring(0, 3).toUpperCase() + "-101",
        classId,
      });
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-800" />
            <span>Courses per Class</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            የትምህርት ዓይነቶች — መጽሐፍ ቅዱስ፣ ዝማሬ፣ የቤተክርስቲያን ታሪክ፣ ሥርዓተ ቤተክርስቲያን
          </p>
        </div>

        <Button
          onClick={openAddDialog}
          className="bg-blue-800 hover:bg-blue-900 text-white shadow-sm flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add Course</span>
        </Button>
      </div>

      {/* Class Filter Bar */}
      <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs max-w-md">
        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
        <select
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
          className="w-full text-xs sm:text-sm font-medium border border-slate-200 rounded-md p-1.5 bg-slate-50 text-slate-800 outline-none cursor-pointer"
        >
          <option value="all">All Classes ({courses.length} courses)</option>
          {classes.map((c) => {
            const count = courses.filter((crs) => crs.class_id === c.id).length;
            return (
              <option key={c.id} value={c.id}>
                {c.name} ({count} courses)
              </option>
            );
          })}
        </select>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8 text-slate-400" />}
          title="No courses found"
          description="Create your first subject for this class, such as Bible Study, Mezmur, or Church History."
          action={
            <Button onClick={openAddDialog} className="bg-blue-800 text-white">
              Add First Course
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((crs) => {
            const cls = classes.find((c) => c.id === crs.class_id);
            const enrolledCount = enrollments.filter((e) => e.class_id === crs.class_id).length;
            const courseAssessments = assessments.filter((a) => a.course_id === crs.id);
            const totalWeight = courseAssessments.reduce((sum, a) => sum + a.weight_percentage, 0);

            return (
              <Card
                key={crs.id}
                className="border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {crs.code || "COURSE"}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {cls?.name || "Class"}
                        </Badge>
                      </div>
                      <CardTitle className="text-base text-slate-900 leading-snug">
                        {crs.name}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDialog(crs)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                        title="Edit course"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete course ${crs.name}?`)) {
                            deleteCourse(crs.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                        title="Delete course"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="font-bold text-slate-800">{enrolledCount}</div>
                      <div className="text-[10px] text-slate-500">Students</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="font-bold text-slate-800">{courseAssessments.length}</div>
                      <div className="text-[10px] text-slate-500">Components</div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Weight Setup:</span>
                    <Badge
                      variant={totalWeight === 100 ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {totalWeight}% {totalWeight === 100 ? "✓ 100% Valid" : "Incomplete"}
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100">
                  <Link href={`/courses/${crs.id}/assessments`} className="w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-blue-900 hover:bg-blue-50"
                    >
                      <Award className="h-3.5 w-3.5 mr-1 text-amber-600" />
                      Configure Assessment Breakdown
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Course Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editingCourse ? "Edit Course" : "Add Course to Class"}</DialogTitle>
          <DialogDescription>
            Specify course name and assign it to the target grade level.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveCourse} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Class (ክፍል) *
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              <option value="">— Select Class —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course / Subject Name (የትምህርቱ ስም) *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. መጽሐፍ ቅዱስ ጥናት (Bible Study)"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course Code (ኮድ)
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. BIB-501"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-800 text-white hover:bg-blue-900">
              {editingCourse ? "Save Changes" : "Create Course"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
