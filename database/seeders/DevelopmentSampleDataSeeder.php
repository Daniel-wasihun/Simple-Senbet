<?php

namespace Database\Seeders;

use App\Enums\AttendanceMark;
use App\Enums\AttendanceStatus;
use App\Enums\Semester;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\AssessmentResult;
use App\Models\AttendanceAuditLog;
use App\Models\AttendanceSession;
use App\Models\Course;
use App\Models\Member;
use App\Models\MemberPayment;
use App\Models\MonthlyPaymentRule;
use App\Models\PaymentAuditLog;
use App\Models\Role;
use App\Models\SchoolClass;
use App\Models\SessionStudentRecord;
use App\Models\SessionTeacherRecord;
use App\Models\TeachingAssignment;
use App\Models\User;
use App\Services\StudentEnrollmentService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Additive, deterministic fixtures for local and test environments.
 * Existing rows are never updated or deleted.
 */
class DevelopmentSampleDataSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        if (! app()->environment(['local', 'development', 'testing'])) {
            $this->command?->warn('Development sample data is disabled outside local, development, and testing environments.');

            return;
        }

        $this->call(RoleAndPermissionSeeder::class);

        $counts = DB::transaction(fn () => $this->seedFixtures());

        $this->command?->table(['Module', 'Seed records'], collect($counts)
            ->map(fn (int $count, string $module) => [$module, $count])
            ->values()
            ->all());
        $this->command?->info('Password for newly created sample accounts: SenbetDev!2026 (pre-existing accounts are left unchanged).');
    }

    /** @return array<string, int> */
    private function seedFixtures(): array
    {
        $users = $this->seedUsers();
        $years = $this->seedAcademicYears();
        $classes = $this->seedClasses();
        $courses = $this->seedCourses($classes);
        $members = $this->seedMembers($classes);
        $this->seedEnrollments($members, $classes, $years['current']);
        $assignments = $this->seedTeachingAssignments($users['teacher'], $courses, $years['current']);
        $this->seedAssessments($assignments, $members);
        $this->seedAttendance($assignments, $members, $years['current'], $users['attendance_officer']);
        $rules = $this->seedPaymentRules($users['finance_officer'], $classes);
        $this->seedPayments($members, $rules[0], $users['finance_officer']);

        return [
            'Users and role assignments' => User::whereIn('email', array_values($this->accountEmails()))->count(),
            'System roles' => Role::where('guard_name', 'web')->count(),
            'System permissions' => \App\Models\Permission::where('guard_name', 'web')->count(),
            'Academic years' => AcademicYear::whereIn('id', $years['ids'])->count(),
            'School classes' => SchoolClass::whereIn('code', $this->classCodes())->count(),
            'Courses' => Course::whereIn('code', $this->courseCodes())->count(),
            'Members' => Member::whereIn('phone_number', $this->memberPhones())->count(),
            'Student enrollments' => DB::table('student_enrollments')->whereIn('member_id', $members->pluck('id'))->count(),
            'Teaching assignments' => TeachingAssignment::whereIn('id', array_column($assignments, 'id'))->count(),
            'Assessments' => Assessment::whereIn('teaching_assignment_id', array_column($assignments, 'id'))->count(),
            'Assessment results' => AssessmentResult::whereIn('assessment_id', Assessment::whereIn('teaching_assignment_id', array_column($assignments, 'id'))->select('id'))->count(),
            'Attendance sessions' => AttendanceSession::where('academic_year_id', $years['current']->id)->where('time_slot', 'like', 'Development%')->count(),
            'Student attendance marks' => SessionStudentRecord::whereIn('attendance_session_id', AttendanceSession::where('academic_year_id', $years['current']->id)->where('time_slot', 'like', 'Development%')->select('id'))->count(),
            'Teacher attendance marks' => SessionTeacherRecord::whereIn('attendance_session_id', AttendanceSession::where('academic_year_id', $years['current']->id)->where('time_slot', 'like', 'Development%')->select('id'))->count(),
            'Monthly payment rules' => MonthlyPaymentRule::whereIn('created_by', [$users['finance_officer']->id])->count(),
            'Member payments' => MemberPayment::whereIn('member_id', $members->pluck('id'))->where('idempotency_key', 'like', 'development-seed:%')->count(),
            'Payment audit logs' => PaymentAuditLog::whereHas('payment', fn ($query) => $query->where('idempotency_key', 'like', 'development-seed:%'))->count(),
            'Attendance audit logs' => AttendanceAuditLog::whereIn('attendance_session_id', AttendanceSession::where('academic_year_id', $years['current']->id)->where('time_slot', 'like', 'Development%')->select('id'))->count(),
        ];
    }

    /** @return array<string, User> */
    private function seedUsers(): array
    {
        $records = [];
        $roles = [
            'superadmin' => ['email' => env('SUPERADMIN_EMAIL', 'admin@example.com'), 'name' => 'Sample Super Administrator'],
            'academic_administrator' => ['email' => 'academic.admin@example.test', 'name' => 'Sample Church Administrator'],
            'academic_director' => ['email' => 'academic.director@example.test', 'name' => 'Sample Academic Director'],
            'finance_officer' => ['email' => 'finance.officer@example.test', 'name' => 'Sample Finance Officer'],
            'member_coordinator' => ['email' => 'member.coordinator@example.test', 'name' => 'Sample Member Coordinator'],
            'attendance_officer' => ['email' => 'attendance.officer@example.test', 'name' => 'Sample Attendance Officer'],
            'teacher' => ['email' => 'teacher@example.com', 'name' => 'Sample Teacher'],
            'student' => ['email' => 'student@example.com', 'name' => 'Sample Student'],
        ];

        foreach ($roles as $roleName => $data) {
            $role = Role::where('name', $roleName)->where('guard_name', 'web')->firstOrFail();
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                ['name' => $data['name'], 'password' => Hash::make('SenbetDev!2026'), 'role_id' => $role->id]
            );

            // Only assign a role at creation. A colliding pre-existing account is left untouched.
            if ($user->wasRecentlyCreated) {
                $user->syncRoles([$role]);
            }

            $records[$roleName] = $user;
        }

        return $records;
    }

    /** @return array{current: AcademicYear, ids: list<int>} */
    private function seedAcademicYears(): array
    {
        $currentStartYear = now()->month >= 9 ? now()->year : now()->year - 1;
        $existingCurrent = AcademicYear::where('is_current', true)->exists();
        $years = [];
        $ids = [];

        foreach ([-2, -1, 0, 1] as $offset) {
            $startYear = $currentStartYear + $offset;
            $start = sprintf('%04d-09-01', $startYear);
            $end = sprintf('%04d-06-30', $startYear + 1);
            $year = AcademicYear::whereDate('start_date', $start)->whereDate('end_date', $end)->first();
            if (! $year) {
                $year = AcademicYear::create([
                    'name' => ['en' => "{$startYear}-".($startYear + 1).' Academic Year', 'am' => "{$startYear}-".($startYear + 1)],
                    'start_date' => $start,
                    'end_date' => $end,
                    'is_current' => $offset === 0 && ! $existingCurrent,
                ]);
            }
            $ids[] = (int) $year->id;

            if ($offset === 0) {
                $years['current'] = $year;
            }
        }

        return ['current' => $years['current'], 'ids' => $ids];
    }

    /** @return list<SchoolClass> */
    private function seedClasses(): array
    {
        $classes = [];
        foreach (range(1, 10) as $grade) {
            $classes[] = SchoolClass::updateOrCreate(
                ['code' => sprintf('DEV-G%02d', $grade)],
                [
                    'name' => [
                        'en' => "Grade {$grade}",
                        'am' => "ክፍል {$grade}",
                        'om' => "Kutaa {$grade}",
                    ],
                    'number_of_sections' => 3,
                    'passing_score' => 50,
                ]
            );
        }

        foreach ($classes as $index => $class) {
            if ($class->wasRecentlyCreated) {
                $class->update(['next_class_id' => $classes[$index + 1]->id ?? null]);
            }
        }

        return $classes;
    }

    /** @param list<SchoolClass> $classes
     *  @return list<Course>
     */
    private function seedCourses(array $classes): array
    {
        $subjects = [
            ['BIBLE', 'Bible Studies', 'Scripture, context, and interpretation'],
            ['AMHARIC', 'Amharic Language', 'Reading, writing, and language skills'],
            ['ENGLISH', 'English Language', 'Reading, writing, and communication'],
            ['MATH', 'Mathematics', 'Number sense and problem solving'],
            ['HISTORY', 'Church History', 'Church history and Ethiopian heritage'],
            ['HYMN', 'Hymn and Music', 'Hymnody and music appreciation'],
            ['ETHICS', 'Christian Ethics', 'Christian values and everyday life'],
            ['GOSPEL', 'Gospel Studies', 'The life and teachings of Jesus'],
            ['LITURGY', 'Liturgy', 'Worship practices and liturgical tradition'],
            ['GEOGRAPHY', 'Geography', 'People, places, and the natural world'],
        ];
        $courses = [];

        foreach ($subjects as $index => [$code, $name, $description]) {
            $class = $classes[$index];
            $courses[] = Course::firstOrCreate(
                ['code' => 'DEV-'.$code],
                [
                    'class_id' => $class->id,
                    'name' => ['en' => $name, 'am' => $name],
                    'description' => ['en' => $description, 'am' => $description],
                    'credit_hour' => ($index % 3) + 1,
                ]
            );
        }

        return $courses;
    }

    /** @param list<SchoolClass> $classes */
    private function seedMembers(array $classes): \Illuminate\Support\Collection
    {
        $memberData = [
            [
                'name' => ['en' => 'Daniel Wasihun', 'am' => 'ዳንኤል ዋሲሁን', 'om' => 'Daani\'eel Waasihuun'],
                'christian_name' => ['en' => 'Wolde Giorgis', 'am' => 'ወልደ ጊዮርጊስ', 'om' => 'Walda Giyoorgis'],
                'gender' => 'male',
                'dob' => '2012-04-15',
                'emergency' => ['en' => 'Wasihun Tekle', 'am' => 'ዋሲሁን ተክሌ', 'om' => 'Waasihuun Taklee'],
                'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
            ],
            [
                'name' => ['en' => 'Bethlehem Tesfaye', 'am' => 'ቤተልሔም ተስፋዬ', 'om' => 'Beetaliheem Tasfaayee'],
                'christian_name' => ['en' => 'Walatta Petros', 'am' => 'ወለተ ጴጥሮስ', 'om' => 'Walatta Pheexroos'],
                'gender' => 'female',
                'dob' => '2013-08-22',
                'emergency' => ['en' => 'Tesfaye Alemayehu', 'am' => 'ተስፋዬ አለማየሁ', 'om' => 'Tasfaayee Alamayyahuu'],
                'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
            ],
            [
                'name' => ['en' => 'Yohannes Haile', 'am' => 'ዮሐንስ ኃይሌ', 'om' => 'Yohaannis Hayilee'],
                'christian_name' => ['en' => 'Wolde Yesus', 'am' => 'ወልደ ኢየሱስ', 'om' => 'Walda Yesuus'],
                'gender' => 'male',
                'dob' => '2014-01-10',
                'emergency' => ['en' => 'Haile Gebre', 'am' => 'ኃይሌ ገብሬ', 'om' => 'Hayilee Gabree'],
                'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
            ],
            [
                'name' => ['en' => 'Selamawit Bekele', 'am' => 'ሰላማዊት በቀለ', 'om' => 'Salamaawit Baqqalaa'],
                'christian_name' => ['en' => 'Walatta Mariam', 'am' => 'ወለተ ማርያም', 'om' => 'Walatta Maariyaam'],
                'gender' => 'female',
                'dob' => '2015-05-18',
                'emergency' => ['en' => 'Bekele Desta', 'am' => 'በቀለ ደስታ', 'om' => 'Baqqalaa Dastaa'],
                'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
            ],
            [
                'name' => ['en' => 'Tewodros Girma', 'am' => 'ቴዎድሮስ ግርማ', 'om' => 'Teewodroos Girmaa'],
                'christian_name' => ['en' => 'Habte Selassie', 'am' => 'ሀብተ ሥላሴ', 'om' => 'Habta Sillaasee'],
                'gender' => 'male',
                'dob' => '2012-11-03',
                'emergency' => ['en' => 'Girma Tadesse', 'am' => 'ግርማ ታደሰ', 'om' => 'Girmaa Taaddasaa'],
                'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
            ],
            [
                'name' => ['en' => 'Mahlet Alemu', 'am' => 'ማኅሌት ዓለሙ', 'om' => 'Maahleet Alamuu'],
                'christian_name' => ['en' => 'Walatta Michael', 'am' => 'ወለተ ሚካኤል', 'om' => 'Walatta Mikaa\'eel'],
                'gender' => 'female',
                'dob' => '2013-03-30',
                'emergency' => ['en' => 'Alemu Kebede', 'am' => 'ዓለሙ ከበደ', 'om' => 'Alamuu Kabbadaa'],
                'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
            ],
            [
                'name' => ['en' => 'Dawit Tadesse', 'am' => 'ዳዊት ታደሰ', 'om' => 'Daawit Taaddasaa'],
                'christian_name' => ['en' => 'Gebre Meskel', 'am' => 'ገብረ መስቀል', 'om' => 'Gabra Masqal'],
                'gender' => 'male',
                'dob' => '2014-07-14',
                'emergency' => ['en' => 'Tadesse Assefa', 'am' => 'ታደሰ አሰፋ', 'om' => 'Taaddasaa Asaffaa'],
                'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
            ],
            [
                'name' => ['en' => 'Hanna Mengistu', 'am' => 'ሐና መንግሥቱ', 'om' => 'Haannaa Mangistuu'],
                'christian_name' => ['en' => 'Fiqre Mariam', 'am' => 'ፍቅረ ማርያም', 'om' => 'Fiqra Maariyaam'],
                'gender' => 'female',
                'dob' => '2015-09-25',
                'emergency' => ['en' => 'Mengistu Worku', 'am' => 'መንግሥቱ ወርቁ', 'om' => 'Mangistuu Warquu'],
                'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
            ],
            [
                'name' => ['en' => 'Natnael Berhanu', 'am' => 'ናትናኤል ብርሃኑ', 'om' => 'Naatnaa\'eel Birhaanuu'],
                'christian_name' => ['en' => 'Wolde Gabriel', 'am' => 'ወልደ ገብርኤል', 'om' => 'Walda Gabri\'eel'],
                'gender' => 'male',
                'dob' => '2013-12-05',
                'emergency' => ['en' => 'Berhanu Negash', 'am' => 'ብርሃኑ ነጋሽ', 'om' => 'Birhaanuu Nagaash'],
                'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
            ],
            [
                'name' => ['en' => 'Ruth Solomon', 'am' => 'ሩት ሰሎሞን', 'om' => 'Ruut Solomoon'],
                'christian_name' => ['en' => 'Walatta Hanna', 'am' => 'ወለተ ሐና', 'om' => 'Walatta Haannaa'],
                'gender' => 'female',
                'dob' => '2016-02-19',
                'emergency' => ['en' => 'Solomon Getachew', 'am' => 'ሰሎሞን ጌታቸው', 'om' => 'Solomoon Geetaachoo'],
                'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
            ],
            [
                'name' => ['en' => 'Bereket Assefa', 'am' => 'በረከት አሰፋ', 'om' => 'Barakat Asaffaa'],
                'christian_name' => ['en' => 'Tesfa Selassie', 'am' => 'ተስፋ ሥላሴ', 'om' => 'Tasfaa Sillaasee'],
                'gender' => 'male',
                'dob' => '2014-04-12',
                'emergency' => ['en' => 'Assefa Belay', 'am' => 'አሰፋ በላይ', 'om' => 'Asaffaa Balaay'],
                'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
            ],
            [
                'name' => ['en' => 'Liya Kebede', 'am' => 'ሊያ ከበደ', 'om' => 'Liiyaa Kabbadaa'],
                'christian_name' => ['en' => 'Walatta Tsion', 'am' => 'ወለተ ጽዮን', 'om' => 'Walatta Tsiyoon'],
                'gender' => 'female',
                'dob' => '2015-10-08',
                'emergency' => ['en' => 'Kebede Mamo', 'am' => 'ከበደ ማሞ', 'om' => 'Kabbadaa Maammoo'],
                'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
            ],
            [
                'name' => ['en' => 'Samuel Getachew', 'am' => 'ሳሙኤል ጌታቸው', 'om' => 'Saamu\'eel Geetaachoo'],
                'christian_name' => ['en' => 'Haile Gabriel', 'am' => 'ኃይለ ገብርኤል', 'om' => 'Hayila Gabri\'eel'],
                'gender' => 'male',
                'dob' => '2013-06-20',
                'emergency' => ['en' => 'Getachew Desta', 'am' => 'ጌታቸው ደስታ', 'om' => 'Geetaachoo Dastaa'],
                'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
            ],
            [
                'name' => ['en' => 'Eden Worku', 'am' => 'ኤደን ወርቁ', 'om' => 'Eedan Warquu'],
                'christian_name' => ['en' => 'Walatta Kidan', 'am' => 'ወለተ ኪዳን', 'om' => 'Walatta Kidaan'],
                'gender' => 'female',
                'dob' => '2016-01-30',
                'emergency' => ['en' => 'Worku Tilahun', 'am' => 'ወርቁ ጥላሁን', 'om' => 'Warquu Xilaahuun'],
                'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
            ],
            [
                'name' => ['en' => 'Mikael Negash', 'am' => 'ሚካኤል ነጋሽ', 'om' => 'Mikaa\'eel Nagaash'],
                'christian_name' => ['en' => 'Gebre Giorgis', 'am' => 'ገብረ ጊዮርጊስ', 'om' => 'Gabra Giyoorgis'],
                'gender' => 'male',
                'dob' => '2012-09-17',
                'emergency' => ['en' => 'Negash Hailu', 'am' => 'ነጋሽ ኃይሉ', 'om' => 'Nagaash Haayiluu'],
                'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
            ],
        ];

        $members = collect();

        foreach ($memberData as $index => $data) {
            $class = $classes[$index % count($classes)];
            $phone = sprintf('+1-202-555-%04d', 100 + $index);

            $member = Member::withTrashed()->updateOrCreate(
                ['phone_number' => $phone],
                [
                    'full_name' => $data['name'],
                    'christian_name' => $data['christian_name'],
                    'date_of_birth' => $data['dob'],
                    'gender' => $data['gender'],
                    'emergency_contact_name' => $data['emergency'],
                    'emergency_contact_phone' => '+1-202-555-0199',
                    'membership_date' => Carbon::parse('2022-09-01')->addDays($index * 14)->toDateString(),
                    'sol_father_name' => $data['clergy'],
                    'class_id' => $class->id,
                    'section' => chr(65 + ($index % 3)),
                    'deleted_at' => null,
                ]
            );

            $members->push($member);
        }

        return $members;
    }

    /** @param \Illuminate\Support\Collection<int, Member> $members
     *  @param list<SchoolClass> $classes
     */
    private function seedEnrollments($members, array $classes, AcademicYear $year): void
    {
        $service = app(StudentEnrollmentService::class);
        $start = Carbon::parse($year->start_date)->toDateString();

        foreach ($members as $index => $member) {
            $class = $classes[$index % count($classes)];
            if ($member->enrollments()->whereNull('end_date')->exists()) {
                continue;
            }

            $service->enroll($member->id, $year->id, $class->id, chr(65 + ($index % 3)), $start);
        }
    }

    /** @param list<Course> $courses
     *  @return list<TeachingAssignment>
     */
    private function seedTeachingAssignments(User $teacher, array $courses, AcademicYear $year): array
    {
        $assignments = [];
        foreach ($courses as $index => $course) {
            $attributes = [
                    'teacher_id' => $teacher->id,
                    'academic_year_id' => $year->id,
                    'class_id' => $course->class_id,
                    'section' => chr(65 + ($index % 3)),
                    'course_id' => $course->id,
                    'semester' => Semester::from($index % 2 === 0 ? 'semester_1' : 'semester_2')->value,
                ];
            $assignment = TeachingAssignment::where($attributes)
                ->whereDate('start_date', Carbon::parse($year->start_date)->toDateString())
                ->first();
            $assignments[] = $assignment ?? TeachingAssignment::create($attributes + [
                'is_primary' => true,
                'start_date' => Carbon::parse($year->start_date)->toDateString(),
                'end_date' => Carbon::parse($year->end_date)->toDateString(),
            ]);
        }

        return $assignments;
    }

    /** @param list<TeachingAssignment> $assignments
     *  @param \Illuminate\Support\Collection<int, Member> $members
     */
    private function seedAssessments(array $assignments, $members): void
    {
        foreach ($assignments as $index => $assignment) {
            foreach (['Midterm Assessment', 'Coursework Assessment'] as $assessmentIndex => $name) {
                $assessment = Assessment::where('teaching_assignment_id', $assignment->id)->where('name->en', $name)->first();
                $assessment ??= Assessment::create([
                    'teaching_assignment_id' => $assignment->id,
                    'name' => ['en' => $name, 'am' => $name],
                    'total_score' => 100,
                    'weight_percentage' => $assessmentIndex === 0 ? 60 : 40,
                ]);

                foreach ($members->filter(fn (Member $member) => (int) $member->class_id === (int) $assignment->class_id && $member->section === $assignment->section) as $memberIndex => $member) {
                    AssessmentResult::firstOrCreate(
                        ['assessment_id' => $assessment->id, 'member_id' => $member->id],
                        ['score' => 55 + (($index * 7 + $memberIndex * 5 + $assessmentIndex * 3) % 46), 'remarks' => ['en' => 'Development sample result', 'am' => 'Development sample result']]
                    );
                }
            }
        }
    }

    /** @param list<TeachingAssignment> $assignments
     *  @param \Illuminate\Support\Collection<int, Member> $members
     */
    private function seedAttendance(array $assignments, $members, AcademicYear $year, User $officer): void
    {
        foreach (array_slice($assignments, 0, 10) as $index => $assignment) {
            $date = Carbon::parse($year->start_date)->addDays($index)->toDateString();
            $sessionAttributes = [
                    'academic_year_id' => $year->id,
                    'term_id' => 1,
                    'class_id' => $assignment->class_id,
                    'course_id' => $assignment->course_id,
                    'time_slot' => 'Development Session '.($index + 1),
                ];
            $session = AttendanceSession::where($sessionAttributes)->whereDate('date', $date)->first();
            $session ??= AttendanceSession::create($sessionAttributes + ['date' => $date, 'status' => AttendanceStatus::Submitted, 'submitted_by' => $officer->id, 'submitted_at' => Carbon::parse($date)->setTime(12, 0)]);
            $this->seedSessionRecords($session, $assignment, $members, $officer, $index);
            AttendanceAuditLog::firstOrCreate(
                ['attendance_session_id' => $session->id, 'action' => 'session_submitted'],
                ['actor_id' => $officer->id, 'previous_state' => ['status' => 'draft'], 'new_state' => ['status' => 'submitted'], 'ip_address' => '127.0.0.1', 'user_agent' => 'Development seeder']
            );
        }

        foreach (array_slice($assignments, 0, 2) as $index => $assignment) {
            $date = Carbon::parse($year->start_date)->addDays(10 + $index)->toDateString();
            $sessionAttributes = ['academic_year_id' => $year->id, 'term_id' => 1, 'class_id' => $assignment->class_id, 'course_id' => $assignment->course_id, 'time_slot' => 'Development Review '.($index + 1)];
            $session = AttendanceSession::where($sessionAttributes)->whereDate('date', $date)->first();
            $session ??= AttendanceSession::create($sessionAttributes + ['date' => $date, 'status' => AttendanceStatus::Submitted, 'submitted_by' => $officer->id, 'submitted_at' => Carbon::parse($date)->setTime(12, 0)]);
            $this->seedSessionRecords($session, $assignment, $members, $officer, $index + 10);
        }
    }

    /** @param \Illuminate\Support\Collection<int, Member> $members */
    private function seedSessionRecords(AttendanceSession $session, TeachingAssignment $assignment, $members, User $officer, int $seedIndex): void
    {
        $classMembers = $members->filter(fn (Member $member) => (int) $member->class_id === (int) $assignment->class_id && $member->section === $assignment->section);
        foreach ($classMembers->values() as $index => $member) {
            $marks = [AttendanceMark::Present, AttendanceMark::Absent, AttendanceMark::Late, AttendanceMark::Excused];
            $mark = $marks[($seedIndex + $index) % count($marks)];
            SessionStudentRecord::firstOrCreate(
                ['attendance_session_id' => $session->id, 'student_id' => $member->id],
                ['mark' => $mark->value, 'marked_by' => $officer->id, 'marked_at' => $session->date->copy()->setTime(11, 45), 'remarks' => $mark === AttendanceMark::Absent ? 'Development sample absence' : null]
            );
        }

        SessionTeacherRecord::firstOrCreate(
            ['attendance_session_id' => $session->id, 'teacher_id' => $assignment->teacher_id],
            ['mark' => AttendanceMark::Present->value, 'marked_by' => $officer->id, 'marked_at' => $session->date->copy()->setTime(11, 45), 'remarks' => null]
        );
    }

    /** @param list<SchoolClass> $classes
     *  @return list<MonthlyPaymentRule>
     */
    private function seedPaymentRules(User $financeOfficer, array $classes): array
    {
        $rules = [];
        foreach ([['General Monthly Contribution', 150.00, null], ['Junior Class Contribution', 100.00, $classes[0]->id], ['Senior Class Contribution', 200.00, $classes[5]->id]] as [$name, $amount, $classId]) {
            $effectiveFrom = now()->startOfYear()->toDateString();
            $rule = MonthlyPaymentRule::where('name->en', $name)->whereDate('effective_from', $effectiveFrom)->where('class_id', $classId)->first();
            $rules[] = $rule ?? MonthlyPaymentRule::create([
                'name' => ['en' => $name, 'am' => $name],
                'effective_from' => $effectiveFrom,
                'class_id' => $classId,
                'amount' => $amount,
                'minimum_age' => null,
                'minimum_class_id' => null,
                'is_active' => true,
                'allow_credit_carry_forward' => true,
                'created_by' => $financeOfficer->id,
            ]);
        }

        return $rules;
    }

    /** @param \Illuminate\Support\Collection<int, Member> $members */
    private function seedPayments($members, MonthlyPaymentRule $rule, User $financeOfficer): void
    {
        $month = now()->format('Y-m');
        foreach ($members->values() as $index => $member) {
            $paid = match ($index % 3) { 0 => 150.00, 1 => 75.00, default => 180.00 };
            $status = match ($index % 3) { 0 => 'PAID', 1 => 'PARTIAL', default => 'OVERPAID' };
            $payment = MemberPayment::firstOrCreate(
                ['idempotency_key' => 'development-seed:'.$member->id.':'.$month],
                [
                    'member_id' => $member->id,
                    'payment_rule_id' => $rule->id,
                    'payment_month' => $month,
                    'expected_amount' => 150,
                    'paid_amount' => $paid,
                    'remaining_balance' => max(0, 150 - $paid),
                    'payment_status' => $status,
                    'payment_date' => now()->subDays($index)->toDateString(),
                    'payment_method' => ['CASH', 'BANK_TRANSFER', 'TELEBIRR'][$index % 3],
                    'reference_number' => sprintf('DEV-%s-%04d', now()->format('Ym'), $index + 1),
                    'notes' => 'Development sample transaction',
                    'recorded_by' => $financeOfficer->id,
                    'is_void' => false,
                ]
            );
            PaymentAuditLog::firstOrCreate(
                ['member_payment_id' => $payment->id, 'action' => 'CREATED'],
                ['new_payload' => $payment->toArray(), 'reason' => 'Development sample payment', 'performed_by' => $financeOfficer->id]
            );
        }
    }

    /** @return array<string, string> */
    private function accountEmails(): array
    {
        return [
            'superadmin' => env('SUPERADMIN_EMAIL', 'admin@example.com'),
            'academic_administrator' => 'academic.admin@example.test',
            'academic_director' => 'academic.director@example.test',
            'finance_officer' => 'finance.officer@example.test',
            'member_coordinator' => 'member.coordinator@example.test',
            'attendance_officer' => 'attendance.officer@example.test',
            'teacher' => 'teacher@example.com',
            'student' => 'student@example.com',
        ];
    }

    /** @return list<string> */
    private function classCodes(): array
    {
        return array_map(fn (int $grade) => sprintf('DEV-G%02d', $grade), range(1, 10));
    }

    /** @return list<string> */
    private function courseCodes(): array
    {
        return array_map(fn (string $code) => 'DEV-'.$code, ['BIBLE', 'AMHARIC', 'ENGLISH', 'MATH', 'HISTORY', 'HYMN', 'ETHICS', 'GOSPEL', 'LITURGY', 'GEOGRAPHY']);
    }

    /** @return list<string> */
    private function memberPhones(): array
    {
        return array_map(fn (int $index) => sprintf('+1-202-555-%04d', 100 + $index), range(0, 14));
    }

}
