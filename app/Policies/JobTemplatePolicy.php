<?php

namespace App\Policies;

use App\Models\JobTemplate;
use App\Models\User;

class JobTemplatePolicy
{
    /**
     * Determine if user can view job template
     */
    public function view(User $user, JobTemplate $jobTemplate): bool
    {
        return $user->id === $jobTemplate->employer_id;
    }

    /**
     * Determine if user can create job templates
     */
    public function create(User $user): bool
    {
        return $user->isEmployer();
    }

    /**
     * Determine if user can update job template
     */
    public function update(User $user, JobTemplate $jobTemplate): bool
    {
        return $user->id === $jobTemplate->employer_id;
    }

    /**
     * Determine if user can delete job template
     */
    public function delete(User $user, JobTemplate $jobTemplate): bool
    {
        return $user->id === $jobTemplate->employer_id;
    }
}
