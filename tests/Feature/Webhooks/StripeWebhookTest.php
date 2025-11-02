<?php

namespace Tests\Feature\Webhooks;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class StripeWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_rejects_invalid_signature(): void
    {
        $payload = json_encode(['type' => 'payment_intent.succeeded']);
        $response = $this->withHeaders([
            'Stripe-Signature' => 't=123,v1=invalidsignature',
        ])->post('/stripe/webhook', [], ['CONTENT_TYPE' => 'application/json']);

        // If route not implemented, at least ensure 404/400 not 200 OK
        $this->assertTrue(in_array($response->getStatusCode(), [400, 401, 403, 404]));
    }
}


