<?php

namespace App\Http\Requests\Attendance;

use App\Enums\AttendanceMark;
use App\Enums\Semester;
use App\Http\Requests\BaseRequest;
use App\Models\AttendanceSession;
use Illuminate\Validation\Rule;

class SubmitAttendanceSessionRequest extends BaseRequest
{
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
            return $user->can('submit', $session);
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'student_marks' => ['required', 'array', 'min:1'],
            'student_marks.*.student_id' => ['required', 'integer', 'distinct', 'exists:members,id'],
            'student_marks.*.mark' => ['required', 'string', Rule::enum(AttendanceMark::class)],
            'student_marks.*.remarks' => ['nullable', 'string', 'max:500'],

            'teacher_marks' => ['sometimes', 'array'],
            'teacher_marks.*.teacher_id' => ['required_with:teacher_marks', 'integer', 'distinct', 'exists:users,id'],
            'teacher_marks.*.mark' => ['required_with:teacher_marks', 'string', Rule::enum(AttendanceMark::class)],
            'teacher_marks.*.remarks' => ['nullable', 'string', 'max:500'],

            'section' => ['nullable', 'string', 'max:20'],
            'semester' => ['nullable', 'string', Rule::enum(Semester::class)],
        ];
    }

    /**
     * Get validated student marks.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getStudentMarks(): array
    {
        return $this->input('student_marks', []);
    }

    /**
     * Get validated teacher marks.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getTeacherMarks(): array
    {
        return $this->input('teacher_marks', []);
    }

    /**
     * Get the validated section, if provided.
     */
    public function getSection(): ?string
    {
        return $this->input('section');
    }

    /**
     * Get the validated semester, if provided.
     */
    public function getSemester(): ?string
    {
        return $this->input('semester');
    }
}
