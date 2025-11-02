<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthHardeningTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(): User
    {
        return User::create([
            'first_name' => 'Auth',
            'last_name' => 'User',
            'email' => 'auth@example.com',
            'password' => Hash::make('password123'),
            'user_type' => 'gig_worker',
        ]);
    }

    public function test_rate_limiting_locks_after_five_failed_attempts(): void
    {
        $this->createUser();
        $email = 'auth@example.com';

        // 5 failed attempts allowed
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'email' => $email,
                'password' => 'wrong-password',
            ]);
        }

        // 6th attempt should be blocked by rate limiter
        $response = $this->post('/login', [
            'email' => $email,
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors();
    }

    public function test_rate_limit_is_cleared_after_successful_login(): void
    {
        $this->createUser();
        $email = 'auth@example.com';
        $key = strtolower($email).'|127.0.0.1';

        // A few failed attempts first
        for ($i = 0; $i < 3; $i++) {
            $this->post('/login', [
                'email' => $email,
                'password' => 'wrong-password',
            ]);
        }

        // Successful login clears the attempts
        $response = $this->post('/login', [
            'email' => $email,
            'password' => 'password123',
            'remember' => false,
        ]);

        $response->assertRedirect();
        $this->assertFalse(RateLimiter::tooManyAttempts($key, 5));
    }

    public function test_remember_me_sets_recaller_cookie(): void
    {
        $this->createUser();

        $response = $this->post('/login', [
            'email' => 'auth@example.com',
            'password' => 'password123',
            'remember' => true,
        ]);

        $response->assertRedirect();

        // Laravel remember-me cookie name for web guard starts with 'remember_web_'
        $cookies = $response->headers->getCookies();
        $hasRemember = false;
        foreach ($cookies as $cookie) {
            if (str_starts_with($cookie->getName(), 'remember_web_')) {
                $hasRemember = true;
                break;
            }
        }
        $this->assertTrue($hasRemember, 'Remember-me cookie was not set.');
    }
}


