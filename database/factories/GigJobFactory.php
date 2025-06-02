<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GigJob>
 */
class GigJobFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $skills = ['PHP', 'Laravel', 'React', 'JavaScript', 'Python', 'Java', 'Node.js', 'Vue.js', 'Angular', 'CSS'];

        return [
            'employer_id' => User::factory()->create(['user_type' => 'client'])->id,
            'title' => fake()->jobTitle(),
            'description' => fake()->paragraphs(3, true),
            'required_skills' => fake()->randomElements($skills, fake()->numberBetween(2, 5)),
            'budget_type' => fake()->randomElement(['fixed', 'hourly']),
            'budget_min' => fake()->numberBetween(500, 2000),
            'budget_max' => fake()->numberBetween(2000, 5000),
            'experience_level' => fake()->randomElement(['beginner', 'intermediate', 'expert']),
            'estimated_duration_days' => fake()->numberBetween(7, 90),
            'status' => 'open',
            'deadline' => fake()->dateTimeBetween('+1 week', '+3 months'),
            'location' => fake()->city(),
            'is_remote' => fake()->boolean(70), // 70% chance of being remote
        ];
    }
}
