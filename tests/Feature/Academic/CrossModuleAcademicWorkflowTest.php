<?php

namespace Tests\Feature\Academic;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentResult;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Member;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\SessionStudentRecord;
use App\Models\StudentEnrollment;
use App\Models\TeachingAssignment;
use App\Models\User;
use App\Services\GradebookService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossModuleAcademicWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_end_to_end_cross_module_lifecycle(): void
    {
        // 1. Roles & Actors
        $superRole = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $teacherRole = Role::create(['name' => 'teacher', 'guard_name' => 'web']);

        $superadmin = User::factory()->create(['role_id' => $superRole->id]);
        $superadmin->syncRoles(['superadmin']);

        $teacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $teacher->syncRoles(['teacher']);

        // 2. Academic Year
        $year = AcademicYear::create([
            'name' => ['en' => '2018 E.C.'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        // 3. Class (Passing Score = 50.00%)
        $class = SchoolClass::create([
            'name' => ['en' => 'Grade 10'],
            'code' => 'G10',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        // 4. Courses
        $bible = Course::create([
            'name' => ['en' => 'Bible Study'],
            'code' => 'BIB201',
            'credit_hour' => 2,
            'class_id' => $class->id,
        ]);

        $history = Course::create([
            'name' => ['en' => 'Church History'],
            'code' => 'HIS201',
            'credit_hour' => 1,
            'class_id' => $class->id,
        ]);

        // 5. Teaching Assignments (Section A & Section B)
        $asBibleA = TeachingAssignment::create([
            'teacher_id' => $teacher->id, 'course_id' => $bible->id, 'academic_year_id' => $year->id,
            'class_id' => $class->id, 'section' => 'A', 'semester' => 'semester_1', 'is_primary' => true,
        ]);
        $asHistoryA = TeachingAssignment::create([
            'teacher_id' => $teacher->id, 'course_id' => $history->id, 'academic_year_id' => $year->id,
            'class_id' => $class->id, 'section' => 'A', 'semester' => 'semester_1', 'is_primary' => true,
        ]);

        $asBibleB = TeachingAssignment::create([
            'teacher_id' => $teacher->id, 'course_id' => $bible->id, 'academic_year_id' => $year->id,
            'class_id' => $class->id, 'section' => 'B', 'semester' => 'semester_1', 'is_primary' => true,
        ]);
        $asHistoryB = TeachingAssignment::create([
            'teacher_id' => $teacher->id, 'course_id' => $history->id, 'academic_year_id' => $year->id,
            'class_id' => $class->id, 'section' => 'B', 'semester' => 'semester_1', 'is_primary' => true,
        ]);

        // 6. Assessments (Weights: 20% + 80% = 100% and 40% + 60% = 100%)
        $bibleA_Quiz = Assessment::create(['teaching_assignment_id' => $asBibleA->id, 'name' => ['en' => 'Quiz'], 'total_score' => 20, 'weight_percentage' => 20]);
        $bibleA_Final = Assessment::create(['teaching_assignment_id' => $asBibleA->id, 'name' => ['en' => 'Final'], 'total_score' => 80, 'weight_percentage' => 80]);
        $histA_Mid = Assessment::create(['teaching_assignment_id' => $asHistoryA->id, 'name' => ['en' => 'Midterm'], 'total_score' => 40, 'weight_percentage' => 40]);
        $histA_Final = Assessment::create(['teaching_assignment_id' => $asHistoryA->id, 'name' => ['en' => 'Final'], 'total_score' => 60, 'weight_percentage' => 60]);

        $bibleB_Quiz = Assessment::create(['teaching_assignment_id' => $asBibleB->id, 'name' => ['en' => 'Quiz'], 'total_score' => 20, 'weight_percentage' => 20]);
        $bibleB_Final = Assessment::create(['teaching_assignment_id' => $asBibleB->id, 'name' => ['en' => 'Final'], 'total_score' => 80, 'weight_percentage' => 80]);
        $histB_Mid = Assessment::create(['teaching_assignment_id' => $asHistoryB->id, 'name' => ['en' => 'Midterm'], 'total_score' => 40, 'weight_percentage' => 40]);
        $histB_Final = Assessment::create(['teaching_assignment_id' => $asHistoryB->id, 'name' => ['en' => 'Final'], 'total_score' => 60, 'weight_percentage' => 60]);

        // 7. Students & Enrollments
        // Section A
        $studentA1 = Member::create(['full_name' => ['en' => 'Abebe (A1)'], 'date_of_birth' => '2010-01-01', 'gender' => 'male', 'class_id' => $class->id, 'section' => 'A']);
        StudentEnrollment::create(['member_id' => $studentA1->id, 'academic_year_id' => $year->id, 'class_id' => $class->id, 'section' => 'A', 'start_date' => '2025-09-01']);

        $studentA2 = Member::create(['full_name' => ['en' => 'Almaz (A2)'], 'date_of_birth' => '2010-02-01', 'gender' => 'female', 'class_id' => $class->id, 'section' => 'A']);
        StudentEnrollment::create(['member_id' => $studentA2->id, 'academic_year_id' => $year->id, 'class_id' => $class->id, 'section' => 'A', 'start_date' => '2025-09-01']);

        // Section B
        $studentB1 = Member::create(['full_name' => ['en' => 'Bekele (B1)'], 'date_of_birth' => '2010-03-01', 'gender' => 'male', 'class_id' => $class->id, 'section' => 'B']);
        StudentEnrollment::create(['member_id' => $studentB1->id, 'academic_year_id' => $year->id, 'class_id' => $class->id, 'section' => 'B', 'start_date' => '2025-09-01']);

        $studentB2 = Member::create(['full_name' => ['en' => 'Birhanu (B2)'], 'date_of_birth' => '2010-04-01', 'gender' => 'male', 'class_id' => $class->id, 'section' => 'B']);
        StudentEnrollment::create(['member_id' => $studentB2->id, 'academic_year_id' => $year->id, 'class_id' => $class->id, 'section' => 'B', 'start_date' => '2025-09-01']);

        $studentB3 = Member::create(['full_name' => ['en' => 'Blen (B3 - Incomplete)'], 'date_of_birth' => '2010-05-01', 'gender' => 'female', 'class_id' => $class->id, 'section' => 'B']);
        StudentEnrollment::create(['member_id' => $studentB3->id, 'academic_year_id' => $year->id, 'class_id' => $class->id, 'section' => 'B', 'start_date' => '2025-09-01']);

        // 8. Result Entry
        // Student A1: 90% Bible, 90% History -> Avg = 90.00%
        AssessmentResult::create(['assessment_id' => $bibleA_Quiz->id, 'member_id' => $studentA1->id, 'score' => 18]);
        AssessmentResult::create(['assessment_id' => $bibleA_Final->id, 'member_id' => $studentA1->id, 'score' => 72]);
        AssessmentResult::create(['assessment_id' => $histA_Mid->id, 'member_id' => $studentA1->id, 'score' => 36]);
        AssessmentResult::create(['assessment_id' => $histA_Final->id, 'member_id' => $studentA1->id, 'score' => 54]);

        // Student A2: 80% Bible, 80% History -> Avg = 80.00%
        AssessmentResult::create(['assessment_id' => $bibleA_Quiz->id, 'member_id' => $studentA2->id, 'score' => 16]);
        AssessmentResult::create(['assessment_id' => $bibleA_Final->id, 'member_id' => $studentA2->id, 'score' => 64]);
        AssessmentResult::create(['assessment_id' => $histA_Mid->id, 'member_id' => $studentA2->id, 'score' => 32]);
        AssessmentResult::create(['assessment_id' => $histA_Final->id, 'member_id' => $studentA2->id, 'score' => 48]);

        // Student B1: 90% Bible, 90% History -> Avg = 90.00% (Tied with A1)
        AssessmentResult::create(['assessment_id' => $bibleB_Quiz->id, 'member_id' => $studentB1->id, 'score' => 18]);
        AssessmentResult::create(['assessment_id' => $bibleB_Final->id, 'member_id' => $studentB1->id, 'score' => 72]);
        AssessmentResult::create(['assessment_id' => $histB_Mid->id, 'member_id' => $studentB1->id, 'score' => 36]);
        AssessmentResult::create(['assessment_id' => $histB_Final->id, 'member_id' => $studentB1->id, 'score' => 54]);

        // Student B2 (Failing): 40% Bible, 40% History -> Avg = 40.00% (FAIL)
        AssessmentResult::create(['assessment_id' => $bibleB_Quiz->id, 'member_id' => $studentB2->id, 'score' => 8]);
        AssessmentResult::create(['assessment_id' => $bibleB_Final->id, 'member_id' => $studentB2->id, 'score' => 32]);
        AssessmentResult::create(['assessment_id' => $histB_Mid->id, 'member_id' => $studentB2->id, 'score' => 16]);
        AssessmentResult::create(['assessment_id' => $histB_Final->id, 'member_id' => $studentB2->id, 'score' => 24]);

        // Student B3 (Incomplete): only entered quizzes, missing finals!
        AssessmentResult::create(['assessment_id' => $bibleB_Quiz->id, 'member_id' => $studentB3->id, 'score' => 20]);
        AssessmentResult::create(['assessment_id' => $histB_Mid->id, 'member_id' => $studentB3->id, 'score' => 40]);

        // 9. Attendance Session & Records
        $session = AttendanceSession::create([
            'academic_year_id' => $year->id,
            'term_id' => 1,
            'class_id' => $class->id,
            'course_id' => null, // Homeroom
            'date' => '2025-10-05',
            'time_slot' => 'morning',
            'status' => 'closed',
            'submitted_by' => $teacher->id,
            'submitted_at' => now(),
            'closed_at' => now(),
        ]);

        SessionStudentRecord::create(['attendance_session_id' => $session->id, 'student_id' => $studentA1->id, 'mark' => 'present', 'marked_by' => $teacher->id, 'marked_at' => now()]);
        SessionStudentRecord::create(['attendance_session_id' => $session->id, 'student_id' => $studentB2->id, 'mark' => 'absent', 'marked_by' => $teacher->id, 'marked_at' => now()]);

        // 10. Gradebook Calculation & Rankings Verification
        $service = app(GradebookService::class);
        $gradebook = $service->generateClassGradebook($class->id, $year->id, 'semester_1');

        $this->assertEquals(5, $gradebook['total_students']);

        $studentsById = collect($gradebook['students'])->keyBy('student.id');

        // Student A1
        $resA1 = $studentsById->get($studentA1->id);
        $this->assertEquals(90.00, $resA1['summary']['overall_average']);
        $this->assertEquals('PASS', $resA1['summary']['status']);
        $this->assertEquals(1, $resA1['summary']['section_rank']); // 1st in Sec A
        $this->assertEquals(1, $resA1['summary']['class_rank']);   // Tied 1st class-wide
        $this->assertEquals(100.00, $resA1['attendance']['attendance_rate']);
        $this->assertEquals(0.00, $resA1['attendance']['score_adjustment']);

        // Student A2
        $resA2 = $studentsById->get($studentA2->id);
        $this->assertEquals(80.00, $resA2['summary']['overall_average']);
        $this->assertEquals('PASS', $resA2['summary']['status']);
        $this->assertEquals(2, $resA2['summary']['section_rank']); // 2nd in Sec A
        $this->assertEquals(3, $resA2['summary']['class_rank']);   // 3rd class-wide (1224: rank 2 skipped due to tie!)

        // Student B1
        $resB1 = $studentsById->get($studentB1->id);
        $this->assertEquals(90.00, $resB1['summary']['overall_average']);
        $this->assertEquals('PASS', $resB1['summary']['status']);
        $this->assertEquals(1, $resB1['summary']['section_rank']); // 1st in Sec B
        $this->assertEquals(1, $resB1['summary']['class_rank']);   // Tied 1st class-wide

        // Student B2
        $resB2 = $studentsById->get($studentB2->id);
        $this->assertEquals(40.00, $resB2['summary']['overall_average']);
        $this->assertEquals('FAIL', $resB2['summary']['status']);
        $this->assertEquals(2, $resB2['summary']['section_rank']); // 2nd in Sec B (B3 is incomplete)
        $this->assertEquals(4, $resB2['summary']['class_rank']);   // 4th class-wide
        $this->assertEquals(0.00, $resB2['attendance']['attendance_rate']);

        // Student B3 (Incomplete)
        $resB3 = $studentsById->get($studentB3->id);
        $this->assertTrue($resB3['summary']['is_incomplete']);
        $this->assertEquals('INCOMPLETE', $resB3['summary']['status']);
        $this->assertNull($resB3['summary']['section_rank']);
        $this->assertNull($resB3['summary']['class_rank']);

        // 11. API Verification through Superadmin
        $this->actingAs($superadmin, 'sanctum')
            ->getJson("/api/report-cards/student/{$studentA1->id}?academic_year_id={$year->id}&semester=semester_1")
            ->assertOk()
            ->assertJsonPath('data.summary.status', 'PASS')
            ->assertJsonPath('data.summary.overall_average', 90);
    }
}
