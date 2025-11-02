<?php

namespace Tests\Unit\I18n;

use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Date;
use Tests\TestCase;

class EmailAndDateRulesTest extends TestCase
{
    public function test_login_email_rule_accepts_mixed_case_but_normalization_is_external(): void
    {
        $rules = (new \App\Http\Requests\Auth\LoginRequest())->rules();
        $data = ['email' => 'MiXeD@Example.COM', 'password' => 'secret'];
        $v = Validator::make($data, $rules);
        $this->assertFalse($v->fails());
    }

    public function test_deadline_after_today_rule_respects_timezones(): void
    {
        Date::setTestNow('2025-01-15 23:30:00');
        $rules = ['deadline' => 'nullable|date|after:today'];

        $ok = Validator::make(['deadline' => '2025-01-16'], $rules);
        $this->assertFalse($ok->fails());

        $bad = Validator::make(['deadline' => '2025-01-15'], $rules);
        $this->assertTrue($bad->fails());

        Date::setTestNow();
    }
}
