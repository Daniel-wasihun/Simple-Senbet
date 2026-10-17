<?php

namespace Tests\Unit\Stage1;

use App\Enums\AttendanceAuditAction;
use App\Enums\AttendanceMark;
use App\Enums\AttendanceStatus;
use PHPUnit\Framework\TestCase;
use ValueError;

class AttendanceEnumTest extends TestCase
{
    public function test_attendance_status_contains_exact_approved_values(): void
    {
        $expected = [
            'draft' => AttendanceStatus::Draft,
            'submitted' => AttendanceStatus::Submitted,
            'closed' => AttendanceStatus::Closed,
        ];

        $cases = AttendanceStatus::cases();
        $this->assertCount(3, $cases);

        foreach ($expected as $value => $enumCase) {
            $this->assertSame($value, $enumCase->value);
            $this->assertSame($enumCase, AttendanceStatus::from($value));
            $this->assertNotEmpty($enumCase->label());
        }
    }

    public function test_attendance_status_rejects_invalid_values(): void
    {
        $this->expectException(ValueError::class);
        AttendanceStatus::from('invalid_status');
    }

    public function test_attendance_mark_contains_exact_approved_values(): void
    {
        $expected = [
            'present' => AttendanceMark::Present,
            'absent' => AttendanceMark::Absent,
            'late' => AttendanceMark::Late,
            'excused' => AttendanceMark::Excused,
        ];

        $cases = AttendanceMark::cases();
        $this->assertCount(4, $cases);

        foreach ($expected as $value => $enumCase) {
            $this->assertSame($value, $enumCase->value);
            $this->assertSame($enumCase, AttendanceMark::from($value));
            $this->assertNotEmpty($enumCase->label());
        }
    }

    public function test_attendance_mark_rejects_invalid_values(): void
    {
        $this->expectException(ValueError::class);
        AttendanceMark::from('tardy');
    }

    public function test_attendance_audit_action_contains_exact_approved_values(): void
    {
        $expected = [
            'session_created' => AttendanceAuditAction::SessionCreated,
            'session_submitted' => AttendanceAuditAction::SessionSubmitted,
            'mark_corrected' => AttendanceAuditAction::MarkCorrected,
            'session_closed' => AttendanceAuditAction::SessionClosed,
            'session_reopened' => AttendanceAuditAction::SessionReopened,
        ];

        $cases = AttendanceAuditAction::cases();
        $this->assertCount(5, $cases);

        foreach ($expected as $value => $enumCase) {
            $this->assertSame($value, $enumCase->value);
            $this->assertSame($enumCase, AttendanceAuditAction::from($value));
            $this->assertNotEmpty($enumCase->label());
        }
    }

    public function test_attendance_audit_action_rejects_invalid_values(): void
    {
        $this->expectException(ValueError::class);
        AttendanceAuditAction::from('record_deleted');
    }
}
