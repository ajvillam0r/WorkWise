<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class AdminPolicy
{
    /**
     * Determine whether the user can access admin panel
     */
    public function accessAdminPanel(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        // Admins can update any user, but users can only update themselves
        return $user->isAdmin() || $user->id === $model->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        // Only admins can delete users, and they can't delete themselves
        return $user->isAdmin() && $user->id !== $model->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can manage user roles
     */
    public function manageUserRoles(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can manage reports
     */
    public function manageReports(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can view analytics
     */
    public function viewAnalytics(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can manage system settings
     */
    public function manageSettings(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can manage verifications
     */
    public function manageVerifications(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can export data
     */
    public function exportData(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can import data
     */
    public function importData(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can view system health
     */
    public function viewSystemHealth(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can clear cache
     */
    public function clearCache(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can suspend users
     */
    public function suspendUsers(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can activate users
     */
    public function activateUsers(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can create admin users
     */
    public function createAdminUsers(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can bulk update records
     */
    public function bulkUpdate(User $user): bool
    {
        return $user->isAdmin();
    }
}
