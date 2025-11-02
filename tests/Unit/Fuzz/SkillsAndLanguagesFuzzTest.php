<?php

namespace Tests\Unit\Fuzz;

use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class SkillsAndLanguagesFuzzTest extends TestCase
{
    public function test_random_languages_and_skills_arrays_are_sanitized(): void
    {
        $rules = [
            'languages' => 'nullable',
            'skills_requirements' => 'nullable|array',
            'skills_requirements.*.skill' => 'required|string|max:100',
            'skills_requirements.*.experience_level' => 'required|in:beginner,intermediate,expert',
            'skills_requirements.*.importance' => 'required|in:required,preferred',
        ];

        $iterations = 10;
        for ($i=0; $i<$iterations; $i++) {
            $langs = [
                'en, tl , ',
                ['English',' Tagalog ',''],
                null,
                '',
            ][array_rand([0,1,2,3])];

            $skills = [];
            $count = rand(0, 3);
            for ($k=0; $k<$count; $k++) {
                $skills[] = [
                    'skill' => ['PHP','Laravel','MySQL','Vue.js'][array_rand([0,1,2,3])],
                    'experience_level' => ['beginner','intermediate','expert'][array_rand([0,1,2])],
                    'importance' => ['required','preferred'][array_rand([0,1])],
                ];
            }

            $v = Validator::make([
                'languages' => $langs,
                'skills_requirements' => $skills ?: null,
            ], $rules);

            $this->assertFalse($v->fails(), 'Validator failed on randomized input iteration '.$i);
        }
    }
}
