<?php

namespace App\Http\Requests\Attendance;

use App\Enums\AttendanceMark;
use App\Http\Requests\BaseRequest;
use App\Models\AttendanceSession;
use Illuminate\Validation\Rule;

class CorrectAttendanceMarksRequest extends BaseRequest
{
    /**
     * Prepare the data for validation.
     *
     * Supports both 'corrected_marks' and 'student_marks' payload keys.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('corrected_marks') && $this->has('student_marks')) {
            $this->merge([
                'corrected_marks' => $this->input('student_marks'),
            ]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        $session = $this->route('session') ?? $this->route('attendance_session');
        if (is_numeric($session)) {
            $session = AttendanceSession::find((int) $session);
        }

        if ($session instanceof AttendanceSession) {
            return $user->can('correct', $session);
        }

        // Fail-closed for non-staff roles; fallback when unrouted
        return $user->hasRole('superadmin') || $user->hasRole('teacher');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'corrected_marks' => ['required', 'array', 'min:1'],
            'corrected_marks.*.student_id' => ['required', 'integer', 'distinct', 'exists:members,id'],
            'corrected_marks.*.mark' => ['required', 'string', Rule::enum(AttendanceMark::class)],
            'corrected_marks.*.remarks' => ['nullable', 'string', 'max:500'],

            'is_override' => ['nullable', 'boolean'],
            'override_reason' => [
                'exclude_unless:is_override,true,1',
                'required',
                'string',
                'min:5',
                'max:1000',
            ],
        ];
    }

    /**
     * Get validated corrected student marks compatible with AttendanceService::correctMarks.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getCorrectedStudentMarks(): array
    {
        return $this->input('corrected_marks', []);
    }

    /**
     * Check if an administrative override was requested.
     */
    public function isOverride(): bool
    {
        return (bool) $this->boolean('is_override');
    }

    /**
     * Get the administrative override reason, if provided.
     */
    public function getOverrideReason(): ?string
    {
        return $this->input('override_reason');
    }
}
