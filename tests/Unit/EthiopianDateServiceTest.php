<?php

namespace Tests\Unit;

use App\Services\EthiopianDateService;
use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

class EthiopianDateServiceTest extends TestCase
{
    protected EthiopianDateService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new EthiopianDateService;
    }

    public function test_converts_ethiopian_new_year_accurately(): void
    {
        // 2024-09-11 is Meskerem 1, 2017 E.C.
        $res = $this->service->toEthiopian('2024-09-11');
        $this->assertEquals(2017, $res['year']);
        $this->assertEquals(1, $res['month']);
        $this->assertEquals(1, $res['day']);
        $this->assertEquals('Meskerem', $res['month_name_en']);
        $this->assertEquals('መስከረም', $res['month_name_am']);
        $this->assertEquals('Meskerem 1, 2017 E.C.', $res['formatted_en']);
        $this->assertEquals('መስከረም 1 ቀን 2017 ዓ.ም.', $res['formatted_am']);
    }

    public function test_converts_pagume_13th_month(): void
    {
        // 2024-09-06 is Pagume 1, 2016 E.C.
        $res = $this->service->toEthiopian('2024-09-06');
        $this->assertEquals(2016, $res['year']);
        $this->assertEquals(13, $res['month']);
        $this->assertEquals(1, $res['day']);
        $this->assertEquals('Pagume', $res['month_name_en']);
        $this->assertEquals('ጳጉሜ', $res['month_name_am']);
    }

    public function test_converts_standard_october_date(): void
    {
        // 2026-10-18 is Tikimt 8, 2019 E.C.
        $res = $this->service->toEthiopian('2026-10-18');
        $this->assertEquals(2019, $res['year']);
        $this->assertEquals(2, $res['month']);
        $this->assertEquals(8, $res['day']);
        $this->assertEquals('Tikimt', $res['month_name_en']);
        $this->assertEquals('ጥቅምት', $res['month_name_am']);
        $this->assertEquals('Tikimt 8, 2019 E.C.', $res['formatted_en']);
        $this->assertEquals('ጥቅምት 8 ቀን 2019 ዓ.ም.', $res['formatted_am']);
    }

    public function test_accepts_carbon_instances(): void
    {
        $carbon = Carbon::create(2025, 1, 7); // Genna / Christmas -> Tahsas 29
        $res = $this->service->toEthiopian($carbon);
        $this->assertEquals(2017, $res['year']);
        $this->assertEquals(4, $res['month']); // Tahsas
        $this->assertEquals(29, $res['day']);
        $this->assertEquals('Tahsas', $res['month_name_en']);
    }
}
