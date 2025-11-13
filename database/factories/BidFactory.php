<?php

namespace Database\Factories;

use App\Models\GigJob;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Bid>
 */
class BidFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'job_id' => null, // Will be set explicitly in tests
            'gig_worker_id' => null, // Will be set explicitly in tests
            'bid_amount' => fake()->randomFloat(2, 100, 5000),
            'proposal_message' => fake()->paragraphs(2, true),
            'estimated_days' => fake()->numberBetween(5, 60),
            'status' => 'pending',
            'submitted_at' => now(),
        ];
    }
}
