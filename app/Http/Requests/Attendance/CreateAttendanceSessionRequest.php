<?php

namespace App\Http\Requests\Attendance;

use App\Http\Requests\BaseRequest;
use App\Models\AttendanceSession;

class CreateAttendanceSessionRequest extends BaseRequest
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

        return $user->can('create', [
            AttendanceSession::class,
            $this->input('class_id') ? (int) $this->input('class_id') : null,
            $this->input('course_id') ? (int) $this->input('course_id') : null,
            $this->input('date'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            // Notice: term_id is validated as an integer without exists constraint because
            // the database currently lacks a canonical terms table or foreign key.
            'term_id' => ['required', 'integer', 'min:1'],
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'date' => ['required', 'date', 'date_format:Y-m-d'],
            'time_slot' => ['required', 'string', 'max:50'],
        ];
    }
}
