<?php
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\ProfileUpdateRequest;

$user = User::where('user_type', 'gig_worker')->first();
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
    echo "VALIDATION FAILED:\n";
    print_r($validator->errors()->toArray());
} else {
    try {
        foreach ($data as $key => $value) {
            $user->$key = $value;
        }
        $user->save();
        echo "DB SAVE OK\n";
    } catch (\Exception $e) {
        echo "DB SAVE FAILED:\n";
        echo $e->getMessage();
    }
}
