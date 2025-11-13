<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Review>
 */
class ReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => 1, // Will be set explicitly in tests or use a default
            'reviewer_id' => User::factory(),
            'reviewee_id' => User::factory(),
            'rating' => fake()->numberBetween(1, 5),
            'comment' => fake()->paragraph(),
            'criteria_ratings' => [
                'quality' => fake()->numberBetween(1, 5),
                'communication' => fake()->numberBetween(1, 5),
                'professionalism' => fake()->numberBetween(1, 5),
            ],
            'is_public' => true,
        ];
    }
    
    /**
     * Create a review without a project (for profile reviews)
     */
    public function withoutProject(): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => null,
        ]);
    }
}
