<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\ProfileUpdateRequest;

class TestProfileSave extends Command
{
    protected $signature = 'test:profile-save';
    protected $description = 'Test profile save validation and database logic';

    public function handle()
    {
        $user = User::where('user_type', 'gig_worker')->first();
        if (!$user) {
            $this->error("No gig worker found.");
            return;
        }

        $data = [
            'professional_title' => 'Test',
            'hourly_rate' => 25.50,
            'broad_category' => 'Web Dev',
            'specific_services' => ['Frontend'],
            'skills_with_experience' => [['skill' => 'React', 'experience_level' => 'expert']]
        ];

        $request = new ProfileUpdateRequest();
        $request->setUserResolver(function() use ($user) { return $user; });

        $validator = Validator::make($data, $request->rules());

        if ($validator->fails()) {
            $this->error("VALIDATION FAILED:");
            foreach ($validator->errors()->toArray() as $field => $errors) {
                $this->error("$field: " . implode(", ", $errors));
            }
        } else {
            try {
                foreach ($data as $key => $value) {
                    if ($user->isFillable($key)) {
                        $user->$key = $value;
                    }
                }
                $user->save();
                $this->info("DB SAVE OK");
            } catch (\Exception $e) {
                $this->error("DB SAVE FAILED: " . $e->getMessage());
            }
        }
    }
}
