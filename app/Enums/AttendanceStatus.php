<?php

namespace App\Enums;

enum AttendanceStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case Closed = 'closed';

    /**
     * Get human-readable label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Submitted => 'Submitted',
            self::Closed => 'Closed',
        };
    }
}
