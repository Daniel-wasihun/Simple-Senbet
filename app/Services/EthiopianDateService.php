<?php

namespace App\Services;

use Carbon\Carbon;
use Carbon\CarbonInterface;

class EthiopianDateService
{
    protected const AMHARIC_MONTHS = [
        1 => 'መስከረም',
        2 => 'ጥቅምት',
        3 => 'ኅዳር',
        4 => 'ታኅሣሥ',
        5 => 'ጥር',
        6 => 'የካቲት',
        7 => 'መጋቢት',
        8 => 'ሚያዝያ',
        9 => 'ግንቦት',
        10 => 'ሰኔ',
        11 => 'ሐምሌ',
        12 => 'ነሐሴ',
        13 => 'ጳጉሜ',
    ];

    protected const ENGLISH_MONTHS = [
        1 => 'Meskerem',
        2 => 'Tikimt',
        3 => 'Hidar',
        4 => 'Tahsas',
        5 => 'Tir',
        6 => 'Yakatit',
        7 => 'Megabit',
        8 => 'Miazia',
        9 => 'Ginbot',
        10 => 'Sene',
        11 => 'Hamle',
        12 => 'Nehase',
        13 => 'Pagume',
    ];

    /**
     * Convert a Gregorian date to Ethiopian date representation.
     *
     * @return array{year: int, month: int, day: int, month_name_en: string, month_name_am: string, formatted_en: string, formatted_am: string}
     */
    public function toEthiopian(CarbonInterface|string $date): array
    {
        $carbon = is_string($date) ? Carbon::parse($date) : $date;
        $jdn = $this->gregorianToJdn((int) $carbon->year, (int) $carbon->month, (int) $carbon->day);
        [$year, $month, $day] = $this->jdnToEthiopian($jdn);

        $monthNameEn = self::ENGLISH_MONTHS[$month] ?? "Month {$month}";
        $monthNameAm = self::AMHARIC_MONTHS[$month] ?? "ወር {$month}";

        return [
            'year' => $year,
            'month' => $month,
            'day' => $day,
            'month_name_en' => $monthNameEn,
            'month_name_am' => $monthNameAm,
            'formatted_en' => sprintf('%s %d, %d E.C.', $monthNameEn, $day, $year),
            'formatted_am' => sprintf('%s %d ቀን %d ዓ.ም.', $monthNameAm, $day, $year),
        ];
    }

    /**
     * Convert Gregorian Year, Month, Day to Julian Day Number (JDN).
     */
    public function gregorianToJdn(int $year, int $month, int $day): int
    {
        $a = intdiv(14 - $month, 12);
        $y = $year + 4800 - $a;
        $m = $month + 12 * $a - 3;

        return $day + intdiv(153 * $m + 2, 5) + 365 * $y + intdiv($y, 4) - intdiv($y, 100) + intdiv($y, 400) - 32045;
    }

    /**
     * Convert Julian Day Number (JDN) to Ethiopian Year, Month, Day.
     *
     * @return array{0: int, 1: int, 2: int}
     */
    public function jdnToEthiopian(int $jdn): array
    {
        $jdnOffset = 1723856;
        $r = ($jdn - $jdnOffset) % 1461;
        $n = ($r % 365) + 365 * intdiv($r, 1460);
        $year = 4 * intdiv($jdn - $jdnOffset, 1461) + intdiv($r, 365) - intdiv($r, 1460);
        $month = intdiv($n, 30) + 1;
        $day = ($n % 30) + 1;

        return [$year, $month, $day];
    }
}
