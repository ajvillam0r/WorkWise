<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PortfolioItem>
 */
class PortfolioItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'project_url' => fake()->optional()->url(),
            'images' => [],
            'document_file' => null,
            'tags' => fake()->words(3),
            'completion_date' => fake()->dateTimeBetween('-2 years', 'now'),
            'project_type' => fake()->randomElement(['web', 'mobile', 'design', 'other']),
            'display_order' => fake()->numberBetween(1, 10),
        ];
    }
}
