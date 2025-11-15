<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use App\Models\GigJob;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        $agreedAmount = $this->faker->randomFloat(2, 100, 1000);
        $platformFee = $agreedAmount * 0.10;
        $netAmount = $agreedAmount - $platformFee;

        return [
            'employer_id' => User::factory(),
            'gig_worker_id' => User::factory(),
            'job_id' => GigJob::factory(),
            'bid_id' => function (array $attributes) {
                return \App\Models\Bid::factory()->create([
                    'job_id' => $attributes['job_id'],
                    'gig_worker_id' => $attributes['gig_worker_id'],
                    'status' => 'accepted',
                ])->id;
            },
            'status' => 'active',
            'agreed_amount' => $agreedAmount,
            'platform_fee' => $platformFee,
            'net_amount' => $netAmount,
            'payment_released' => false,
            'started_at' => now(),
            'completed_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'completed_at' => now(),
            'payment_released' => true,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'started_at' => null,
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'completed_at' => now(),
        ]);
    }

    public function withPaymentReleased(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_released' => true,
        ]);
    }
}
