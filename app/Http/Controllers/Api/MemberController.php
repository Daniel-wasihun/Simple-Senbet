<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HandlesCachedCrud;
use App\Http\Controllers\Controller;
use App\Http\Resources\MemberResource;
use App\Models\AcademicYear;
use App\Models\Member;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Services\CachedCrudService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MemberController extends Controller
{
    use HandlesCachedCrud;

    private function rules(): array
    {
        $maxDob = Carbon::now()->subYears(3)->format('Y-m-d');

        return [
            'full_name' => ['required'],
            'christian_name' => ['nullable'],
            'date_of_birth' => ['required', 'date', 'before_or_equal:' . $maxDob],
            'gender' => ['required', 'string', 'max:20'],
            'emergency_contact_name' => ['nullable'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
            'phone_number' => ['nullable', 'string', 'max:50'],
            'membership_date' => ['nullable', 'date'],
            'sol_father_name' => ['nullable'],
            'class_id' => ['required', 'exists:classes,id'],
            'section' => ['nullable', 'string', 'max:50'],
        ];
    }

    private function messages(): array
    {
        return [
            'date_of_birth.before_or_equal' => 'The student must be at least 3 years old.',
            'class_id.required' => 'Please select a school class.',
            'class_id.exists' => 'The selected school class is invalid.',
        ];
    }

    private function normalizeTranslatable(mixed $value): ?array
    {
        if (is_null($value)) {
            return null;
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '') {
                return null;
            }
            if ((str_starts_with($trimmed, '{') && str_ends_with($trimmed, '}')) || (str_starts_with($trimmed, '[') && str_ends_with($trimmed, ']'))) {
                $decoded = json_decode($trimmed, true);
                if (is_array($decoded)) {
                    $value = $decoded;
                } else {
                    return ['en' => $trimmed];
                }
            } else {
                return ['en' => $trimmed];
            }
        }

        if (is_array($value)) {
            $clean = [];
            foreach ($value as $k => $v) {
                if (!is_null($v) && is_string($v) && trim($v) !== '') {
                    $clean[(string) $k] = trim($v);
                }
            }
            return !empty($clean) ? $clean : null;
        }

        return null;
    }

    public function index()
    {
        $this->authorize('viewAny', Member::class);

        $query = Member::with('schoolClass')->latest();
        $search = trim((string) request()->query('search', ''));
        if ($search !== '') {
            $driver = DB::connection()->getDriverName();
            $likeOp = $driver === 'pgsql' ? 'ilike' : 'like';

            $query->where(function ($members) use ($search, $likeOp, $driver) {
                $members->where('full_name->en', $likeOp, "%{$search}%")
                    ->orWhere('full_name->am', $likeOp, "%{$search}%")
                    ->orWhere('full_name->om', $likeOp, "%{$search}%")
                    ->orWhere('christian_name', $likeOp, "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%");

                if ($driver === 'pgsql') {
                    $members->orWhereRaw('full_name::text ilike ?', ["%{$search}%"]);
                } else {
                    $members->orWhereRaw('cast(full_name as text) like ?', ["%{$search}%"]);
                }
            });
        }

        if (request()->filled('class_id') && request()->query('class_id') !== 'all') {
            $query->where('class_id', request()->integer('class_id'));
        }

        if (request()->filled('section') && request()->query('section') !== 'all') {
            $query->where('section', strtoupper(trim((string) request()->query('section'))));
        }

        if (request()->filled('gender') && request()->query('gender') !== 'all') {
            $query->where('gender', strtolower(trim((string) request()->query('gender'))));
        }

        $perPage = min(max(request()->integer('per_page', 15), 1), 250);
        return MemberResource::collection($query->paginate($perPage));
    }

    public function store(Request $r)
    {
        $this->authorize('create', Member::class);
        $validated = $r->validate($this->rules(), $this->messages());

        $validated['full_name'] = $this->normalizeTranslatable($validated['full_name'] ?? null);
        if (empty($validated['full_name'])) {
            throw ValidationException::withMessages([
                'full_name' => ['The student full name is required in at least one language.'],
            ]);
        }
        $validated['christian_name'] = $this->normalizeTranslatable($validated['christian_name'] ?? null);
        $validated['emergency_contact_name'] = $this->normalizeTranslatable($validated['emergency_contact_name'] ?? null);
        $validated['sol_father_name'] = $this->normalizeTranslatable($validated['sol_father_name'] ?? null);

        // Normalize section based on class number_of_sections
        $class = SchoolClass::findOrFail((int) $validated['class_id']);
        $numSections = max(1, (int) ($class->number_of_sections ?? 1));
        $validSections = array_map(fn ($i) => chr(65 + $i), range(0, $numSections - 1));

        $givenSection = strtoupper(trim((string) ($validated['section'] ?? '')));
        if ($givenSection === '' || !in_array($givenSection, $validSections, true)) {
            $givenSection = $validSections[0];
        }
        $validated['section'] = $givenSection;

        $member = DB::transaction(function () use ($validated) {
            $member = Member::create($validated);

            // Auto-enroll member: a member is considered enrolled upon initial registration
            $currentYear = AcademicYear::where('is_current', true)->first()
                ?? AcademicYear::latest('id')->first();

            if (! $currentYear && !empty($member->class_id)) {
                $currentYear = AcademicYear::create([
                    'name' => ['en' => 'Academic Year ' . date('Y'), 'am' => 'የትምህርት ዘመን ' . date('Y')],
                    'start_date' => date('Y-01-01'),
                    'end_date' => date('Y-12-31'),
                    'is_current' => true,
                ]);
            }

            if ($currentYear && !empty($member->class_id)) {
                $today = Carbon::today();
                $yearStart = Carbon::parse($currentYear->start_date)->startOfDay();
                $yearEnd = Carbon::parse($currentYear->end_date)->endOfDay();
                $startDate = $today->between($yearStart, $yearEnd) ? $today : $yearStart;

                StudentEnrollment::create([
                    'member_id' => $member->id,
                    'academic_year_id' => $currentYear->id,
                    'class_id' => $member->class_id,
                    'section' => $member->section ?: 'A',
                    'start_date' => $startDate->toDateString(),
                    'end_date' => null,
                ]);
            }

            return $member->load('schoolClass');
        });

        app(CachedCrudService::class)->invalidate(Member::class);
        app(CachedCrudService::class)->invalidate(StudentEnrollment::class);

        return response()->json(['data' => MemberResource::make($member)], 201);
    }

    public function show(Member $member)
    {
        return $this->showCrud($member, MemberResource::class, ['schoolClass'], true);
    }

    public function update(Request $r, Member $member)
    {
        $this->authorize('update', $member);
        $validated = $r->validate($this->rules(), $this->messages());

        $validated['full_name'] = $this->normalizeTranslatable($validated['full_name'] ?? null);
        if (empty($validated['full_name'])) {
            throw ValidationException::withMessages([
                'full_name' => ['The student full name is required in at least one language.'],
            ]);
        }
        $validated['christian_name'] = $this->normalizeTranslatable($validated['christian_name'] ?? null);
        $validated['emergency_contact_name'] = $this->normalizeTranslatable($validated['emergency_contact_name'] ?? null);
        $validated['sol_father_name'] = $this->normalizeTranslatable($validated['sol_father_name'] ?? null);

        // Normalize section based on class number_of_sections
        $class = SchoolClass::findOrFail((int) $validated['class_id']);
        $numSections = max(1, (int) ($class->number_of_sections ?? 1));
        $validSections = array_map(fn ($i) => chr(65 + $i), range(0, $numSections - 1));

        $givenSection = strtoupper(trim((string) ($validated['section'] ?? '')));
        if ($givenSection === '' || !in_array($givenSection, $validSections, true)) {
            $givenSection = $validSections[0];
        }
        $validated['section'] = $givenSection;

        $member = DB::transaction(function () use ($member, $validated) {
            $oldClassId = $member->class_id;
            $oldSection = $member->section;

            $member->update($validated);

            if ($oldClassId !== $member->class_id || $oldSection !== $member->section) {
                $activeEnrollment = StudentEnrollment::where('member_id', $member->id)
                    ->whereNull('end_date')
                    ->first();

                if ($activeEnrollment) {
                    $activeEnrollment->update([
                        'class_id' => $member->class_id,
                        'section' => $member->section ?: 'A',
                    ]);
                } else {
                    $currentYear = AcademicYear::where('is_current', true)->first()
                        ?? AcademicYear::latest('id')->first();
                    if ($currentYear) {
                        $today = Carbon::today();
                        $yearStart = Carbon::parse($currentYear->start_date)->startOfDay();
                        $yearEnd = Carbon::parse($currentYear->end_date)->endOfDay();
                        $startDate = $today->between($yearStart, $yearEnd) ? $today : $yearStart;

                        StudentEnrollment::create([
                            'member_id' => $member->id,
                            'academic_year_id' => $currentYear->id,
                            'class_id' => $member->class_id,
                            'section' => $member->section ?: 'A',
                            'start_date' => $startDate->toDateString(),
                            'end_date' => null,
                        ]);
                    }
                }
            }

            return $member->load('schoolClass');
        });

        app(CachedCrudService::class)->invalidate(Member::class);
        app(CachedCrudService::class)->invalidate(StudentEnrollment::class);

        return ['data' => MemberResource::make($member)];
    }

    public function destroy(Member $member)
    {
        $this->authorize('delete', $member);

        DB::transaction(function () use ($member) {
            StudentEnrollment::where('member_id', $member->id)
                ->whereNull('end_date')
                ->update([
                    'end_date' => Carbon::today()->toDateString(),
                    'transfer_reason' => 'Member deleted',
                ]);

            $member->delete();
        });

        app(CachedCrudService::class)->invalidate(Member::class);
        app(CachedCrudService::class)->invalidate(StudentEnrollment::class);

        return response()->noContent();
    }
}
