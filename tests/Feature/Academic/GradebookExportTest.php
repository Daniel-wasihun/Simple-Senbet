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

class GradebookExportTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;

    private User $director;

    private User $assignedTeacher;

    private User $unassignedTeacher;

    private AcademicYear $year;

    private SchoolClass $class;

    private Course $course;

    private TeachingAssignment $assignment;

    private Member $studentAmharic;

    private Member $studentFormula;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);

        $superRole = Role::findByName('superadmin', 'web');
        $directorRole = Role::findByName('academic_director', 'web');
        $teacherRole = Role::findByName('teacher', 'web');

        $this->superadmin = User::factory()->create(['role_id' => $superRole->id]);
        $this->superadmin->syncRoles(['superadmin']);

        $this->director = User::factory()->create(['role_id' => $directorRole->id]);
        $this->director->syncRoles(['academic_director']);

        $this->assignedTeacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->assignedTeacher->syncRoles(['teacher']);

        $this->unassignedTeacher = User::factory()->create(['role_id' => $teacherRole->id]);
        $this->unassignedTeacher->syncRoles(['teacher']);

        $this->year = AcademicYear::create([
            'name' => ['en' => '2018 E.C.', 'am' => '፳፻፲፰ ዓ.ም.'],
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $this->class = SchoolClass::create([
            'name' => ['en' => 'Grade 9', 'am' => '፱ኛ ክፍል'],
            'code' => 'G9',
            'number_of_sections' => 2,
            'passing_score' => 50.00,
        ]);

        $this->course = Course::create([
            'name' => ['en' => 'Bible Study', 'am' => 'የመጽሐፍ ቅዱስ ጥናት'],
            'code' => 'BIB101',
            'credit_hour' => 1,
            'class_id' => $this->class->id,
        ]);

        $this->assignment = TeachingAssignment::create([
            'teacher_id' => $this->assignedTeacher->id,
            'course_id' => $this->course->id,
            'academic_year_id' => $this->year->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'semester' => 'semester_1',
            'is_primary' => true,
        ]);

        $assessment = Assessment::create([
            'teaching_assignment_id' => $this->assignment->id,
            'name' => ['en' => 'Final Exam'],
            'total_score' => 100.00,
            'weight_percentage' => 100.00,
        ]);

        // Student with Amharic name
        $this->studentAmharic = Member::create([
            'full_name' => ['en' => 'Dawit Wolde', 'am' => 'ዳዊት ወልደ'],
            'date_of_birth' => '2010-01-01',
            'gender' => 'male',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);

        StudentEnrollment::create([
            'member_id' => $this->studentAmharic->id,
            'academic_year_id' => $this->year->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
        ]);

        AssessmentResult::create([
            'assessment_id' => $assessment->id,
            'member_id' => $this->studentAmharic->id,
            'score' => 95.00,
        ]);

        // Student with formula injection in name
        $this->studentFormula = Member::create([
            'full_name' => ['en' => '=cmd| calc!A1'],
            'date_of_birth' => '2010-02-01',
            'gender' => 'female',
            'class_id' => $this->class->id,
            'section' => 'A',
        ]);

        StudentEnrollment::create([
            'member_id' => $this->studentFormula->id,
            'academic_year_id' => $this->year->id,
            'class_id' => $this->class->id,
            'section' => 'A',
            'start_date' => '2025-09-01',
        ]);

        AssessmentResult::create([
            'assessment_id' => $assessment->id,
            'member_id' => $this->studentFormula->id,
            'score' => 45.00,
        ]);
    }

    public function test_superadmin_and_academic_director_can_export_csv(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/csv?academic_year_id={$this->year->id}&semester=semester_1");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('attachment; filename="gradebook-class-', $response->headers->get('Content-Disposition') ?? '');

        // Verify UTF-8 BOM is present at the start of output
        $content = $response->streamedContent();
        $this->assertTrue(str_starts_with($content, "\xEF\xBB\xBF"), 'Response must start with UTF-8 BOM');

        // Verify CSV header columns
        $this->assertStringContainsString('Student ID', $content);
        $this->assertStringContainsString('Full Name', $content);
        $this->assertStringContainsString('Overall Average (%)', $content);
        $this->assertStringContainsString('Section Rank', $content);
        $this->assertStringContainsString('Class Rank', $content);

        // Academic director also has access
        $directorRes = $this->actingAs($this->director, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/csv?academic_year_id={$this->year->id}&semester=semester_1");
        $directorRes->assertStatus(200);
    }

    public function test_assigned_teacher_can_export_csv_for_assigned_class(): void
    {
        $response = $this->actingAs($this->assignedTeacher, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/csv?academic_year_id={$this->year->id}&semester=semester_1");

        $response->assertStatus(200);
    }

    public function test_unassigned_teacher_is_forbidden_from_exporting_csv(): void
    {
        $response = $this->actingAs($this->unassignedTeacher, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/csv?academic_year_id={$this->year->id}&semester=semester_1");

        $response->assertStatus(403);
    }

    public function test_formula_injection_characters_are_escaped_in_csv(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/csv?academic_year_id={$this->year->id}&semester=semester_1");

        $response->assertStatus(200);
        $content = $response->streamedContent();

        // Ensure formula "=cmd| calc!A1" was sanitized with leading single quote "'="
        $this->assertStringNotContainsString('"=cmd|', $content);
        $this->assertStringContainsString("'=cmd|", $content);
    }

    public function test_amharic_characters_and_ranks_are_exported_correctly(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/csv?academic_year_id={$this->year->id}&semester=semester_1");

        $response->assertStatus(200);
        $content = $response->streamedContent();

        // Amharic characters preserved
        $this->assertStringContainsString('ዳዊት ወልደ', $content);
        $this->assertStringContainsString('PASS', $content);
        $this->assertStringContainsString('FAIL', $content);
    }

    public function test_printable_gradebook_view_authorization_and_structure(): void
    {
        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/print?academic_year_id={$this->year->id}&semester=semester_1");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/html; charset=UTF-8');

        $content = $response->getContent();
        $this->assertStringContainsString('<!DOCTYPE html>', $content);
        $this->assertStringContainsString('Simple Senbet Sunday School (የሰንበት ትምህርት ቤት)', $content);
        $this->assertStringContainsString('Official Class Academic Gradebook (የክፍል የውጤት መዝገብ)', $content);
        $this->assertStringContainsString('Grade 9', $content);
        $this->assertStringContainsString('ዳዊት ወልደ', $content);
        $this->assertStringContainsString('Class Teacher (የክፍሉ መምህር)', $content);
        $this->assertStringContainsString('Academic Director (የትምህርት ክፍል ኃላፊ)', $content);

        // Unassigned teacher forbidden
        $forbiddenRes = $this->actingAs($this->unassignedTeacher, 'sanctum')
            ->get("/api/report-cards/class/{$this->class->id}/export/print?academic_year_id={$this->year->id}&semester=semester_1");
        $forbiddenRes->assertStatus(403);
    }

    public function test_printable_gradebook_escapes_xss_in_class_and_academic_year_names(): void
    {
        $maliciousClass = SchoolClass::create([
            'name' => ['en' => 'Grade <script>alert("xss-class")</script>', 'am' => 'ክፍል <img src=x onerror=alert(1)>'],
            'code' => 'XSS1',
            'passing_score' => 50,
        ]);

        $maliciousYear = AcademicYear::create([
            'name' => ['en' => 'Year <script>alert("xss-year")</script>', 'am' => 'ዓመት <b onmouseover=alert(1)>'],
            'start_date' => '2027-09-01',
            'end_date' => '2028-06-30',
            'is_current' => false,
        ]);

        $response = $this->actingAs($this->superadmin, 'sanctum')
            ->get("/api/report-cards/class/{$maliciousClass->id}/export/print?academic_year_id={$maliciousYear->id}&semester=semester_1");

        $response->assertStatus(200);
        $content = $response->getContent();

        // Ensure executable HTML/JS tags are not present
        $this->assertStringNotContainsString('<script>alert("xss-class")</script>', $content);
        $this->assertStringNotContainsString('<script>alert("xss-year")</script>', $content);
        $this->assertStringNotContainsString('<img src=x onerror=alert(1)>', $content);

        // Ensure properly HTML encoded
        $this->assertStringContainsString('&lt;script&gt;alert(&quot;xss-class&quot;)&lt;/script&gt;', $content);
        $this->assertStringContainsString('&lt;script&gt;alert(&quot;xss-year&quot;)&lt;/script&gt;', $content);
    }
}
