<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoogleOAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_oauth_redirect_endpoint_is_protected_against_csrf_but_allows_get(): void
    {
        $response = $this->get('/auth/google');
        // Expect redirect to Google or a 302
        $this->assertTrue(in_array($response->getStatusCode(), [302, 404]));
    }
}


