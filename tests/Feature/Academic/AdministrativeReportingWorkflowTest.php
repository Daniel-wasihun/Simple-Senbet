<?php

namespace Tests\Feature\Academic;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentResult;
use App\Models\Course;
use App\Models\Member;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\TeachingAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdministrativeReportingWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;

    private User $director;

    private User $assignedTeacherA;

    private User $unassignedTeacher;

    private AcademicYear $year;

    private SchoolClass $class;

    private Course $course;

    private TeachingAssignment $assignmentA;

    private TeachingAssignment $assignmentB;

    private Member $studentA1;

    private Member $studentA2;

    private Member $studentB1;

    protected function setUp(): void
    {
        parent::setUp();

        $superRole = Role::create(['name' => 'superadmin', 'guard_name' => 'web']);
        $directorRole = Role::create(['name' => 'academic_director', 'guard_name' => 'web']);
        $teacherRole = Role::create(['name' => 'teacher', 'guard_name' => 'web']);

        $this->superadmin = User::factory()->create(['role_id' => $superRole->id]);
        $this->superadmin->syncRoles(['superadmin']);

        $this->director = User::factory()->create(['role_id' => $directorRole->id]);
        $this->director->syncRoles(['academic_director']);

        $this->assignedTeacherA = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->assignedTeacherA->syncRoles(['teacher']);

        $this->unassignedTeacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->unassignedTeacher->syncRoles(['teacher']);

        $this->year = AcademicYear::create([
            'name' => ['en' => '2018 E.C.', 'am' => '፳፻፲፰ ዓ.ም.'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $this->class = SchoolClass::create([
            'name' => ['en' => 'Grade 10', 'am' => '፲ኛ ክፍል'],
            'code' => 'G10',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->course = Course::create([
            'name' => ['en' => 'Church History', 'am' => 'የቤተክርስቲያን ታሪክ'],
            'code' => 'HIS101',
            'credit_hour' => 1,
            'class_id' => $this->class->id,
        ]);

        $this->assignmentA = TeachingAssignment::create([
            'teacher_id' => $this->assignedTeacherA->id,
            'course_id' => $this->course->id,
            'academic_year_id' => $this->year->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'semester' => 'semester_1',
            'is_primary' => true,
        ]);

        $this->assignmentB = TeachingAssignment::create([
            'teacher_id' => $this->assignedTeacherA->id,
            'course_id' => $this->course->id,
            'academic_year_id' => $this->year->id,
            'class_id' => $this->class->id,
            'section' => 'B',
            'semester' => 'semester_1',
            'is_primary' => false,
        ]);

        $assessmentA = Assessment::create([
            'teaching_assignment_id' => $this->assignmentA->id,
            'name' => ['en' => 'Final Exam'],
            'total_score' => 100.00,
            'weight_percentage' => 100.00,
        ]);

        $assessmentB = Assessment::create([
            'teaching_assignment_id' => $this->assignmentB->id,
            'name' => ['en' => 'Final Exam'],
            'total_score' => 100.00,
            'weight_percentage' => 100.00,
        ]);

        // Student A1: Section A, Top Score (90%)
        $this->studentA1 = Member::create([
            'full_name' => ['en' => 'Abel Tesfaye', 'am' => 'አቤል ተስፋዬ'],
            'date_of_birth' => '2009-01-01',
            'gender' => 'male',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);
        StudentEnrollment::create([
            'member_id' => $this->studentA1->id,
            'academic_year_id' => $this->year->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
        ]);
        AssessmentResult::create([
            'assessment_id' => $assessmentA->id,
            'member_id' => $this->studentA1->id,
            'score' => 90.00,
        ]);

        // Student A2: Section A, Incomplete Assessment (No result)
        $this->studentA2 = Member::create([
            'full_name' => ['en' => 'Bethlehem Girma', 'am' => 'ቤተልሔም ግርማ'],
            'date_of_birth' => '2009-05-15',
            'gender' => 'female',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);
        StudentEnrollment::create([
            'member_id' => $this->studentA2->id,
            'academic_year_id' => $this->year->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
        ]);

        // Student B1: Section B, Score 85%
        $this->studentB1 = Member::create([
            'full_name' => ['en' => 'Chala Tadesse', 'am' => 'ጫላ ታደሰ'],
            'date_of_birth' => '2009-03-20',
            'gender' => 'male',
            'class_id' => $this->class->id,
            'section' => 'B',
        ]);
        StudentEnrollment::create([
            'member_id' => $this->studentB1->id,
            'academic_year_id' => $this->year->id,
            'class_id' => $this->class->id,
            'section' => 'B',
            'start_date' => '2025-09-01',
        ]);
        AssessmentResult::create([
            'assessment_id' => $assessmentB->id,
            'member_id' => $this->studentB1->id,
            'score' => 85.00,
        ]);
    }

    public function test_end_to_end_administrative_gradebook_and_section_filtering(): void
    {
        // 1. Whole Class cohort retrieval
        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/report-cards/class/{$this->class->id}?academic_year_id={$this->year->id}&semester=semester_1");

        $response->assertStatus(200);
        $response->assertJsonPath('data.total_students', 3);

        $students = $response->json('data.students');
        $this->assertCount(3, $students);

        // Verify Student A1 has class_rank #1 and PASS
        $a1Data = collect($students)->firstWhere('student.id', $this->studentA1->id);
        $this->assertNotNull($a1Data);
        $this->assertEquals(1, $a1Data['summary']['class_rank']);
        $this->assertEquals('PASS', $a1Data['summary']['status']);

        // Verify Student A2 is INCOMPLETE with null ranks
        $a2Data = collect($students)->firstWhere('student.id', $this->studentA2->id);
        $this->assertNotNull($a2Data);
        $this->assertEquals('INCOMPLETE', $a2Data['summary']['status']);
        $this->assertNull($a2Data['summary']['class_rank']);
        $this->assertNull($a2Data['summary']['section_rank']);

        // 2. Section A Filter preserves cohort ranks while filtering returned set
        $sectionAResponse = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/report-cards/class/{$this->class->id}?academic_year_id={$this->year->id}&semester=semester_1&section=A");

        $sectionAResponse->assertStatus(200);
        $sectionAStudents = $sectionAResponse->json('data.students');
        $this->assertCount(2, $sectionAStudents);
        $this->assertTrue(collect($sectionAStudents)->every(fn ($s) => $s['section'] === 'A'));

        // 3. Section B Filter returns Section B student with preserved cohort class_rank
        $sectionBResponse = $this->actingAs($this->superadmin, 'sanctum')
            ->getJson("/api/report-cards/class/{$this->class->id}?academic_year_id={$this->year->id}&semester=semester_1&section=B");

        $sectionBResponse->assertStatus(200);
        $sectionBStudents = $sectionBResponse->json('data.students');
        $this->assertCount(1, $sectionBStudents);
        $this->assertEquals($this->studentB1->id, $sectionBStudents[0]['student']['id']);
        $this->assertEquals(2, $sectionBStudents[0]['summary']['class_rank']);
        $this->assertEquals(1, $sectionBStudents[0]['summary']['section_rank']);
    }

    public function test_end_to_end_csv_export_workflow_with_section_filtering(): void
    {
        // 1. Filter Section A CSV export
        $response = $this->actingAs($this->director, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/csv?academic_year_id={$this->year->id}&semester=semester_1&section=A");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        $content = $response->streamedContent();
        $this->assertTrue(str_starts_with($content, "\xEF\xBB\xBF"));
        $this->assertStringContainsString('አቤል ተስፋዬ', $content);
        $this->assertStringContainsString('ቤተልሔም ግርማ', $content);
        $this->assertStringNotContainsString('ጫላ ታደሰ', $content); // Section B student excluded

        // 2. Full Cohort CSV Export
        $fullCohortResponse = $this->actingAs($this->superadmin, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/csv?academic_year_id={$this->year->id}&semester=semester_1");

        $fullCohortResponse->assertStatus(200);
        $fullContent = $fullCohortResponse->streamedContent();
        $this->assertStringContainsString('አቤል ተስፋዬ', $fullContent);
        $this->assertStringContainsString('ጫላ ታደሰ', $fullContent);
    }

    public function test_end_to_end_printable_gradebook_document_workflow(): void
    {
        $response = $this->actingAs($this->assignedTeacherA, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/print?academic_year_id={$this->year->id}&semester=semester_1&section=A");

        $response->assertStatus(200);
        $content = $response->getContent();

        $this->assertStringContainsString('Official Class Academic Gradebook (የክፍል የውጤት መዝገብ)', $content);
        $this->assertStringContainsString('Grade 10', $content);
        $this->assertStringContainsString('አቤል ተስፋዬ', $content);
        $this->assertStringContainsString('Class Teacher (የክፍሉ መምህር)', $content);
        $this->assertStringContainsString('Academic Director (የትምህርት ክፍል ኃላፊ)', $content);
    }

    public function test_role_gating_and_unassigned_teacher_rejection(): void
    {
        // Unassigned teacher blocked from overview, csv, and print
        $overview = $this->actingAs($this->unassignedTeacher, 'sanctum')
            ->getJson("/api/report-cards/class/{$this->class->id}?academic_year_id={$this->year->id}&semester=semester_1");
        $overview->assertStatus(403);

        $csv = $this->actingAs($this->unassignedTeacher, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/csv?academic_year_id={$this->year->id}&semester=semester_1");
        $csv->assertStatus(403);

        $print = $this->actingAs($this->unassignedTeacher, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/print?academic_year_id={$this->year->id}&semester=semester_1");
        $print->assertStatus(403);
    }
}
