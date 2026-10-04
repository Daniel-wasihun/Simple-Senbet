"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  School,
  AcademicYear,
  ClassModel,
  Student,
  StudentEnrollment,
  Course,
  CourseAssessment,
  AssessmentResult,
  AttendanceRecord,
  Profile,
  UserRole,
  StudentStatus,
  AttendanceStatus,
  AssessmentType,
  ClassRosterEntry,
  DashboardStats,
  UserAccount,
} from "@/types";
import {
  INITIAL_PROFILE,
  INITIAL_USERS,
  INITIAL_SCHOOL,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_ENROLLMENTS,
  INITIAL_COURSES,
  INITIAL_ASSESSMENTS,
  INITIAL_RESULTS,
  INITIAL_ATTENDANCE,
  getTodayDateString,
} from "@/lib/mock-data";
import { calculateDeterministicRoster, calculateAttendanceMetrics } from "@/lib/calculations";

interface SenbetContextType {
  // Auth state
  user: Profile | null;
  currentRole: UserRole;
  isOwner: boolean;
  schoolUsers: UserAccount[];
  login: (email: string, pass: string) => Promise<boolean>;
  register: (
    email: string,
    pass: string,
    fullName: string,
    schoolData?: {
      name: string;
      parishName: string;
      code?: string;
      phone?: string;
      address?: string;
    }
  ) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  createSchoolUser: (data: {
    email: string;
    fullName: string;
    role: UserRole;
    phone?: string;
  }) => UserAccount;
  deleteSchoolUser: (id: string) => void;

  // School state
  school: School | null;
  schools: School[];
  createSchool: (data: {
    name: string;
    parishName: string;
    code?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) => Promise<School>;
  switchSchool: (schoolId: string) => void;

  // Academic year state
  academicYears: AcademicYear[];
  currentAcademicYear: AcademicYear | null;
  createAcademicYear: (data: { name: string; startDate?: string; endDate?: string }) => void;
  switchAcademicYear: (yearId: string) => void;

  // Entities
  classes: ClassModel[];
  students: Student[];
  enrollments: StudentEnrollment[];
  courses: Course[];
  assessments: CourseAssessment[];
  results: AssessmentResult[];
  attendance: AttendanceRecord[];

  // Class actions
  createClass: (data: { name: string; levelCategory?: string; roomNumber?: string }) => ClassModel;
  updateClass: (id: string, data: Partial<ClassModel>) => void;
  deleteClass: (id: string) => void;

  // Student actions
  createStudent: (data: {
    studentId: string;
    fullName: string;
    baptismalName?: string;
    gender: "male" | "female";
    dateOfBirth?: string;
    address?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    status?: StudentStatus;
    classId: string;
  }) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  moveStudentClass: (studentId: string, newClassId: string) => void;
  deleteStudent: (id: string) => void;

  // Course actions
  createCourse: (data: {
    name: string;
    code?: string;
    classId: string;
    teacherId?: string;
  }) => Course;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  // Assessment actions
  saveCourseAssessments: (
    courseId: string,
    items: Array<{
      id?: string;
      name: string;
      assessment_type: AssessmentType;
      max_score: number;
      weight_percentage: number;
    }>
  ) => void;
  deleteAssessment: (id: string) => void;

  // Results actions
  saveAssessmentResults: (
    assessmentId: string,
    entries: Array<{ studentId: string; score: number; remarks?: string }>
  ) => void;

  // Attendance actions
  saveDailyAttendance: (
    classId: string,
    date: string,
    records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>
  ) => void;

  // Calculated views
  getClassRoster: (classId: string) => ClassRosterEntry[];
  getDashboardStats: () => DashboardStats;
  resetToSampleData: () => void;
}

const SenbetContext = createContext<SenbetContextType | null>(null);

const STORAGE_KEY = "senbet_school_storage_v1";

export function SenbetProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(INITIAL_PROFILE);
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const [isOwner, setIsOwner] = useState<boolean>(true);
  const [schoolUsers, setSchoolUsers] = useState<UserAccount[]>(INITIAL_USERS);

