<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeolocationService
{
    /**
     * Detect and verify user's address using IP geolocation
     *
     * @param User $user
     * @return bool
     */
    public function detectAndVerifyAddress(User $user): bool
    {
        try {
            $response = Http::timeout(10)->get('https://ipapi.co/json/');

            if (!$response->successful()) {
                Log::warning('IP API request failed', [
                    'status' => $response->status(),
                    'user_id' => $user->id
                ]);
                return false;
            }

            $data = $response->json();

            // Validate response data
            if (!isset($data['country_name'])) {
                Log::warning('IP API returned incomplete data', [
                    'data' => $data,
                    'user_id' => $user->id
                ]);
                return false;
            }

            // Update user with detected location
            $user->update([
                'country' => $data['country_name'] ?? null,
                'city' => $data['city'] ?? null,
                'address_verified_at' => now(),
            ]);

            Log::info('Address auto-verified successfully', [
                'user_id' => $user->id,
                'country' => $data['country_name'],
                'city' => $data['city'] ?? 'Unknown',
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Address verification failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Detect country from IP address
     *
     * @return array|null
     */
    public function detectCountry(): ?array
    {
        try {
            $response = Http::timeout(10)->get('https://ipapi.co/json/');

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json();

            return [
                'country' => $data['country_name'] ?? null,
                'country_code' => $data['country_code'] ?? null,
                'city' => $data['city'] ?? null,
                'region' => $data['region'] ?? null,
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
            ];

        } catch (\Exception $e) {
            Log::error('Country detection failed', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}


