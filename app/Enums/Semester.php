<?php

namespace App\Enums;

enum Semester: string
{
    case Semester1 = 'semester_1';
    case Semester2 = 'semester_2';

    /**
     * Get human-readable label for the semester.
     */
    public function label(): string
    {
        return match ($this) {
            self::Semester1 => 'Semester 1',
            self::Semester2 => 'Semester 2',
        };
    }
}