  const [schools, setSchools] = useState<School[]>([INITIAL_SCHOOL]);
  const [school, setSchool] = useState<School | null>(INITIAL_SCHOOL);

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(INITIAL_ACADEMIC_YEARS);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(
    INITIAL_ACADEMIC_YEARS[0]
  );

  const [classes, setClasses] = useState<ClassModel[]>(INITIAL_CLASSES);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>(INITIAL_ENROLLMENTS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [assessments, setAssessments] = useState<CourseAssessment[]>(INITIAL_ASSESSMENTS);
  const [results, setResults] = useState<AssessmentResult[]>(INITIAL_RESULTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);

  // Initialize from LocalStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) setUser(parsed.user);
        if (parsed.currentRole) setCurrentRole(parsed.currentRole);
        if (typeof parsed.isOwner === "boolean") setIsOwner(parsed.isOwner);
        if (parsed.schoolUsers?.length) setSchoolUsers(parsed.schoolUsers);
        if (parsed.schools?.length) setSchools(parsed.schools);
        if (parsed.school) setSchool(parsed.school);
        if (parsed.academicYears?.length) setAcademicYears(parsed.academicYears);
        if (parsed.currentAcademicYear) setCurrentAcademicYear(parsed.currentAcademicYear);
        if (parsed.classes) setClasses(parsed.classes);
        if (parsed.students) setStudents(parsed.students);
        if (parsed.enrollments) setEnrollments(parsed.enrollments);
        if (parsed.courses) setCourses(parsed.courses);
        if (parsed.assessments) setAssessments(parsed.assessments);
        if (parsed.results) setResults(parsed.results);
        if (parsed.attendance) setAttendance(parsed.attendance);
      }
    } catch (e) {
      console.warn("Failed to load local storage state:", e);
    }
  }, []);

  // Save to LocalStorage on state change
  const persistState = (customState?: Record<string, unknown>) => {
    try {
      const stateToSave = {
        user,
        currentRole,
        isOwner,
        schoolUsers,
        schools,
        school,
        academicYears,
        currentAcademicYear,
        classes,
        students,
        enrollments,
        courses,
        assessments,
        results,
        attendance,
        ...customState,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("Failed to persist state:", e);
    }
  };

  // Auth & Roles
  const login = async (email: string, _pass: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const foundUser = schoolUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    let prof: Profile;
    let roleToAssign: UserRole = "admin";
    let ownerFlag = true;

    if (foundUser) {
      prof = {
        id: foundUser.id,
        email: foundUser.email,
        full_name: foundUser.full_name,
        created_at: foundUser.created_at,
      };
      roleToAssign = foundUser.role;
      ownerFlag = foundUser.is_owner;
    } else {
      prof = {
        id: "usr-" + Date.now(),
        email: email.trim(),
        full_name: email.split("@")[0].toUpperCase() + " (User)",
        created_at: new Date().toISOString(),
      };
      if (cleanEmail.includes("teacher")) {
        roleToAssign = "teacher";
        ownerFlag = false;
      } else if (cleanEmail.includes("student")) {
        roleToAssign = "student";
        ownerFlag = false;
      } else if (cleanEmail.includes("staff")) {
        roleToAssign = "staff";
        ownerFlag = false;
      } else {
        roleToAssign = "admin";
        ownerFlag = true;
      }
    }

    setUser(prof);
    setCurrentRole(roleToAssign);
    setIsOwner(ownerFlag);
    persistState({ user: prof, currentRole: roleToAssign, isOwner: ownerFlag });
    return true;
  };

  const register = async (
    email: string,
    _pass: string,
    fullName: string,
    schoolData?: {
      name: string;
      parishName: string;
      code?: string;
      phone?: string;
      address?: string;
    }
  ): Promise<boolean> => {
    const prof: Profile = {
      id: "usr-" + Date.now(),
      email: email.trim(),
      full_name: fullName.trim(),
      created_at: new Date().toISOString(),
    };

    let newSchool = school;
    let updatedSchools = schools;
    let newYear = currentAcademicYear;
    let updatedYears = academicYears;

    // If schoolData is provided, establish the Senbet School immediately!
    if (schoolData && schoolData.name.trim()) {
      newSchool = {
        id: "sch-" + Date.now(),
        name: schoolData.name.trim(),
        code: schoolData.code || "SCH-" + Math.floor(1000 + Math.random() * 9000),
        parish_name: schoolData.parishName.trim() || schoolData.name.trim(),
        phone: schoolData.phone,
        email: email.trim(),
        address: schoolData.address,
        created_at: new Date().toISOString(),
      };

      newYear = {
        id: "ay-" + Date.now(),
        school_id: newSchool.id,
        name: "2017 ዓ.ም",
        is_active: true,
        created_at: new Date().toISOString(),
      };

      updatedSchools = [newSchool, ...schools.filter((s) => s.id !== newSchool?.id)];
      updatedYears = [newYear, ...academicYears.filter((y) => y.id !== newYear?.id)];

      setSchools(updatedSchools);
      setSchool(newSchool);
      setAcademicYears(updatedYears);
      setCurrentAcademicYear(newYear);
    }

    // The user who created the school is registered as Owner/Admin
    const newAdminUser: UserAccount = {
      id: prof.id,
      school_id: newSchool ? newSchool.id : "sch-default",
      email: prof.email || "",
      full_name: prof.full_name,
      role: "admin",
      is_owner: true,
      created_at: new Date().toISOString(),
    };

    const updatedUsers = [newAdminUser, ...schoolUsers.filter((u) => u.email !== email)];
    setSchoolUsers(updatedUsers);
    setUser(prof);
    setCurrentRole("admin");
    setIsOwner(true);

    persistState({
      user: prof,
      currentRole: "admin",
      isOwner: true,
      schoolUsers: updatedUsers,
      schools: updatedSchools,
      school: newSchool,
      academicYears: updatedYears,
      currentAcademicYear: newYear,
    });
    return true;
  };

  const logout = () => {
    setUser(null);
    persistState({ user: null });
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    persistState({ currentRole: role });
  };

  // School Users (Subordinate to Admin)
  const createSchoolUser = (data: {
    email: string;
    fullName: string;
    role: UserRole;
    phone?: string;
  }): UserAccount => {
    const newUser: UserAccount = {
      id: "usr-" + Date.now(),
      school_id: school?.id || "sch-default",
      email: data.email.trim(),
      full_name: data.fullName.trim(),
      role: data.role,
      is_owner: false, // New created users are below the Admin/Owner level
      phone: data.phone,
      created_at: new Date().toISOString(),
    };
    const updated = [newUser, ...schoolUsers];
    setSchoolUsers(updated);
    persistState({ schoolUsers: updated });
    return newUser;
  };

  const deleteSchoolUser = (id: string) => {
    const updated = schoolUsers.filter((u) => u.id !== id);
    setSchoolUsers(updated);
    persistState({ schoolUsers: updated });
  };

  // Schools
  const createSchool = async (data: {
    name: string;
    parishName: string;
    code?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<School> => {
    const newSchool: School = {
      id: "sch-" + Date.now(),
      name: data.name,
      code: data.code || "SCH-" + Math.floor(1000 + Math.random() * 9000),
      parish_name: data.parishName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      created_at: new Date().toISOString(),
    };

    const newYear: AcademicYear = {
      id: "ay-" + Date.now(),
      school_id: newSchool.id,
      name: "2017 ዓ.ም",
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const updatedSchools = [...schools, newSchool];
    const updatedYears = [...academicYears, newYear];

    setSchools(updatedSchools);
    setSchool(newSchool);
    setAcademicYears(updatedYears);
    setCurrentAcademicYear(newYear);

    persistState({
      schools: updatedSchools,
      school: newSchool,
      academicYears: updatedYears,
      currentAcademicYear: newYear,
    });

    return newSchool;
  };

  const switchSchool = (schoolId: string) => {
    const target = schools.find((s) => s.id === schoolId) || null;
    setSchool(target);
    persistState({ school: target });
  };

  // Academic Years
  const createAcademicYear = (data: { name: string; startDate?: string; endDate?: string }) => {
    if (!school) return;
    const newYear: AcademicYear = {
      id: "ay-" + Date.now(),
      school_id: school.id,
      name: data.name,
      is_active: true,
      start_date: data.startDate,
      end_date: data.endDate,
      created_at: new Date().toISOString(),
    };
    const updated = [newYear, ...academicYears];
    setAcademicYears(updated);
    setCurrentAcademicYear(newYear);
    persistState({ academicYears: updated, currentAcademicYear: newYear });
  };

  const switchAcademicYear = (yearId: string) => {
    const target = academicYears.find((y) => y.id === yearId) || null;
    setCurrentAcademicYear(target);
    persistState({ currentAcademicYear: target });
  };

  // Classes
  const createClass = (data: {
    name: string;
    levelCategory?: string;
    roomNumber?: string;
  }): ClassModel => {
    if (!school || !currentAcademicYear) throw new Error("Missing school context");
    const newClass: ClassModel = {
      id: "cls-" + Date.now(),
      school_id: school.id,
      academic_year_id: currentAcademicYear.id,
      name: data.name,
      level_category: data.levelCategory || "General",
      room_number: data.roomNumber,
      created_at: new Date().toISOString(),
    };
    const updated = [...classes, newClass];
    setClasses(updated);
    persistState({ classes: updated });
    return newClass;
  };

  const updateClass = (id: string, data: Partial<ClassModel>) => {
    const updated = classes.map((c) => (c.id === id ? { ...c, ...data } : c));
    setClasses(updated);
    persistState({ classes: updated });
  };

  const deleteClass = (id: string) => {
    const updated = classes.filter((c) => c.id !== id);
    setClasses(updated);
    persistState({ classes: updated });
  };

  // Students
  const createStudent = (data: {
    studentId: string;
    fullName: string;
    baptismalName?: string;
    gender: "male" | "female";
    dateOfBirth?: string;
    address?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    status?: StudentStatus;
    classId: string;
  }): Student => {
    if (!school || !currentAcademicYear) throw new Error("Missing school context");

    const newStudent: Student = {
      id: "stu-" + Date.now(),
      school_id: school.id,
      student_id: data.studentId.trim(),
      full_name: data.fullName.trim(),
      baptismal_name: data.baptismalName?.trim(),
      gender: data.gender,
      date_of_birth: data.dateOfBirth,
      address: data.address?.trim(),
      parent_name: data.parentName?.trim(),
      parent_phone: data.parentPhone?.trim(),
      parent_email: data.parentEmail?.trim(),
      status: data.status || "active",
      created_at: new Date().toISOString(),
    };

    const newEnrollment: StudentEnrollment = {
      id: "enr-" + Date.now(),
      school_id: school.id,
      class_id: data.classId,
      student_id: newStudent.id,
      academic_year_id: currentAcademicYear.id,
      roll_number: enrollments.filter((e) => e.class_id === data.classId).length + 1,
      enrollment_status: "enrolled",
      created_at: new Date().toISOString(),
    };

    const updatedStudents = [...students, newStudent];
    const updatedEnrollments = [...enrollments, newEnrollment];

    setStudents(updatedStudents);
    setEnrollments(updatedEnrollments);
    persistState({ students: updatedStudents, enrollments: updatedEnrollments });

    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    const updated = students.map((s) => (s.id === id ? { ...s, ...data } : s));
    setStudents(updated);
    persistState({ students: updated });
  };

  const moveStudentClass = (studentId: string, newClassId: string) => {
    if (!school || !currentAcademicYear) return;
    const existing = enrollments.find((e) => e.student_id === studentId);
    let updatedEnrollments: StudentEnrollment[];

    if (existing) {
      updatedEnrollments = enrollments.map((e) =>
        e.student_id === studentId ? { ...e, class_id: newClassId } : e
      );
    } else {
      updatedEnrollments = [
        ...enrollments,
        {
          id: "enr-" + Date.now(),
          school_id: school.id,
          class_id: newClassId,
          student_id: studentId,
          academic_year_id: currentAcademicYear.id,
          enrollment_status: "enrolled",
          created_at: new Date().toISOString(),
        },
      ];
    }
    setEnrollments(updatedEnrollments);
    persistState({ enrollments: updatedEnrollments });
  };

  const deleteStudent = (id: string) => {
    const updatedStudents = students.filter((s) => s.id !== id);
    const updatedEnrollments = enrollments.filter((e) => e.student_id !== id);
    const updatedResults = results.filter((r) => r.student_id !== id);
    const updatedAttendance = attendance.filter((a) => a.student_id !== id);

    setStudents(updatedStudents);
    setEnrollments(updatedEnrollments);
    setResults(updatedResults);
    setAttendance(updatedAttendance);

    persistState({
      students: updatedStudents,
      enrollments: updatedEnrollments,
      results: updatedResults,
      attendance: updatedAttendance,
    });
  };

  // Courses
  const createCourse = (data: {
    name: string;
    code?: string;
    classId: string;
    teacherId?: string;
  }): Course => {
    if (!school || !currentAcademicYear) throw new Error("Missing school context");
    const newCourse: Course = {
      id: "crs-" + Date.now(),
      school_id: school.id,
      class_id: data.classId,
      academic_year_id: currentAcademicYear.id,
      name: data.name,
      code: data.code,
      teacher_id: data.teacherId,
      created_at: new Date().toISOString(),
    };
    const updated = [...courses, newCourse];
    setCourses(updated);
    persistState({ courses: updated });
    return newCourse;
  };

  const updateCourse = (id: string, data: Partial<Course>) => {
    const updated = courses.map((c) => (c.id === id ? { ...c, ...data } : c));
    setCourses(updated);
    persistState({ courses: updated });
  };

  const deleteCourse = (id: string) => {
    const updatedCourses = courses.filter((c) => c.id !== id);
    const courseAssessments = assessments.filter((a) => a.course_id === id).map((a) => a.id);
    const updatedAssessments = assessments.filter((a) => a.course_id !== id);
    const updatedResults = results.filter((r) => !courseAssessments.includes(r.assessment_id));

    setCourses(updatedCourses);
    setAssessments(updatedAssessments);
    setResults(updatedResults);
    persistState({
      courses: updatedCourses,
      assessments: updatedAssessments,
      results: updatedResults,
    });
  };

  // Assessments
  const saveCourseAssessments = (
    courseId: string,
    items: Array<{
      id?: string;
      name: string;
      assessment_type: AssessmentType;
      max_score: number;
      weight_percentage: number;
    }>
  ) => {
    if (!school) return;
    const existingOther = assessments.filter((a) => a.course_id !== courseId);
    const newItems: CourseAssessment[] = items.map((it) => ({
      id: it.id || "asm-" + Math.random().toString(36).substring(2, 9),
      school_id: school.id,
      course_id: courseId,
      name: it.name,
      assessment_type: it.assessment_type,
      max_score: Number(it.max_score),
      weight_percentage: Number(it.weight_percentage),
      created_at: new Date().toISOString(),
    }));

    const updated = [...existingOther, ...newItems];
    setAssessments(updated);
    persistState({ assessments: updated });
  };

  const deleteAssessment = (id: string) => {
    const updatedAssessments = assessments.filter((a) => a.id !== id);
    const updatedResults = results.filter((r) => r.assessment_id !== id);
    setAssessments(updatedAssessments);
    setResults(updatedResults);
    persistState({ assessments: updatedAssessments, results: updatedResults });
  };

  // Results
  const saveAssessmentResults = (
    assessmentId: string,
    entries: Array<{ studentId: string; score: number; remarks?: string }>
  ) => {
    if (!school) return;
    const filtered = results.filter((r) => r.assessment_id !== assessmentId);
    const newResults: AssessmentResult[] = entries.map((en) => ({
      id: "res-" + Math.random().toString(36).substring(2, 9),
      school_id: school.id,
      assessment_id: assessmentId,
      student_id: en.studentId,
      score: Number(en.score),
      remarks: en.remarks,
      created_at: new Date().toISOString(),
    }));

    const updated = [...filtered, ...newResults];
    setResults(updated);
    persistState({ results: updated });
  };

  // Attendance
  const saveDailyAttendance = (
    classId: string,
    date: string,
    records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>
  ) => {
    if (!school) return;
    const otherDays = attendance.filter((a) => !(a.class_id === classId && a.date === date));
    const newRecords: AttendanceRecord[] = records.map((r) => ({
      id: "att-" + Math.random().toString(36).substring(2, 9),
      school_id: school.id,
      class_id: classId,
      student_id: r.studentId,
      date,
      status: r.status,
      remarks: r.remarks,
      created_at: new Date().toISOString(),
    }));

    const updated = [...otherDays, ...newRecords];
    setAttendance(updated);
    persistState({ attendance: updated });
  };

  // Compute Class Roster with Deterministic Ranking
  const getClassRoster = (classId: string): ClassRosterEntry[] => {
    const classEnrollments = enrollments.filter((e) => e.class_id === classId);
    const enrolledStudentIds = new Set(classEnrollments.map((e) => e.student_id));
    const enrolledStudents = students.filter((s) => enrolledStudentIds.has(s.id));
    const classCourses = courses.filter((c) => c.class_id === classId);

    return calculateDeterministicRoster(
      enrolledStudents,
      classEnrollments,
      classCourses,
      assessments,
      results,
      attendance,
      classId
    );
  };

  // Dashboard Stats
  const getDashboardStats = (): DashboardStats => {
    const today = getTodayDateString();
    const todayRecords = attendance.filter((a) => a.date === today);
    const todayMetrics = calculateAttendanceMetrics(todayRecords);

    const classSummary = classes.map((c) => {
      const roster = getClassRoster(c.id);
      const studentCount = roster.length;
      const averageScore =
        studentCount > 0
          ? Math.round(roster.reduce((sum, item) => sum + item.overallAverage, 0) / studentCount)
          : 0;

      const attRecords = attendance.filter((a) => a.class_id === c.id);
      const attMetrics = calculateAttendanceMetrics(attRecords);

      return {
        classId: c.id,
        className: c.name,
        studentCount,
        averageScore,
        attendanceRate: attMetrics.rate,
      };
    });

    return {
      totalStudents: students.length,
      totalClasses: classes.length,
      totalCourses: courses.length,
      todayAttendance: {
        totalMarked: todayMetrics.totalDays,
        present: todayMetrics.present,
        absent: todayMetrics.absent,
        late: todayMetrics.late,
        permission: todayMetrics.permission,
        rate: todayMetrics.rate,
      },
      recentResultsCount: results.length,
      classSummary,
    };
  };

  const resetToSampleData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(INITIAL_PROFILE);
    setCurrentRole("admin");
    setIsOwner(true);
    setSchools([INITIAL_SCHOOL]);
    setSchool(INITIAL_SCHOOL);
    setAcademicYears(INITIAL_ACADEMIC_YEARS);
    setCurrentAcademicYear(INITIAL_ACADEMIC_YEARS[0]);
    setClasses(INITIAL_CLASSES);
    setStudents(INITIAL_STUDENTS);
    setEnrollments(INITIAL_ENROLLMENTS);
    setCourses(INITIAL_COURSES);
    setAssessments(INITIAL_ASSESSMENTS);
    setResults(INITIAL_RESULTS);
    setAttendance(INITIAL_ATTENDANCE);
    setSchoolUsers(INITIAL_USERS);
  };

  return (
    <SenbetContext.Provider
      value={{
        user,
        currentRole,
        isOwner,
        schoolUsers,
        createSchoolUser,
        deleteSchoolUser,
        login,
        register,
        logout,
        switchRole,
        school,
        schools,
        createSchool,
        switchSchool,
        academicYears,
        currentAcademicYear,
        createAcademicYear,
        switchAcademicYear,
        classes,
        students,
        enrollments,
        courses,
        assessments,
        results,
        attendance,
        createClass,
        updateClass,
        deleteClass,
        createStudent,
        updateStudent,
        moveStudentClass,
        deleteStudent,
        createCourse,
        updateCourse,
        deleteCourse,
        saveCourseAssessments,
        deleteAssessment,
        saveAssessmentResults,
        saveDailyAttendance,
        getClassRoster,
        getDashboardStats,
        resetToSampleData,
      }}
    >
      {children}
    </SenbetContext.Provider>
  );
}

export function useSenbet() {
  const context = useContext(SenbetContext);
  if (!context) {
    throw new Error("useSenbet must be used within a SenbetProvider");
  }
  return context;
}
