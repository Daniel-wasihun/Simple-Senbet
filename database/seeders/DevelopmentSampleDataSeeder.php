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
 * Deterministic sample data seeder for local and test environments.
 * - Exactly 4 grade levels (Grades 1 to 4).
 * - 6 courses per grade per year (3 courses in Semester 1, 3 courses in Semester 2).
 * - 20 full-profile members in each grade (80 members total).
 * - Exactly 3 assessments per course with weights summing to 100% (20%, 30%, 50%), each out of 100.
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
        $this->command?->info('Password for sample accounts: SenbetDev!2026');
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
            'School classes (Grades 1-4)' => SchoolClass::whereIn('code', $this->classCodes())->count(),
            'Courses (6 per grade = 24)' => Course::whereIn('code', $this->courseCodes())->count(),
            'Members (20 per grade = 80)' => Member::whereIn('phone_number', $this->memberPhones())->count(),
            'Student enrollments' => DB::table('student_enrollments')->whereIn('member_id', $members->pluck('id'))->count(),
            'Teaching assignments' => TeachingAssignment::whereIn('id', array_column($assignments, 'id'))->count(),
            'Assessments (3 per assignment)' => Assessment::whereIn('teaching_assignment_id', array_column($assignments, 'id'))->count(),
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
        $accounts = [
            'superadmin' => [
                'email' => env('SUPERADMIN_EMAIL', 'admin@example.com'),
                'name' => 'Sample Super Administrator',
                'role' => 'superadmin',
                'password' => 'ChangeMe123!',
            ],
            'academic_director' => [
                'email' => 'director@example.com',
                'name' => 'Sample Academic Director',
                'role' => 'academic_director',
                'password' => 'Director123!',
            ],
            'finance_officer' => [
                'email' => 'finance@example.com',
                'name' => 'Sample Finance Officer',
                'role' => 'finance_officer',
                'password' => 'Finance123!',
            ],
            'teacher' => [
                'email' => 'teacher@example.com',
                'name' => 'Sample Lead Teacher',
                'role' => 'teacher',
                'password' => 'Teacher123!',
            ],
            'attendance_officer' => [
                'email' => 'attendance@example.com',
                'name' => 'Sample Attendance Officer',
                'role' => 'attendance_officer',
                'password' => 'Attendance123!',
            ],
            'member_coordinator' => [
                'email' => 'registrar@example.com',
                'name' => 'Sample Member Coordinator',
                'role' => 'member_coordinator',
                'password' => 'Registrar123!',
            ],
            'student' => [
                'email' => 'student@example.com',
                'name' => 'Sample Student',
                'role' => 'student',
                'password' => 'Student123!',
            ],
            'academic_administrator' => [
                'email' => 'academic.admin@example.test',
                'name' => 'Sample Church Administrator',
                'role' => 'academic_administrator',
                'password' => 'SenbetDev!2026',
            ],
        ];

        foreach ($accounts as $key => $data) {
            $role = Role::where('name', $data['role'])->where('guard_name', 'web')->firstOrFail();
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make($data['password']),
                    'role_id' => $role->id,
                ]
            );

            $user->syncRoles([$role]);
            $records[$key] = $user;
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
                    'name' => ['en' => "{$startYear}-".($startYear + 1).' Academic Year', 'am' => "{$startYear}-".($startYear + 1).' የትምህርት ዘመን'],
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

    /**
     * Seed exactly 4 grades (Grades 1 to 4).
     *
     * @return list<SchoolClass>
     */
    private function seedClasses(): array
    {
        $classes = [];
        foreach (range(1, 4) as $grade) {
            $classes[] = SchoolClass::updateOrCreate(
                ['code' => sprintf('DEV-G%02d', $grade)],
                [
                    'name' => [
                        'en' => "Grade {$grade}",
                        'am' => "ክፍል {$grade}",
                        'om' => "Kutaa {$grade}",
                    ],
                    'number_of_sections' => 2,
                    'passing_score' => 50,
                ]
            );
        }

        foreach ($classes as $index => $class) {
            $class->update(['next_class_id' => $classes[$index + 1]->id ?? null]);
        }

        return $classes;
    }

    /**
     * Seed 6 courses per grade (3 in Semester 1, 3 in Semester 2) = 24 courses total.
     *
     * @param list<SchoolClass> $classes
     * @return list<Course>
     */
    private function seedCourses(array $classes): array
    {
        $courses = [];

        $gradeCurriculum = [
            // Grade 1 (DEV-G01)
            0 => [
                // Semester 1 (3 courses)
                [
                    'code' => 'DEV-G01-S1-01',
                    'name' => ['en' => 'Bible Studies 1', 'am' => 'የቅዱሳት መጻሕፍት ጥናት 1', 'om' => "Qo'annoo Kitaaba Qulqulluu 1"],
                    'description' => ['en' => 'Introduction to Old and New Testament stories', 'am' => 'የብሉይ እና ሐዲስ ኪዳን ታሪኮች መግቢያ', 'om' => 'Seenaa Kakuu Moofaa fi Haaraa'],
                    'credit_hour' => 3,
                ],
                [
                    'code' => 'DEV-G01-S1-02',
                    'name' => ['en' => 'Amharic Language 1', 'am' => 'የአማርኛ ቋንቋ 1', 'om' => 'Afaan Amaaraa 1'],
                    'description' => ['en' => 'Basic reading, writing, and fidel alphabet', 'am' => 'መሠረታዊ ንባብ፣ ጽሕፈት እና ፊደላት', 'om' => 'Dubbisuu fi barreessuu qubee'],
                    'credit_hour' => 2,
                ],
                [
                    'code' => 'DEV-G01-S1-03',
                    'name' => ['en' => 'Hymns & Sacred Chant 1', 'am' => 'ዝማሬ እና ማኅሌት 1', 'om' => 'Faarfannaa fi Qubee 1'],
                    'description' => ['en' => 'Sunday school hymns and spiritual melodies', 'am' => 'የሰንበት ትምህርት ቤት መዝሙራት', 'om' => 'Faarfannaa mana barumsa sanbataa'],
                    'credit_hour' => 2,
                ],
                // Semester 2 (3 courses)
                [
                    'code' => 'DEV-G01-S2-01',
                    'name' => ['en' => 'Christian Ethics 1', 'am' => 'ክርስቲያናዊ ሥነ-ምግባር 1', 'om' => 'Naamusni Kiristaanaa 1'],
                    'description' => ['en' => 'Christian values, discipline, and everyday life', 'am' => 'ክርስቲያናዊ ሥነ-ምግባር እና ክርስቲያናዊ አኗኗር', 'om' => 'Jireenya kiristaanaa fi naamusa'],
                    'credit_hour' => 2,
                ],
                [
                    'code' => 'DEV-G01-S2-02',
                    'name' => ['en' => 'Liturgy & Prayer 1', 'am' => 'ሥርዓተ ቅዳሴ እና ጸሎት 1', 'om' => 'Sirna Qiddaasee fi Kadhannaa 1'],
                    'description' => ['en' => 'Daily prayers, church etiquette, and holy liturgy', 'am' => 'የዘወትር ጸሎት እና የቤተክርስቲያን ሥርዓት', 'om' => 'Kadhannaa guyyaa fi sirna waldaa'],
                    'credit_hour' => 3,
                ],
                [
                    'code' => 'DEV-G01-S2-03',
                    'name' => ['en' => 'Church History 1', 'am' => 'የቤተክርስቲያን ታሪክ 1', 'om' => 'Seenaa Waldaa Kiristaanaa 1'],
                    'description' => ['en' => 'Early Apostolic era and Ethiopian Orthodox heritage', 'am' => 'የቀደምት ሐዋርያት እና የኢትዮጵያ ኦርቶዶክስ ታሪክ', 'om' => 'Seenaa ergamootaa fi Itoophiyaa'],
                    'credit_hour' => 2,
                ],
            ],
            // Grade 2 (DEV-G02)
            1 => [
                // Semester 1 (3 courses)
                [
                    'code' => 'DEV-G02-S1-01',
                    'name' => ['en' => 'Bible Studies 2', 'am' => 'የቅዱሳት መጻሕፍት ጥናት 2', 'om' => "Qo'annoo Kitaaba Qulqulluu 2"],
                    'description' => ['en' => 'The Pentateuch and Historical Books', 'am' => 'የኦሪት እና የታሪክ መጻሕፍት ጥናት', 'om' => 'Kitaabolee seeraa fi seenaa'],
                    'credit_hour' => 3,
                ],
                [
                    'code' => 'DEV-G02-S1-02',
                    'name' => ['en' => 'Amharic & Geez 2', 'am' => 'አማርኛ እና ግዕዝ 2', 'om' => "Amaaraa fi Gi'izii 2"],
                    'description' => ['en' => 'Intermediate Amharic grammar and Geez basics', 'am' => 'መካከለኛ የአማርኛ ሰዋስው እና መሠረተ ግዕዝ', 'om' => "Seerluga Amaaraa fi Gi'izii"],
                    'credit_hour' => 2,
                ],
                [
                    'code' => 'DEV-G02-S1-03',
                    'name' => ['en' => 'Hymns & Sacred Chant 2', 'am' => 'ዝማሬ እና ማኅሌት 2', 'om' => 'Faarfannaa fi Qubee 2'],
                    'description' => ['en' => 'Seasonal holiday hymns and liturgical responses', 'am' => 'የበዓላት መዝሙራት እና የማኅሌት ምላሾች', 'om' => 'Faarfannaa ayyaanotaa'],
                    'credit_hour' => 2,
                ],
                // Semester 2 (3 courses)
                [
                    'code' => 'DEV-G02-S2-01',
                    'name' => ['en' => 'Christian Ethics 2', 'am' => 'ክርስቲያናዊ ሥነ-ምግባር 2', 'om' => 'Naamusni Kiristaanaa 2'],
                    'description' => ['en' => 'Ten Commandments and the Beatitudes', 'am' => 'አሥርቱ ትእዛዛት እና ስብከተ ተራራ', 'om' => 'Abboommii kudhan fi lallaba tulluu'],
                    'credit_hour' => 2,
                ],
                [
                    'code' => 'DEV-G02-S2-02',
                    'name' => ['en' => 'Liturgy & Sacraments 2', 'am' => 'ሥርዓተ ቅዳሴ እና ምሥጢራተ ቤተክርስቲያን 2', 'om' => 'Sirna Qiddaasee fi Iccitii 2'],
                    'description' => ['en' => 'The Seven Holy Sacraments of the Church', 'am' => 'ሰባቱ ምሥጢራተ ቤተክርስቲያን', 'om' => 'Iccitiiwwan torban waldaa'],
                    'credit_hour' => 3,
                ],
                [
                    'code' => 'DEV-G02-S2-03',
                    'name' => ['en' => 'Church History 2', 'am' => 'የቤተክርስቲያን ታሪክ 2', 'om' => 'Seenaa Waldaa Kiristaanaa 2'],
                    'description' => ['en' => 'Nine Saints and the expansion of Christianity in Ethiopia', 'am' => 'ተስዓቱ ቅዱሳን እና የክርስትና መስፋፋት በኢትዮጵያ', 'om' => 'Qulqulloota saglan fi seenaa'],
                    'credit_hour' => 2,
                ],
            ],
            // Grade 3 (DEV-G03)
            2 => [
                // Semester 1 (3 courses)
                [
                    'code' => 'DEV-G03-S1-01',
                    'name' => ['en' => 'Gospel Studies 3', 'am' => 'የወንጌል ትምህርት 3', 'om' => "Qo'annoo Wangeelaa 3"],
                    'description' => ['en' => 'The Life, Miracles, and Parables of Jesus Christ', 'am' => 'የጌታችን ኢየሱስ ክርስቶስ ሕይወት፣ ተአምራት እና ምሳሌዎች', 'om' => 'Jireenya fi dinqiiwwan Gooftaa'],
                    'credit_hour' => 3,
                ],
                [
                    'code' => 'DEV-G03-S1-02',
                    'name' => ['en' => 'Geez Grammar 3', 'am' => 'የግዕዝ ሰዋስው 3', 'om' => "Seerluga Gi'izii 3"],
                    'description' => ['en' => 'Geez verbs, nouns, and translation practice', 'am' => 'የግዕዝ ግሦች፣ ስሞች እና የትርጉም ልምምድ', 'om' => "Gochaalee fi hiika afaan Gi'izii"],
                    'credit_hour' => 2,
                ],
                [
                    'code' => 'DEV-G03-S1-03',
                    'name' => ['en' => 'Sacred Music & Zema 3', 'am' => 'ዜማ እና የቅዱስ ያሬድ ድጓ 3', 'om' => 'Faarfannaa Qulqulluu Yared 3'],
                    'description' => ['en' => 'The three chants of Saint Yared (Ge\'ez, Ezel, Araray)', 'am' => 'የቅዱስ ያሬድ ሦስቱ ዜማዎች (ግዕዝ፣ ዕዝል፣ አራራይ)', 'om' => "Zemaa qulqulluu Yaared (Gi'iz, Izil, Araaraay)"],
                    'credit_hour' => 2,
                ],
                // Semester 2 (3 courses)
                [
                    'code' => 'DEV-G03-S2-01',
                    'name' => ['en' => 'Orthodox Theology 3', 'am' => 'ኦርቶዶክሳዊ ነገረ-መለኮት 3', 'om' => 'Barnoota Amantaa Ortodoksii 3'],
                    'description' => ['en' => 'The Holy Trinity and the Incarnation of the Word', 'am' => 'ምሥጢረ ሥላሴ እና ምሥጢረ ሥጋዌ', 'om' => 'Iccitii Sillaasee fi Foon Uffachuu'],
                    'credit_hour' => 3,
                ],
                [
                    'code' => 'DEV-G03-S2-02',
                    'name' => ['en' => 'Church Canon & Law 3', 'am' => 'የቤተክርስቲያን ቀኖና 3', 'om' => 'Qanoonaa Waldaa Kiristaanaa 3'],
                    'description' => ['en' => 'Ecumenical Councils and the Canons of the Apostles', 'am' => 'ዓለም አቀፍ ጉባኤያት እና የሐዋርያት ቀኖና', 'om' => 'Walgahiiwwan fi seera ergamootaa'],
                    'credit_hour' => 2,
                ],
                [
                    'code' => 'DEV-G03-S2-03',
                    'name' => ['en' => 'Ethiopian Church History 3', 'am' => 'የኢትዮጵያ ቤተክርስቲያን ታሪክ 3', 'om' => 'Seenaa Waldaa Kiristaanaa Itoophiyaa 3'],
                    'description' => ['en' => 'Medieval golden age, Zagwe dynasty, and Lalibela rock churches', 'am' => 'የዛጔ ሥርወ መንግሥት እና የላሊበላ አብያተ ክርስቲያናት', 'om' => 'Seenaa Zaagwee fi Laallibalaa'],
                    'credit_hour' => 2,
                ],
            ],
            // Grade 4 (DEV-G04)
            3 => [
                // Semester 1 (3 courses)
                [
                    'code' => 'DEV-G04-S1-01',
                    'name' => ['en' => 'Advanced Gospel Studies 4', 'am' => 'ከፍተኛ የወንጌል ትምህርት 4', 'om' => "Qo'annoo Wangeelaa Olaanaa 4"],
                    'description' => ['en' => 'Epistles of Saint Paul and General Epistles', 'am' => 'የቅዱስ ጳውሎስ መልእክታት እና አጠቃላይ መልእክታት', 'om' => 'Ergaa qulqulluu Phaawuloos'],
                    'credit_hour' => 3,
                ],
                [
                    'code' => 'DEV-G04-S1-02',
                    'name' => ['en' => 'Geez Literature 4', 'am' => 'የግዕዝ ሥነ-ጽሑፍ 4', 'om' => "Og-barruu Gi'izii 4"],
                    'description' => ['en' => 'Reading and analysis of classic Geez texts and poetry', 'am' => 'የግዕዝ ድርሳናት፣ ገድላት እና ቅኔ ንባብ', 'om' => "Dubbisa fi xiinxala afaan Gi'izii"],
                    'credit_hour' => 2,
                ],
                [
                    'code' => 'DEV-G04-S1-03',
                    'name' => ['en' => 'Advanced Sacred Music 4', 'am' => 'ከፍተኛ የዜማ ትምህርት 4', 'om' => 'Barnoota Muuziqaa Qulqulluu 4'],
                    'description' => ['en' => 'Mastery of Digua, Me\'raf, and Zimare chants', 'am' => 'ድጓ፣ ምዕራፍ እና ዝማሬ ጥናት', 'om' => 'Barnoota Digwaa fi Zimaree'],
                    'credit_hour' => 2,
                ],
                // Semester 2 (3 courses)
                [
                    'code' => 'DEV-G04-S2-01',
                    'name' => ['en' => 'Dogmatics & Faith 4', 'am' => 'ሃይማኖተ አበው እና ነገረ ድኅነት 4', 'om' => 'Doogmaatiiksii fi Amantaa 4'],
                    'description' => ['en' => 'Patristic writings and Orthodox soteriology', 'am' => 'ሃይማኖተ አበው እና የድኅነት ትምህርት', 'om' => 'Barumsa amantaa abbootii fi fayyinaa'],
                    'credit_hour' => 3,
                ],
                [
                    'code' => 'DEV-G04-S2-02',
                    'name' => ['en' => 'Comparative Religion & Ethics 4', 'am' => 'ክርስቲያናዊ ሥነ-ምግባር እና ንጽጽር 4', 'om' => 'Naamusni fi Amantaa 4'],
                    'description' => ['en' => 'Christian apologetics, modern moral challenges, and ethics', 'am' => 'የሃይማኖት ጥበቃ እና ዘመናዊ ሥነ-ምግባራዊ ተግዳሮቶች', 'om' => 'Falmii amantaa fi naamusa ammayyaa'],
                    'credit_hour' => 2,
                ],
                [
                    'code' => 'DEV-G04-S2-03',
                    'name' => ['en' => 'Monasticism & Spirituality 4', 'am' => 'ምንኵስና እና መንፈሳዊ ሕይወት 4', 'om' => 'Jireenya Hafuuraa 4'],
                    'description' => ['en' => 'History of Desert Fathers, Ethiopian monasteries, and prayer', 'am' => 'የገዳማት ታሪክ፣ ምንኵስና እና መንፈሳዊ ተጋድሎ', 'om' => 'Seenaa gadaanotaa fi kadhannaa'],
                    'credit_hour' => 2,
                ],
            ],
        ];

        foreach ($gradeCurriculum as $gradeIndex => $gradeCourses) {
            $class = $classes[$gradeIndex];
            foreach ($gradeCourses as $data) {
                $courses[] = Course::updateOrCreate(
                    ['code' => $data['code']],
                    [
                        'class_id' => $class->id,
                        'name' => $data['name'],
                        'description' => $data['description'],
                        'credit_hour' => $data['credit_hour'],
                    ]
                );
            }
        }

        return $courses;
    }

    /**
     * Seed at least 20 students in each grade level (80 students total).
     * All members have complete, clean, realistic profiles with full English, Amharic, and Afaan Oromoo translations.
     *
     * @param list<SchoolClass> $classes
     */
    private function seedMembers(array $classes): \Illuminate\Support\Collection
    {
        $allStudentRosters = [
            // ── Grade 1 Students (20 students) ──────────────────────────
            0 => [
                [
                    'name' => ['en' => 'Dawit Yohannes', 'am' => 'ዳዊት ዮሐንስ', 'om' => 'Daawit Yohaannis'],
                    'christian_name' => ['en' => 'Wolde Giorgis', 'am' => 'ወልደ ጊዮርጊስ', 'om' => 'Walda Giyoorgis'],
                    'gender' => 'male',
                    'dob' => '2017-04-15',
                    'emergency' => ['en' => 'Yohannes Tekle', 'am' => 'ዮሐንስ ተክሌ', 'om' => 'Yohaannis Taklee'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Bethlehem Haile', 'am' => 'ቤተልሔም ኃይሌ', 'om' => 'Beetaliheem Hayilee'],
                    'christian_name' => ['en' => 'Walatta Petros', 'am' => 'ወለተ ጴጥሮስ', 'om' => 'Walatta Pheexroos'],
                    'gender' => 'female',
                    'dob' => '2017-08-22',
                    'emergency' => ['en' => 'Haile Gebre', 'am' => 'ኃይሌ ገብሬ', 'om' => 'Hayilee Gabree'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Samuel Tekle', 'am' => 'ሳሙኤል ተክሌ', 'om' => 'Saamu\'eel Taklee'],
                    'christian_name' => ['en' => 'Habte Selassie', 'am' => 'ሀብተ ሥላሴ', 'om' => 'Habta Sillaasee'],
                    'gender' => 'male',
                    'dob' => '2017-01-10',
                    'emergency' => ['en' => 'Tekle Mariam', 'am' => 'ተክለ ማርያም', 'om' => 'Takla Maariyaam'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Selamawit Desta', 'am' => 'ሰላማዊት ደስታ', 'om' => 'Salamaawit Dastaa'],
                    'christian_name' => ['en' => 'Walatta Mariam', 'am' => 'ወለተ ማርያም', 'om' => 'Walatta Maariyaam'],
                    'gender' => 'female',
                    'dob' => '2017-05-18',
                    'emergency' => ['en' => 'Desta Tadesse', 'am' => 'ደስታ ታደሰ', 'om' => 'Dastaa Taaddasaa'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Natnael Berhanu', 'am' => 'ናትናኤል ብርሃኑ', 'om' => 'Naatnaa\'eel Birhaanuu'],
                    'christian_name' => ['en' => 'Wolde Gabriel', 'am' => 'ወልደ ገብርኤል', 'om' => 'Walda Gabri\'eel'],
                    'gender' => 'male',
                    'dob' => '2017-11-03',
                    'emergency' => ['en' => 'Berhanu Negash', 'am' => 'ብርሃኑ ነጋሽ', 'om' => 'Birhaanuu Nagaash'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Hanna Mengistu', 'am' => 'ሐና መንግሥቱ', 'om' => 'Haannaa Mangistuu'],
                    'christian_name' => ['en' => 'Walatta Hanna', 'am' => 'ወለተ ሐና', 'om' => 'Walatta Haannaa'],
                    'gender' => 'female',
                    'dob' => '2017-03-30',
                    'emergency' => ['en' => 'Mengistu Worku', 'am' => 'መንግሥቱ ወርቁ', 'om' => 'Mangistuu Warquu'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Tewodros Girma', 'am' => 'ቴዎድሮስ ግርማ', 'om' => 'Teewodroos Girmaa'],
                    'christian_name' => ['en' => 'Gebre Meskel', 'am' => 'ገብረ መስቀል', 'om' => 'Gabra Masqal'],
                    'gender' => 'male',
                    'dob' => '2017-07-14',
                    'emergency' => ['en' => 'Girma Tadesse', 'am' => 'ግርማ ታደሰ', 'om' => 'Girmaa Taaddasaa'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Mahlet Alemu', 'am' => 'ማኅሌት ዓለሙ', 'om' => 'Maahleet Alamuu'],
                    'christian_name' => ['en' => 'Fiqre Mariam', 'am' => 'ፍቅረ ማርያም', 'om' => 'Fiqra Maariyaam'],
                    'gender' => 'female',
                    'dob' => '2017-09-25',
                    'emergency' => ['en' => 'Alemu Kebede', 'am' => 'ዓለሙ ከበደ', 'om' => 'Alamuu Kabbadaa'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Mikael Negash', 'am' => 'ሚካኤል ነጋሽ', 'om' => 'Mikaa\'eel Nagaash'],
                    'christian_name' => ['en' => 'Gebre Giorgis', 'am' => 'ገብረ ጊዮርጊስ', 'om' => 'Gabra Giyoorgis'],
                    'gender' => 'male',
                    'dob' => '2017-12-05',
                    'emergency' => ['en' => 'Negash Hailu', 'am' => 'ነጋሽ ኃይሉ', 'om' => 'Nagaash Haayiluu'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Ruth Solomon', 'am' => 'ሩት ሰሎሞን', 'om' => 'Ruut Solomoon'],
                    'christian_name' => ['en' => 'Walatta Tsion', 'am' => 'ወለተ ጽዮን', 'om' => 'Walatta Tsiyoon'],
                    'gender' => 'female',
                    'dob' => '2017-02-19',
                    'emergency' => ['en' => 'Solomon Getachew', 'am' => 'ሰሎሞን ጌታቸው', 'om' => 'Solomoon Geetaachoo'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Bereket Assefa', 'am' => 'በረከት አሰፋ', 'om' => 'Barakat Asaffaa'],
                    'christian_name' => ['en' => 'Tesfa Selassie', 'am' => 'ተስፋ ሥላሴ', 'om' => 'Tasfaa Sillaasee'],
                    'gender' => 'male',
                    'dob' => '2017-04-12',
                    'emergency' => ['en' => 'Assefa Belay', 'am' => 'አሰፋ በላይ', 'om' => 'Asaffaa Balaay'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Liya Kebede', 'am' => 'ሊያ ከበደ', 'om' => 'Liiyaa Kabbadaa'],
                    'christian_name' => ['en' => 'Walatta Kidan', 'am' => 'ወለተ ኪዳን', 'om' => 'Walatta Kidaan'],
                    'gender' => 'female',
                    'dob' => '2017-10-08',
                    'emergency' => ['en' => 'Kebede Mamo', 'am' => 'ከበደ ማሞ', 'om' => 'Kabbadaa Maammoo'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Yonatan Mamo', 'am' => 'ዮናታን ማሞ', 'om' => 'Yonaataan Maammoo'],
                    'christian_name' => ['en' => 'Wolde Yesus', 'am' => 'ወልደ ኢየሱስ', 'om' => 'Walda Yesuus'],
                    'gender' => 'male',
                    'dob' => '2017-06-20',
                    'emergency' => ['en' => 'Mamo Tilahun', 'am' => 'ማሞ ጥላሁን', 'om' => 'Maammoo Xilaahuun'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Eden Worku', 'am' => 'ኤደን ወርቁ', 'om' => 'Eedan Warquu'],
                    'christian_name' => ['en' => 'Walatta Michael', 'am' => 'ወለተ ሚካኤል', 'om' => 'Walatta Mikaa\'eel'],
                    'gender' => 'female',
                    'dob' => '2017-01-30',
                    'emergency' => ['en' => 'Worku Tilahun', 'am' => 'ወርቁ ጥላሁን', 'om' => 'Warquu Xilaahuun'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Abiel Tilahun', 'am' => 'አቢኤል ጥላሁን', 'om' => 'Abiyeel Xilaahuun'],
                    'christian_name' => ['en' => 'Gebre Mariam', 'am' => 'ገብረ ማርያም', 'om' => 'Gabra Maariyaam'],
                    'gender' => 'male',
                    'dob' => '2017-09-17',
                    'emergency' => ['en' => 'Tilahun Desta', 'am' => 'ጥላሁን ደስታ', 'om' => 'Xilaahuun Dastaa'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Meron Kassahun', 'am' => 'ሜሮን ካሣሁን', 'om' => 'Meeroon Kaasaahuun'],
                    'christian_name' => ['en' => 'Walatta Selassie', 'am' => 'ወለተ ሥላሴ', 'om' => 'Walatta Sillaasee'],
                    'gender' => 'female',
                    'dob' => '2017-03-12',
                    'emergency' => ['en' => 'Kassahun Bekele', 'am' => 'ካሣሁን በቀለ', 'om' => 'Kaasaahuun Baqqalaa'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Eyob Hailu', 'am' => 'ኢዮብ ኃይሉ', 'om' => 'Iyyob Haayiluu'],
                    'christian_name' => ['en' => 'Wolde Stephanos', 'am' => 'ወልደ እስጢፋኖስ', 'om' => 'Walda Isxifaanos'],
                    'gender' => 'male',
                    'dob' => '2017-07-28',
                    'emergency' => ['en' => 'Hailu Demisse', 'am' => 'ኃይሉ ደሚሴ', 'om' => 'Haayiluu Damissee'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Tsion Gebre', 'am' => 'ጽዮን ገብሬ', 'om' => 'Tsiyoon Gabree'],
                    'christian_name' => ['en' => 'Walatta Medhanit', 'am' => 'ወለተ መድኃኒት', 'om' => 'Walatta Madhaanit'],
                    'gender' => 'female',
                    'dob' => '2017-11-15',
                    'emergency' => ['en' => 'Gebre Yesus', 'am' => 'ገብረ ኢየሱስ', 'om' => 'Gabra Yesuus'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Daniel Wasihun', 'am' => 'ዳንኤል ዋሲሁን', 'om' => 'Daani\'eel Waasihuun'],
                    'christian_name' => ['en' => 'Wolde Giorgis', 'am' => 'ወልደ ጊዮርጊስ', 'om' => 'Walda Giyoorgis'],
                    'gender' => 'male',
                    'dob' => '2017-05-04',
                    'emergency' => ['en' => 'Wasihun Tekle', 'am' => 'ዋሲሁን ተክሌ', 'om' => 'Waasihuun Taklee'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Rahel Belay', 'am' => 'ራሔል በላይ', 'om' => 'Raaheel Balaay'],
                    'christian_name' => ['en' => 'Walatta Yohannes', 'am' => 'ወለተ ዮሐንስ', 'om' => 'Walatta Yohaannis'],
                    'gender' => 'female',
                    'dob' => '2017-12-20',
                    'emergency' => ['en' => 'Belayneh Asrat', 'am' => 'በላይነህ አስራት', 'om' => 'Balaaynah Asraat'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
            ],

            // ── Grade 2 Students (20 students) ──────────────────────────
            1 => [
                [
                    'name' => ['en' => 'Abel Tesfaye', 'am' => 'አቤል ተስፋዬ', 'om' => 'Abee Tasfaayee'],
                    'christian_name' => ['en' => 'Wolde Roufael', 'am' => 'ወልደ ሩፋኤል', 'om' => 'Walda Rufaa\'eel'],
                    'gender' => 'male',
                    'dob' => '2016-04-14',
                    'emergency' => ['en' => 'Tesfaye Wolde', 'am' => 'ተስፋዬ ወልዴ', 'om' => 'Tasfaayee Waldee'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Sara Alemayehu', 'am' => 'ሣራ አለማየሁ', 'om' => 'Saaraa Alamayyahuu'],
                    'christian_name' => ['en' => 'Walatta Teklehaimanot', 'am' => 'ወለተ ተክለሃይማኖት', 'om' => 'Walatta Taklahaymaanot'],
                    'gender' => 'female',
                    'dob' => '2016-08-19',
                    'emergency' => ['en' => 'Alemayehu Fikre', 'am' => 'አለማየሁ ፍቅሬ', 'om' => 'Alamayyahuu Fiqree'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Kirubel Getachew', 'am' => 'ኪሩቤል ጌታቸው', 'om' => 'Kiiruubeel Geetaachoo'],
                    'christian_name' => ['en' => 'Gebre Kidan', 'am' => 'ገብረ ኪዳን', 'om' => 'Gabra Kidaan'],
                    'gender' => 'male',
                    'dob' => '2016-01-25',
                    'emergency' => ['en' => 'Getachew Bogale', 'am' => 'ጌታቸው ቦጋለ', 'om' => 'Geetaachoo Boggalaa'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Yordanos Fikru', 'am' => 'ዮርዳኖስ ፍቅሩ', 'om' => 'Yordaanoos Fiqruu'],
                    'christian_name' => ['en' => 'Walatta Gabriel', 'am' => 'ወለተ ገብርኤል', 'om' => 'Walatta Gabri\'eel'],
                    'gender' => 'female',
                    'dob' => '2016-06-11',
                    'emergency' => ['en' => 'Fikru Melaku', 'am' => 'ፍቅሩ መላኩ', 'om' => 'Fiqruu Malaakuu'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Henok Bekele', 'am' => 'ሄኖክ በቀለ', 'om' => 'Heenook Baqqalaa'],
                    'christian_name' => ['en' => 'Wolde Selassie', 'am' => 'ወልደ ሥላሴ', 'om' => 'Walda Sillaasee'],
                    'gender' => 'male',
                    'dob' => '2016-10-05',
                    'emergency' => ['en' => 'Bekele Desta', 'am' => 'በቀለ ደስታ', 'om' => 'Baqqalaa Dastaa'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Martha Tadesse', 'am' => 'ማርታ ታደሰ', 'om' => 'Maartaa Taaddasaa'],
                    'christian_name' => ['en' => 'Walatta Yesus', 'am' => 'ወለተ ኢየሱስ', 'om' => 'Walatta Yesuus'],
                    'gender' => 'female',
                    'dob' => '2016-03-22',
                    'emergency' => ['en' => 'Tadesse Assefa', 'am' => 'ታደሰ አሰፋ', 'om' => 'Taaddasaa Asaffaa'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Bisrat Mekonnen', 'am' => 'ብሥራት መኮንን', 'om' => 'Bisraat Makonnin'],
                    'christian_name' => ['en' => 'Habte Mariam', 'am' => 'ሀብተ ማርያም', 'om' => 'Habta Maariyaam'],
                    'gender' => 'male',
                    'dob' => '2016-07-09',
                    'emergency' => ['en' => 'Mekonnen Hailu', 'am' => 'መኮንን ኃይሉ', 'om' => 'Makonnin Haayiluu'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Feven Habte', 'am' => 'ፌቨን ሀብቴ', 'om' => 'Feevan Habtee'],
                    'christian_name' => ['en' => 'Walatta Giorgis', 'am' => 'ወለተ ጊዮርጊስ', 'om' => 'Walatta Giyoorgis'],
                    'gender' => 'female',
                    'dob' => '2016-09-14',
                    'emergency' => ['en' => 'Habte Yesus', 'am' => 'ሀብተ ኢየሱስ', 'om' => 'Habta Yesuus'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Nahom Eshetu', 'am' => 'ናሆም እሸቱ', 'om' => 'Naahom Ishatuu'],
                    'christian_name' => ['en' => 'Gebre Kristos', 'am' => 'ገብረ ክርስቶስ', 'om' => 'Gabra Kirstoos'],
                    'gender' => 'male',
                    'dob' => '2016-11-30',
                    'emergency' => ['en' => 'Eshetu Tilahun', 'am' => 'እሸቱ ጥላሁን', 'om' => 'Ishatuu Xilaahuun'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Senait Chernet', 'am' => 'ሰናይት ቸርነት', 'om' => 'Sannaayit Charnat'],
                    'christian_name' => ['en' => 'Walatta Berhan', 'am' => 'ወለተ ብርሃን', 'om' => 'Walatta Birhaan'],
                    'gender' => 'female',
                    'dob' => '2016-02-18',
                    'emergency' => ['en' => 'Chernet Worku', 'am' => 'ቸርነት ወርቁ', 'om' => 'Charnat Warquu'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Caleb Zewdu', 'am' => 'ካሌብ ዘውዱ', 'om' => 'Kaaleeb Zawduu'],
                    'christian_name' => ['en' => 'Wolde Medhanit', 'am' => 'ወልደ መድኃኒት', 'om' => 'Walda Madhaanit'],
                    'gender' => 'male',
                    'dob' => '2016-05-27',
                    'emergency' => ['en' => 'Zewdu Mamo', 'am' => 'ዘውዱ ማሞ', 'om' => 'Zawduu Maammoo'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Kidan Wolde', 'am' => 'ኪዳን ወልዴ', 'om' => 'Kidaan Waldee'],
                    'christian_name' => ['en' => 'Walatta Ruphael', 'am' => 'ወለተ ሩፋኤል', 'om' => 'Walatta Rufaa\'eel'],
                    'gender' => 'female',
                    'dob' => '2016-08-04',
                    'emergency' => ['en' => 'Wolde Senbet', 'am' => 'ወልደ ሰንበት', 'om' => 'Walda Sanbat'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Surafel Ayalew', 'am' => 'ሱራፌል አያሌው', 'om' => 'Suraafeel Ayyalaw'],
                    'christian_name' => ['en' => 'Gebre Menfes Kidus', 'am' => 'ገብረ መንፈስ ቅዱስ', 'om' => 'Gabra Manfas Qulqulluu'],
                    'gender' => 'male',
                    'dob' => '2016-12-15',
                    'emergency' => ['en' => 'Ayalew Kassahun', 'am' => 'አያሌው ካሣሁን', 'om' => 'Ayyalaw Kaasaahuun'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Helen Gashaw', 'am' => 'ሔለን ጋሻው', 'om' => 'Heelanii Gaashaw'],
                    'christian_name' => ['en' => 'Walatta Kidusan', 'am' => 'ወለተ ቅዱሳን', 'om' => 'Walatta Qulqullootaa'],
                    'gender' => 'female',
                    'dob' => '2016-04-02',
                    'emergency' => ['en' => 'Gashaw Belay', 'am' => 'ጋሻው በላይ', 'om' => 'Gaashaw Balaay'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Yared Teshome', 'am' => 'ያሬድ ተሾመ', 'om' => 'Yaareed Tashoomaa'],
                    'christian_name' => ['en' => 'Wolde Dawit', 'am' => 'ወልደ ዳዊት', 'om' => 'Walda Daawit'],
                    'gender' => 'male',
                    'dob' => '2016-07-21',
                    'emergency' => ['en' => 'Teshome Girma', 'am' => 'ተሾመ ግርማ', 'om' => 'Tashoomaa Girmaa'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Tigist Sisay', 'am' => 'ትዕግሥት ሲሳይ', 'om' => 'Ti\'igist Siisaay'],
                    'christian_name' => ['en' => 'Walatta Selassie', 'am' => 'ወለተ ሥላሴ', 'om' => 'Walatta Sillaasee'],
                    'gender' => 'female',
                    'dob' => '2016-10-18',
                    'emergency' => ['en' => 'Sisay Desta', 'am' => 'ሲሳይ ደስታ', 'om' => 'Siisaay Dastaa'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Temesgen Aklilu', 'am' => 'ተመስገን አክሊሉ', 'om' => 'Tamasgeen Akliiluu'],
                    'christian_name' => ['en' => 'Habte Gabriel', 'am' => 'ሀብተ ገብርኤል', 'om' => 'Habta Gabri\'eel'],
                    'gender' => 'male',
                    'dob' => '2016-01-14',
                    'emergency' => ['en' => 'Aklilu Hailu', 'am' => 'አክሊሉ ኃይሉ', 'om' => 'Akliiluu Haayiluu'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Genet Bogale', 'am' => 'ገነት ቦጋለ', 'om' => 'Gannat Boggalaa'],
                    'christian_name' => ['en' => 'Walatta Amanuel', 'am' => 'ወለተ አማኑኤል', 'om' => 'Walatta Aamaanu\'eel'],
                    'gender' => 'female',
                    'dob' => '2016-06-29',
                    'emergency' => ['en' => 'Bogale Worku', 'am' => 'ቦጋለ ወርቁ', 'om' => 'Boggalaa Warquu'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Robel Demisse', 'am' => 'ሮቤል ደሚሴ', 'om' => 'Roobeel Damissee'],
                    'christian_name' => ['en' => 'Wolde Michael', 'am' => 'ወልደ ሚካኤል', 'om' => 'Walda Mikaa\'eel'],
                    'gender' => 'male',
                    'dob' => '2016-09-08',
                    'emergency' => ['en' => 'Demisse Assefa', 'am' => 'ደሚሴ አሰፋ', 'om' => 'Damissee Asaffaa'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Kalkidan Tariku', 'am' => 'ቃልኪዳን ታሪኩ', 'om' => 'Qaalkidaan Taarikuu'],
                    'christian_name' => ['en' => 'Walatta Maryam', 'am' => 'ወለተ ማርያም', 'om' => 'Walatta Maariyaam'],
                    'gender' => 'female',
                    'dob' => '2016-11-12',
                    'emergency' => ['en' => 'Tariku Belay', 'am' => 'ታሪኩ በላይ', 'om' => 'Taarikuu Balaay'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
            ],

            // ── Grade 3 Students (20 students) ──────────────────────────
            2 => [
                [
                    'name' => ['en' => 'Aman Asrat', 'am' => 'አማን አስራት', 'om' => 'Amaan Asraat'],
                    'christian_name' => ['en' => 'Wolde Ammanuel', 'am' => 'ወልደ አማኑኤል', 'om' => 'Walda Aamaanu\'eel'],
                    'gender' => 'male',
                    'dob' => '2015-03-16',
                    'emergency' => ['en' => 'Asrat Worku', 'am' => 'አስራት ወርቁ', 'om' => 'Asraat Warquu'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Hermela Bayeh', 'am' => 'ሔርሜላ ባየህ', 'om' => 'Heermeelaa Baayyee'],
                    'christian_name' => ['en' => 'Walatta Fiqre', 'am' => 'ወለተ ፍቅሬ', 'om' => 'Walatta Fiqree'],
                    'gender' => 'female',
                    'dob' => '2015-07-24',
                    'emergency' => ['en' => 'Bayeh Desta', 'am' => 'ባየህ ደስታ', 'om' => 'Baayyee Dastaa'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Elias Wondimu', 'am' => 'ኤልያስ ወንድሙ', 'om' => 'Eeliyaas Wandimmuu'],
                    'christian_name' => ['en' => 'Gebre Yohannes', 'am' => 'ገብረ ዮሐንስ', 'om' => 'Gabra Yohaannis'],
                    'gender' => 'male',
                    'dob' => '2015-11-09',
                    'emergency' => ['en' => 'Wondimu Gebre', 'am' => 'ወንድሙ ገብሬ', 'om' => 'Wandimmuu Gabree'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Hawi Melaku', 'am' => 'ሐዊ መላኩ', 'om' => 'Haawii Malaakuu'],
                    'christian_name' => ['en' => 'Walatta Kidan', 'am' => 'ወለተ ኪዳን', 'om' => 'Walatta Kidaan'],
                    'gender' => 'female',
                    'dob' => '2015-02-14',
                    'emergency' => ['en' => 'Melaku Tilahun', 'am' => 'መላኩ ጥላሁን', 'om' => 'Malaakuu Xilaahuun'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Fitsum Dagne', 'am' => 'ፍጹም ዳኘ', 'om' => 'Fitsum Daannee'],
                    'christian_name' => ['en' => 'Habte Yesus', 'am' => 'ሀብተ ኢየሱስ', 'om' => 'Habta Yesuus'],
                    'gender' => 'male',
                    'dob' => '2015-05-30',
                    'emergency' => ['en' => 'Dagne Assefa', 'am' => 'ዳኘ አሰፋ', 'om' => 'Daannee Asaffaa'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Gelila Zerihun', 'am' => 'ገሊላ ዘሪሁን', 'om' => 'Galiilaa Zariihuun'],
                    'christian_name' => ['en' => 'Walatta Tsion', 'am' => 'ወለተ ጽዮን', 'om' => 'Walatta Tsiyoon'],
                    'gender' => 'female',
                    'dob' => '2015-08-17',
                    'emergency' => ['en' => 'Zerihun Kassahun', 'am' => 'ዘሪሁን ካሣሁን', 'om' => 'Zariihuun Kaasaahuun'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Biniyam Seyoum', 'am' => 'ቢንያም ሥዩም', 'om' => 'Biiniyaam Siyyum'],
                    'christian_name' => ['en' => 'Wolde Giorgis', 'am' => 'ወልደ ጊዮርጊስ', 'om' => 'Walda Giyoorgis'],
                    'gender' => 'male',
                    'dob' => '2015-10-22',
                    'emergency' => ['en' => 'Seyoum Bogale', 'am' => 'ሥዩም ቦጋለ', 'om' => 'Siyyum Boggalaa'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Mekdes Tamirat', 'am' => 'መቅደስ ታምራት', 'om' => 'Maqdas Taamiraat'],
                    'christian_name' => ['en' => 'Walatta Gabriel', 'am' => 'ወለተ ገብርኤል', 'om' => 'Walatta Gabri\'eel'],
                    'gender' => 'female',
                    'dob' => '2015-01-08',
                    'emergency' => ['en' => 'Tamirat Worku', 'am' => 'ታምራት ወርቁ', 'om' => 'Taamiraat Warquu'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Yabsira Shiferaw', 'am' => 'ያብስራ ሽፈራው', 'om' => 'Yaabsiraa Shifarraaw'],
                    'christian_name' => ['en' => 'Gebre Medhanit', 'am' => 'ገብረ መድኃኒት', 'om' => 'Gabra Madhaanit'],
                    'gender' => 'male',
                    'dob' => '2015-04-19',
                    'emergency' => ['en' => 'Shiferaw Hailu', 'am' => 'ሽፈራው ኃይሉ', 'om' => 'Shifarraaw Haayiluu'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Blen Kinfu', 'am' => 'ብሌን ክንፉ', 'om' => 'Bileen Kinfuu'],
                    'christian_name' => ['en' => 'Walatta Michael', 'am' => 'ወለተ ሚካኤል', 'om' => 'Walatta Mikaa\'eel'],
                    'gender' => 'female',
                    'dob' => '2015-06-27',
                    'emergency' => ['en' => 'Kinfu Tadesse', 'am' => 'ክንፉ ታደሰ', 'om' => 'Kinfuu Taaddasaa'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Leul Solomon', 'am' => 'ልዑል ሰሎሞን', 'om' => 'Li\'ul Solomoon'],
                    'christian_name' => ['en' => 'Wolde Dawit', 'am' => 'ወልደ ዳዊት', 'om' => 'Walda Daawit'],
                    'gender' => 'male',
                    'dob' => '2015-09-03',
                    'emergency' => ['en' => 'Solomon Belay', 'am' => 'ሰሎሞን በላይ', 'om' => 'Solomoon Balaay'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Samrawit Abebe', 'am' => 'ሳምራዊት አበበ', 'om' => 'Saamraawit Abbabaa'],
                    'christian_name' => ['en' => 'Walatta Mariam', 'am' => 'ወለተ ማርያም', 'om' => 'Walatta Maariyaam'],
                    'gender' => 'female',
                    'dob' => '2015-12-11',
                    'emergency' => ['en' => 'Abebe Girma', 'am' => 'አበበ ግርማ', 'om' => 'Abbabaa Girmaa'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Fasil Workneh', 'am' => 'ፋሲል ወርቅነህ', 'om' => 'Faasiil Warqinah'],
                    'christian_name' => ['en' => 'Habte Selassie', 'am' => 'ሀብተ ሥላሴ', 'om' => 'Habta Sillaasee'],
                    'gender' => 'male',
                    'dob' => '2015-03-05',
                    'emergency' => ['en' => 'Workneh Desta', 'am' => 'ወርቅነህ ደስታ', 'om' => 'Warqinah Dastaa'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Nardos Woldu', 'am' => 'ናርዶስ ወልዱ', 'om' => 'Naardoos Walduu'],
                    'christian_name' => ['en' => 'Walatta Petros', 'am' => 'ወለተ ጴጥሮስ', 'om' => 'Walatta Pheexroos'],
                    'gender' => 'female',
                    'dob' => '2015-07-15',
                    'emergency' => ['en' => 'Woldu Tekle', 'am' => 'ወልዱ ተክሌ', 'om' => 'Walduu Taklee'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Dagmawi Mulugeta', 'am' => 'ዳግማዊ ሙሉጌታ', 'om' => 'Daagmaawii Muluugeetaa'],
                    'christian_name' => ['en' => 'Wolde Stephanos', 'am' => 'ወልደ እስጢፋኖስ', 'om' => 'Walda Isxifaanos'],
                    'gender' => 'male',
                    'dob' => '2015-11-28',
                    'emergency' => ['en' => 'Mulugeta Assefa', 'am' => 'ሙሉጌታ አሰፋ', 'om' => 'Muluugeetaa Asaffaa'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Betelhem Girma', 'am' => 'ቤተልሔም ግርማ', 'om' => 'Beetaliheem Girmaa'],
                    'christian_name' => ['en' => 'Walatta Hanna', 'am' => 'ወለተ ሐና', 'om' => 'Walatta Haannaa'],
                    'gender' => 'female',
                    'dob' => '2015-02-23',
                    'emergency' => ['en' => 'Girma Hailu', 'am' => 'ግርማ ኃይሉ', 'om' => 'Girmaa Haayiluu'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Efrata Daniel', 'am' => 'ኤፍራታ ዳንኤል', 'om' => 'Eefraataa Daani\'eel'],
                    'christian_name' => ['en' => 'Walatta Berhan', 'am' => 'ወለተ ብርሃን', 'om' => 'Walatta Birhaan'],
                    'gender' => 'female',
                    'dob' => '2015-05-12',
                    'emergency' => ['en' => 'Daniel Kebede', 'am' => 'ዳንኤል ከበደ', 'om' => 'Daani\'eel Kabbadaa'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Michael Yohannes', 'am' => 'ሚካኤል ዮሐንስ', 'om' => 'Mikaa\'eel Yohaannis'],
                    'christian_name' => ['en' => 'Gebre Menfes Kidus', 'am' => 'ገብረ መንፈስ ቅዱስ', 'om' => 'Gabra Manfas Qulqulluu'],
                    'gender' => 'male',
                    'dob' => '2015-08-31',
                    'emergency' => ['en' => 'Yohannes Tadesse', 'am' => 'ዮሐንስ ታደሰ', 'om' => 'Yohaannis Taaddasaa'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Meseret Mengistu', 'am' => 'መሰረት መንግሥቱ', 'om' => 'Masarat Mangistuu'],
                    'christian_name' => ['en' => 'Walatta Yesus', 'am' => 'ወለተ ኢየሱስ', 'om' => 'Walatta Yesuus'],
                    'gender' => 'female',
                    'dob' => '2015-10-14',
                    'emergency' => ['en' => 'Mengistu Desta', 'am' => 'መንግሥቱ ደስታ', 'om' => 'Mangistuu Dastaa'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Yohannes Kebede', 'am' => 'ዮሐንስ ከበደ', 'om' => 'Yohaannis Kabbadaa'],
                    'christian_name' => ['en' => 'Wolde Gabriel', 'am' => 'ወልደ ገብርኤል', 'om' => 'Walda Gabri\'eel'],
                    'gender' => 'male',
                    'dob' => '2015-12-03',
                    'emergency' => ['en' => 'Kebede Belay', 'am' => 'ከበደ በላይ', 'om' => 'Kabbadaa Balaay'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
            ],

            // ── Grade 4 Students (20 students) ──────────────────────────
            3 => [
                [
                    'name' => ['en' => 'Eyouel Haile', 'am' => 'እዩኤል ኃይሌ', 'om' => 'Iyu\'eel Hayilee'],
                    'christian_name' => ['en' => 'Wolde Giorgis', 'am' => 'ወልደ ጊዮርጊስ', 'om' => 'Walda Giyoorgis'],
                    'gender' => 'male',
                    'dob' => '2014-04-18',
                    'emergency' => ['en' => 'Haile Yesus', 'am' => 'ኃይለ ኢየሱስ', 'om' => 'Hayila Yesuus'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Saron Tilahun', 'am' => 'ሳሮን ጥላሁን', 'om' => 'Saaron Xilaahuun'],
                    'christian_name' => ['en' => 'Walatta Kidan', 'am' => 'ወለተ ኪዳን', 'om' => 'Walatta Kidaan'],
                    'gender' => 'female',
                    'dob' => '2014-08-25',
                    'emergency' => ['en' => 'Tilahun Worku', 'am' => 'ጥላሁን ወርቁ', 'om' => 'Xilaahuun Warquu'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Zerihun Tefera', 'am' => 'ዘሪሁን ተፈራ', 'om' => 'Zariihuun Taffarraa'],
                    'christian_name' => ['en' => 'Gebre Kristos', 'am' => 'ገብረ ክርስቶስ', 'om' => 'Gabra Kirstoos'],
                    'gender' => 'male',
                    'dob' => '2014-01-12',
                    'emergency' => ['en' => 'Tefera Mamo', 'am' => 'ተፈራ ማሞ', 'om' => 'Taffarraa Maammoo'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Lidya Negash', 'am' => 'ሊዲያ ነጋሽ', 'om' => 'Liidiyaa Nagaash'],
                    'christian_name' => ['en' => 'Walatta Tsion', 'am' => 'ወለተ ጽዮን', 'om' => 'Walatta Tsiyoon'],
                    'gender' => 'female',
                    'dob' => '2014-05-29',
                    'emergency' => ['en' => 'Negash Belay', 'am' => 'ነጋሽ በላይ', 'om' => 'Nagaash Balaay'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Natnael Belay', 'am' => 'ናትናኤል በላይ', 'om' => 'Naatnaa\'eel Balaay'],
                    'christian_name' => ['en' => 'Habte Mariam', 'am' => 'ሀብተ ማርያም', 'om' => 'Habta Maariyaam'],
                    'gender' => 'male',
                    'dob' => '2014-09-07',
                    'emergency' => ['en' => 'Belayneh Assefa', 'am' => 'በላይነህ አሰፋ', 'om' => 'Balaaynah Asaffaa'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Kidist Assefa', 'am' => 'ቅድስት አሰፋ', 'om' => 'Qiddist Asaffaa'],
                    'christian_name' => ['en' => 'Walatta Petros', 'am' => 'ወለተ ጴጥሮስ', 'om' => 'Walatta Pheexroos'],
                    'gender' => 'female',
                    'dob' => '2014-11-19',
                    'emergency' => ['en' => 'Assefa Desta', 'am' => 'አሰፋ ደስታ', 'om' => 'Asaffaa Dastaa'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Markos Getnet', 'am' => 'ማርቆስ ጌትነት', 'om' => 'Maarqoos Geetanat'],
                    'christian_name' => ['en' => 'Wolde Selassie', 'am' => 'ወልደ ሥላሴ', 'om' => 'Walda Sillaasee'],
                    'gender' => 'male',
                    'dob' => '2014-03-21',
                    'emergency' => ['en' => 'Getnet Hailu', 'am' => 'ጌትነት ኃይሉ', 'om' => 'Geetanat Haayiluu'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Sosina Tesfaye', 'am' => 'ሶስና ተስፋዬ', 'om' => 'Sosinaa Tasfaayee'],
                    'christian_name' => ['en' => 'Walatta Gabriel', 'am' => 'ወለተ ገብርኤል', 'om' => 'Walatta Gabri\'eel'],
                    'gender' => 'female',
                    'dob' => '2014-07-04',
                    'emergency' => ['en' => 'Tesfaye Tadesse', 'am' => 'ተስፋዬ ታደሰ', 'om' => 'Tasfaayee Taaddasaa'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Barnabas Desta', 'am' => 'በርናባስ ደስታ', 'om' => 'Barnaabaas Dastaa'],
                    'christian_name' => ['en' => 'Gebre Mariam', 'am' => 'ገብረ ማርያም', 'om' => 'Gabra Maariyaam'],
                    'gender' => 'male',
                    'dob' => '2014-10-16',
                    'emergency' => ['en' => 'Desta Bogale', 'am' => 'ደስታ ቦጋለ', 'om' => 'Dastaa Boggalaa'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Deborah Hailu', 'am' => 'ዲቦራ ኃይሉ', 'om' => 'Dibooraa Haayiluu'],
                    'christian_name' => ['en' => 'Walatta Michael', 'am' => 'ወለተ ሚካኤል', 'om' => 'Walatta Mikaa\'eel'],
                    'gender' => 'female',
                    'dob' => '2014-02-08',
                    'emergency' => ['en' => 'Hailu Kassahun', 'am' => 'ኃይሉ ካሣሁን', 'om' => 'Haayiluu Kaasaahuun'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Ezra Berihun', 'am' => 'ዕዝራ በሪሁን', 'om' => 'Izraa Bariihuun'],
                    'christian_name' => ['en' => 'Wolde Medhanit', 'am' => 'ወልደ መድኃኒት', 'om' => 'Walda Madhaanit'],
                    'gender' => 'male',
                    'dob' => '2014-06-15',
                    'emergency' => ['en' => 'Berihun Worku', 'am' => 'በሪሁን ወርቁ', 'om' => 'Bariihuun Warquu'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Fasika Alemu', 'am' => 'ፋሲካ ዓለሙ', 'om' => 'Faasiikaa Alamuu'],
                    'christian_name' => ['en' => 'Walatta Hanna', 'am' => 'ወለተ ሐና', 'om' => 'Walatta Haannaa'],
                    'gender' => 'female',
                    'dob' => '2014-08-30',
                    'emergency' => ['en' => 'Alemu Tilahun', 'am' => 'ዓለሙ ጥላሁን', 'om' => 'Alamuu Xilaahuun'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Gashaw Worku', 'am' => 'ጋሻው ወርቁ', 'om' => 'Gaashaw Warquu'],
                    'christian_name' => ['en' => 'Habte Gabriel', 'am' => 'ሀብተ ገብርኤል', 'om' => 'Habta Gabri\'eel'],
                    'gender' => 'male',
                    'dob' => '2014-12-22',
                    'emergency' => ['en' => 'Worku Desta', 'am' => 'ወርቁ ደስታ', 'om' => 'Warquu Dastaa'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Hiwot Tadesse', 'am' => 'ሕይወት ታደሰ', 'om' => 'Hiywoot Taaddasaa'],
                    'christian_name' => ['en' => 'Walatta Mariam', 'am' => 'ወለተ ማርያም', 'om' => 'Walatta Maariyaam'],
                    'gender' => 'female',
                    'dob' => '2014-04-03',
                    'emergency' => ['en' => 'Tadesse Belay', 'am' => 'ታደሰ በላይ', 'om' => 'Taaddasaa Balaay'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Ismael Bekele', 'am' => 'እስማኤል በቀለ', 'om' => 'Ismaa\'eel Baqqalaa'],
                    'christian_name' => ['en' => 'Wolde Yesus', 'am' => 'ወልደ ኢየሱስ', 'om' => 'Walda Yesuus'],
                    'gender' => 'male',
                    'dob' => '2014-07-17',
                    'emergency' => ['en' => 'Bekele Girma', 'am' => 'በቀለ ግርማ', 'om' => 'Baqqalaa Girmaa'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
                [
                    'name' => ['en' => 'Jerusalem Mekonnen', 'am' => 'እየሩሳሌም መኮንን', 'om' => 'Iyyarusaaleem Makonnin'],
                    'christian_name' => ['en' => 'Walatta Selassie', 'am' => 'ወለተ ሥላሴ', 'om' => 'Walatta Sillaasee'],
                    'gender' => 'female',
                    'dob' => '2014-09-26',
                    'emergency' => ['en' => 'Mekonnen Hailu', 'am' => 'መኮንን ኃይሉ', 'om' => 'Makonnin Haayiluu'],
                    'clergy' => ['en' => 'Qes Wolde Mariam', 'am' => 'ቀሲስ ወልደ ማርያም', 'om' => 'Lubbuu Walda Maariyaam'],
                ],
                [
                    'name' => ['en' => 'Kaleb Cheru', 'am' => 'ካሌብ ቸሩ', 'om' => 'Kaaleeb Charuu'],
                    'christian_name' => ['en' => 'Gebre Menfes Kidus', 'am' => 'ገብረ መንፈስ ቅዱስ', 'om' => 'Gabra Manfas Qulqulluu'],
                    'gender' => 'male',
                    'dob' => '2014-11-10',
                    'emergency' => ['en' => 'Cheru Mamo', 'am' => 'ቸሩ ማሞ', 'om' => 'Charuu Maammoo'],
                    'clergy' => ['en' => 'Megabi Hadis Eshetu', 'am' => 'መጋቤ ሐዲስ እሸቱ', 'om' => 'Megaabii Haadiis Ishatuu'],
                ],
                [
                    'name' => ['en' => 'Lensa Girma', 'am' => 'ሌንሳ ግርማ', 'om' => 'Leensaa Girmaa'],
                    'christian_name' => ['en' => 'Walatta Amanuel', 'am' => 'ወለተ አማኑኤል', 'om' => 'Walatta Aamaanu\'eel'],
                    'gender' => 'female',
                    'dob' => '2014-01-29',
                    'emergency' => ['en' => 'Girma Assefa', 'am' => 'ግርማ አሰፋ', 'om' => 'Girmaa Asaffaa'],
                    'clergy' => ['en' => 'Melake Selam Berhanu', 'am' => 'መልአከ ሰላም ብርሃኑ', 'om' => 'Mala\'aka Salaam Birhaanuu'],
                ],
                [
                    'name' => ['en' => 'Matias Wondwossen', 'am' => 'ማትያስ ወንድወሰን', 'om' => 'Maatiyaas Wandwasan'],
                    'christian_name' => ['en' => 'Wolde Ammanuel', 'am' => 'ወልደ አማኑኤል', 'om' => 'Walda Aamaanu\'eel'],
                    'gender' => 'male',
                    'dob' => '2014-05-14',
                    'emergency' => ['en' => 'Wondwossen Desta', 'am' => 'ወንድወሰን ደስታ', 'om' => 'Wandwasan Dastaa'],
                    'clergy' => ['en' => 'Qes Haile Yesus', 'am' => 'ቀሲስ ኃይለ ኢየሱስ', 'om' => 'Lubbuu Hayila Yesuus'],
                ],
                [
                    'name' => ['en' => 'Rebecca Solomon', 'am' => 'ርብቃ ሰሎሞን', 'om' => 'Ribqaa Solomoon'],
                    'christian_name' => ['en' => 'Walatta Berhan', 'am' => 'ወለተ ብርሃን', 'om' => 'Walatta Birhaan'],
                    'gender' => 'female',
                    'dob' => '2014-10-01',
                    'emergency' => ['en' => 'Solomon Tadesse', 'am' => 'ሰሎሞን ታደሰ', 'om' => 'Solomoon Taaddasaa'],
                    'clergy' => ['en' => 'Komos Abba Gebre', 'am' => 'ቆሞስ አባ ገብረ', 'om' => 'Qoophos Abbaa Gabree'],
                ],
            ],
        ];

        $members = collect();
        $globalCounter = 0;

        foreach ($allStudentRosters as $gradeIndex => $roster) {
            $class = $classes[$gradeIndex];

            foreach ($roster as $data) {
                $globalCounter++;
                $phone = sprintf('+1-202-555-%04d', 100 + $globalCounter);

                $member = Member::withTrashed()->updateOrCreate(
                    ['phone_number' => $phone],
                    [
                        'full_name' => $data['name'],
                        'christian_name' => $data['christian_name'],
                        'date_of_birth' => $data['dob'],
                        'gender' => $data['gender'],
                        'emergency_contact_name' => $data['emergency'],
                        'emergency_contact_phone' => '+1-202-555-0199',
                        'membership_date' => Carbon::parse('2023-09-01')->addDays($globalCounter)->toDateString(),
                        'sol_father_name' => $data['clergy'],
                        'class_id' => $class->id,
                        'section' => 'A',
                        'deleted_at' => null,
                    ]
                );

                $members->push($member);
            }
        }

        return $members;
    }

    /**
     * @param \Illuminate\Support\Collection<int, Member> $members
     * @param list<SchoolClass> $classes
     */
    private function seedEnrollments($members, array $classes, AcademicYear $year): void
    {
        $service = app(StudentEnrollmentService::class);
        $start = Carbon::parse($year->start_date)->toDateString();

        foreach ($members as $member) {
            if ($member->enrollments()->where('academic_year_id', $year->id)->whereNull('end_date')->exists()) {
                continue;
            }

            $service->enroll($member->id, $year->id, $member->class_id, $member->section ?? 'A', $start);
        }
    }

    /**
     * Seed teaching assignments for all 24 courses (3 per semester in each grade).
     *
     * @param list<Course> $courses
     * @return list<TeachingAssignment>
     */
    private function seedTeachingAssignments(User $teacher, array $courses, AcademicYear $year): array
    {
        $assignments = [];

        foreach ($courses as $course) {
            $semester = str_contains($course->code, '-S2-') ? 'semester_2' : 'semester_1';
            $attributes = [
                'teacher_id' => $teacher->id,
                'academic_year_id' => $year->id,
                'class_id' => $course->class_id,
                'section' => 'A',
                'course_id' => $course->id,
                'semester' => $semester,
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

    /**
     * Seed exactly 3 assessments per course out of 100% total (20%, 30%, 50%),
     * and grade all registered class students out of 100.
     *
     * @param list<TeachingAssignment> $assignments
     * @param \Illuminate\Support\Collection<int, Member> $members
     */
    private function seedAssessments(array $assignments, $members): void
    {
        $assessmentTemplates = [
            [
                'name' => [
                    'en' => 'Continuous Assessment (Quiz & Homework)',
                    'am' => 'ቀጣይነት ያለው ምዘና (ፈተና እና የቤት ሥራ)',
                    'om' => 'Madaallii Itti-fufiinsaa (Qormaata fi Hojii Manaa)',
                ],
                'weight' => 20,
            ],
            [
                'name' => [
                    'en' => 'Midterm Examination',
                    'am' => 'የግማሽ ዓመት ፈተና',
                    'om' => 'Qormaata Walakkaa Waggaa',
                ],
                'weight' => 30,
            ],
            [
                'name' => [
                    'en' => 'Final Examination',
                    'am' => 'የማጠቃለያ ፈተና',
                    'om' => 'Qormaata Xumuraa',
                ],
                'weight' => 50,
            ],
        ];

        foreach ($assignments as $assignmentIndex => $assignment) {
            foreach ($assessmentTemplates as $tmplIndex => $template) {
                $assessment = Assessment::where('teaching_assignment_id', $assignment->id)
                    ->where('name->en', $template['name']['en'])
                    ->first();

                $assessment ??= Assessment::create([
                    'teaching_assignment_id' => $assignment->id,
                    'name' => $template['name'],
                    'total_score' => 100,
                    'weight_percentage' => $template['weight'],
                ]);

                // Filter students registered in this class & section
                $classStudents = $members->filter(
                    fn (Member $m) => (int) $m->class_id === (int) $assignment->class_id && $m->section === $assignment->section
                );

                foreach ($classStudents->values() as $studentIndex => $student) {
                    // Score out of 100 (deterministic realistic grade between 60 and 98)
                    $score = 65 + (($assignmentIndex * 7 + $studentIndex * 5 + $tmplIndex * 11) % 32);

                    AssessmentResult::updateOrCreate(
                        ['assessment_id' => $assessment->id, 'member_id' => $student->id],
                        [
                            'score' => $score,
                            'remarks' => [
                                'en' => $score >= 85 ? 'Excellent performance' : ($score >= 70 ? 'Good progress' : 'Satisfactory'),
                                'am' => $score >= 85 ? 'እጅግ በጣም ጥሩ ውጤት' : ($score >= 70 ? 'ጥሩ ውጤት' : 'አጥጋቢ ውጤት'),
                            ],
                        ]
                    );
                }
            }
        }
    }

    /**
     * @param list<TeachingAssignment> $assignments
     * @param \Illuminate\Support\Collection<int, Member> $members
     */
    private function seedAttendance(array $assignments, $members, AcademicYear $year, User $officer): void
    {
        foreach (array_slice($assignments, 0, 8) as $index => $assignment) {
            $date = Carbon::parse($year->start_date)->addDays($index)->toDateString();
            $sessionAttributes = [
                'academic_year_id' => $year->id,
                'term_id' => 1,
                'class_id' => $assignment->class_id,
                'course_id' => $assignment->course_id,
                'time_slot' => 'Development Session '.($index + 1),
            ];
            $session = AttendanceSession::where($sessionAttributes)->whereDate('date', $date)->first();
            $session ??= AttendanceSession::create($sessionAttributes + [
                'date' => $date,
                'status' => AttendanceStatus::Submitted,
                'submitted_by' => $officer->id,
                'submitted_at' => Carbon::parse($date)->setTime(12, 0),
            ]);

            $this->seedSessionRecords($session, $assignment, $members, $officer, $index);
            AttendanceAuditLog::firstOrCreate(
                ['attendance_session_id' => $session->id, 'action' => 'session_submitted'],
                ['actor_id' => $officer->id, 'previous_state' => ['status' => 'draft'], 'new_state' => ['status' => 'submitted'], 'ip_address' => '127.0.0.1', 'user_agent' => 'Development seeder']
            );
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

    /**
     * @param list<SchoolClass> $classes
     * @return list<MonthlyPaymentRule>
     */
    private function seedPaymentRules(User $financeOfficer, array $classes): array
    {
        $rules = [];
        $ruleDefs = [
            ['General Monthly Contribution', 150.00, null],
            ['Junior Grade Contribution', 100.00, $classes[0]->id],
            ['Senior Grade Contribution', 120.00, $classes[3]->id],
        ];

        foreach ($ruleDefs as [$name, $amount, $classId]) {
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
                    'reference_number' => sprintf('DEV-%s-M%04d', now()->format('Ym'), $member->id),
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
            'academic_director' => 'director@example.com',
            'finance_officer' => 'finance@example.com',
            'teacher' => 'teacher@example.com',
            'attendance_officer' => 'attendance@example.com',
            'member_coordinator' => 'registrar@example.com',
            'student' => 'student@example.com',
            'academic_administrator' => 'academic.admin@example.test',
        ];
    }

    /** @return list<string> */
    private function classCodes(): array
    {
        return array_map(fn (int $grade) => sprintf('DEV-G%02d', $grade), range(1, 4));
    }

    /** @return list<string> */
    private function courseCodes(): array
    {
        $codes = [];
        foreach (range(1, 4) as $g) {
            foreach ([1, 2] as $s) {
                foreach ([1, 2, 3] as $c) {
                    $prefix = match ($c) {
                        1 => ($s === 1 ? 'BIB' : 'ETH'),
                        2 => ($s === 1 ? 'AMH' : 'LIT'),
                        3 => ($s === 1 ? 'HYM' : 'HIS'),
                    };
                    if ($g >= 3) {
                        $prefix = match ("{$s}_{$c}") {
                            '1_1' => 'GOS',
                            '1_2' => 'GEE',
                            '1_3' => 'HYM',
                            '2_1' => ($g === 3 ? 'THE' : 'DOG'),
                            '2_2' => ($g === 3 ? 'LIT' : 'ETH'),
                            '2_3' => ($g === 3 ? 'HIS' : 'MON'),
                        };
                    }
                    $codes[] = sprintf('DEV-G%02d-S%d-%s%d', $g, $s, $prefix, $g);
                }
            }
        }

        // Return exact codes used in seedCourses
        return [
            'DEV-G01-S1-01', 'DEV-G01-S1-02', 'DEV-G01-S1-03', 'DEV-G01-S2-01', 'DEV-G01-S2-02', 'DEV-G01-S2-03',
            'DEV-G02-S1-01', 'DEV-G02-S1-02', 'DEV-G02-S1-03', 'DEV-G02-S2-01', 'DEV-G02-S2-02', 'DEV-G02-S2-03',
            'DEV-G03-S1-01', 'DEV-G03-S1-02', 'DEV-G03-S1-03', 'DEV-G03-S2-01', 'DEV-G03-S2-02', 'DEV-G03-S2-03',
            'DEV-G04-S1-01', 'DEV-G04-S1-02', 'DEV-G04-S1-03', 'DEV-G04-S2-01', 'DEV-G04-S2-02', 'DEV-G04-S2-03',
        ];
    }

    /** @return list<string> */
    private function memberPhones(): array
    {
        return array_map(fn (int $index) => sprintf('+1-202-555-%04d', 101 + $index), range(0, 79));
    }
}
