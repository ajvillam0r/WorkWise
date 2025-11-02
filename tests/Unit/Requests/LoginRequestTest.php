<?php

namespace Tests\Unit\Requests;

use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class LoginRequestTest extends TestCase
{
    public function test_rules_require_valid_email_and_password(): void
    {
        $rules = (new LoginRequest())->rules();

        $invalid = [
            'email' => 'not-an-email',
            'password' => '',
        ];
        $validator = Validator::make($invalid, $rules);
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());

        $valid = [
            'email' => 'user@example.com',
            'password' => 'secret',
        ];
        $validatorOk = Validator::make($valid, $rules);
        $this->assertFalse($validatorOk->fails());
    }
}


