<?php

namespace App\Enums;

enum AttendanceAuditAction: string
{
    case SessionCreated = 'session_created';
    case SessionSubmitted = 'session_submitted';
    case MarkCorrected = 'mark_corrected';
    case SessionClosed = 'session_closed';
    case SessionReopened = 'session_reopened';

    /**
     * Get human-readable label for the audit action.
     */
    public function label(): string
    {
        return match ($this) {
            self::SessionCreated => 'Session Created',
            self::SessionSubmitted => 'Session Submitted',
            self::MarkCorrected => 'Mark Corrected',
            self::SessionClosed => 'Session Closed',
            self::SessionReopened => 'Session Reopened',
        };
    }
}
