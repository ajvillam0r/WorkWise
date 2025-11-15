<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        $amount = $this->faker->randomFloat(2, 50, 500);
        $platformFee = $amount * 0.10; // 10% platform fee
        $netAmount = $amount - $platformFee;

        return [
            'project_id' => Project::factory(),
            'payer_id' => User::factory(),
            'payee_id' => User::factory(),
            'amount' => $amount,
            'platform_fee' => $platformFee,
            'net_amount' => $netAmount,
            'type' => 'escrow',
            'status' => 'completed',
            'stripe_payment_intent_id' => 'pi_' . $this->faker->unique()->regexify('[A-Za-z0-9]{24}'),
            'stripe_charge_id' => 'ch_' . $this->faker->unique()->regexify('[A-Za-z0-9]{24}'),
            'description' => $this->faker->sentence(),
            'metadata' => [],
            'processed_at' => now(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'processed_at' => null,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'processed_at' => now(),
        ]);
    }

    public function payment(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'payment',
        ]);
    }

    public function refund(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'refund',
        ]);
    }
}
