<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\User;
use App\Models\ContractSignature;
use Illuminate\Support\Facades\DB;

class ContractStatusService
{
    /**
     * Get comprehensive contract status for user
     */
    public function getContractStatus(Contract $contract, User $user): array
    {
        $userRole = $contract->getUserRole($user->id);
        $canSign = $contract->canUserSign($user->id);
        $hasUserSigned = $contract->hasUserSigned($user->id);
        $nextSigner = $contract->getNextSigner();

        // Get signature information
        $employerSignature = $contract->getSignatureForRole('employer');
        $gigWorkerSignature = $contract->getSignatureForRole('gig_worker');

        // Determine status message and actions
        $statusInfo = $this->determineStatusInfo($contract, $userRole, $canSign, $hasUserSigned, $nextSigner);

        return [
            'contract_status' => $contract->status,
            'user_role' => $userRole,
            'can_sign' => $canSign,
            'has_user_signed' => $hasUserSigned,
            'next_signer' => $nextSigner,
            'employer_signed' => !is_null($employerSignature),
            'gig_worker_signed' => !is_null($gigWorkerSignature),
            'is_fully_signed' => $contract->isFullySigned(),
            'employer_signature' => $employerSignature,
            'gig_worker_signature' => $gigWorkerSignature,
            'status_info' => $statusInfo,
            'signing_workflow' => $this->getSigningWorkflow($contract, $userRole),
            'can_download_pdf' => $this->canDownloadPdf($contract, $user),
            'estimated_completion' => $this->getEstimatedCompletion($contract)
        ];
    }

    /**
     * Determine status information and available actions
     */
    private function determineStatusInfo(Contract $contract, ?string $userRole, bool $canSign, bool $hasUserSigned, ?string $nextSigner): array
    {
        if ($contract->isFullySigned()) {
            return [
                'status' => 'completed',
                'title' => 'Contract Fully Signed',
                'message' => 'Both parties have signed the contract. The project can now begin.',
                'color' => 'green',
                'icon' => 'check-circle',
                'actions' => ['download_pdf', 'view_project']
            ];
        }

        if ($contract->isCancelled()) {
            return [
                'status' => 'cancelled',
                'title' => 'Contract Cancelled',
                'message' => 'This contract has been cancelled and is no longer active.',
                'color' => 'red',
                'icon' => 'x-circle',
                'actions' => ['view_details']
            ];
        }

        if ($hasUserSigned) {
            $waitingFor = $userRole === 'employer' ? 'gig worker' : 'employer';
            return [
                'status' => 'waiting',
                'title' => 'Waiting for Other Party',
                'message' => "You have signed the contract. Waiting for the {$waitingFor} to sign.",
                'color' => 'blue',
                'icon' => 'clock',
                'actions' => ['download_pdf', 'send_reminder']
            ];
        }

        if ($canSign) {
            return [
                'status' => 'ready_to_sign',
                'title' => 'Ready to Sign',
                'message' => 'The contract is ready for your signature.',
                'color' => 'yellow',
                'icon' => 'pencil',
                'actions' => ['sign_contract', 'download_pdf']
            ];
        }

        if ($userRole === 'gig_worker' && !$contract->canGigWorkerAccess()) {
            return [
                'status' => 'waiting_employer',
                'title' => 'Waiting for Employer',
                'message' => 'The employer must sign the contract first before you can proceed.',
                'color' => 'gray',
                'icon' => 'clock',
                'actions' => ['view_details']
            ];
        }

        return [
            'status' => 'pending',
            'title' => 'Contract Pending',
            'message' => 'Contract is being prepared.',
            'color' => 'gray',
            'icon' => 'document',
            'actions' => ['view_details']
        ];
    }

    /**
     * Get signing workflow steps
     */
    private function getSigningWorkflow(Contract $contract, ?string $userRole): array
    {
        $employerSigned = $contract->hasEmployerSigned();
        $gigWorkerSigned = $contract->getSignatureForRole('gig_worker') !== null;

        $steps = [
            [
                'step' => 1,
                'role' => 'employer',
                'title' => 'Employer Signature',
                'status' => $employerSigned ? 'completed' : ($contract->isPendingEmployerSignature() ? 'current' : 'pending'),
                'completed_at' => $employerSigned ? $contract->employer_signed_at : null,
                'is_current_user' => $userRole === 'employer'
            ],
            [
                'step' => 2,
                'role' => 'gig_worker',
                'title' => 'Gig Worker Signature',
                'status' => $gigWorkerSigned ? 'completed' : ($contract->isPendingGigWorkerSignature() ? 'current' : 'pending'),
                'completed_at' => $gigWorkerSigned ? $contract->gig_worker_signed_at : null,
                'is_current_user' => $userRole === 'gig_worker'
            ],
            [
                'step' => 3,
                'role' => 'system',
                'title' => 'Contract Activation',
                'status' => $contract->isFullySigned() ? 'completed' : 'pending',
                'completed_at' => $contract->isFullySigned() ? $contract->fully_signed_at : null,
                'is_current_user' => false
            ]
        ];

        return $steps;
    }

    /**
     * Check if user can download PDF
     */
    private function canDownloadPdf(Contract $contract, User $user): bool
    {
        // User must be part of the contract
        if ($contract->employer_id !== $user->id && $contract->gig_worker_id !== $user->id) {
            return false;
        }

        // Gig workers can only download after employer signs
        if ($contract->getUserRole($user->id) === 'gig_worker' && !$contract->canGigWorkerAccess()) {
            return false;
        }

        return true;
    }

    /**
     * Get estimated completion time for signing process
     */
    private function getEstimatedCompletion(Contract $contract): ?array
    {
        if ($contract->isFullySigned() || $contract->isCancelled()) {
            return null;
        }

        $createdAt = $contract->created_at;
        $now = now();
        $hoursElapsed = $createdAt->diffInHours($now);

        // Estimate based on typical signing patterns
        $estimatedTotalHours = 48; // 2 days typical
        $remainingHours = max(0, $estimatedTotalHours - $hoursElapsed);

        if ($remainingHours === 0) {
            return [
                'status' => 'overdue',
                'message' => 'Contract signing is overdue',
                'hours_overdue' => $hoursElapsed - $estimatedTotalHours
            ];
        }

        return [
            'status' => 'on_track',
            'estimated_hours_remaining' => $remainingHours,
            'estimated_completion' => $now->addHours($remainingHours),
            'progress_percentage' => min(100, ($hoursElapsed / $estimatedTotalHours) * 100)
        ];
    }

    /**
     * Get contract signing statistics for user
     */
    public function getUserSigningStats(User $user): array
    {
        $userId = $user->id;

        // Get contracts where user is involved
        $contractsQuery = Contract::where(function ($query) use ($userId) {
            $query->where('employer_id', $userId)
                  ->orWhere('gig_worker_id', $userId);
        });

        $totalContracts = $contractsQuery->count();
        $fullySignedContracts = $contractsQuery->where('status', 'fully_signed')->count();
        $pendingContracts = $contractsQuery->whereIn('status', [
            'pending_employer_signature',
            'pending_gig_worker_signature'
        ])->count();
        $cancelledContracts = $contractsQuery->where('status', 'cancelled')->count();

        // Get user's signature statistics
        $userSignatures = ContractSignature::where('user_id', $userId)->count();
        $avgSigningTime = $this->getAverageSigningTime($user);

        return [
            'total_contracts' => $totalContracts,
            'fully_signed' => $fullySignedContracts,
            'pending_signature' => $pendingContracts,
            'cancelled' => $cancelledContracts,
            'completion_rate' => $totalContracts > 0 ? round(($fullySignedContracts / $totalContracts) * 100, 1) : 0,
            'user_signatures' => $userSignatures,
            'average_signing_time_hours' => $avgSigningTime
        ];
    }

    /**
     * Calculate average time user takes to sign contracts
     */
    private function getAverageSigningTime(User $user): ?float
    {
        $signatures = ContractSignature::where('user_id', $user->id)
            ->with('contract')
            ->get();

        if ($signatures->isEmpty()) {
            return null;
        }

        $totalHours = 0;
        $validSignatures = 0;

        foreach ($signatures as $signature) {
            if ($signature->contract && $signature->contract->created_at) {
                $hoursToSign = $signature->contract->created_at->diffInHours($signature->signed_at);
                $totalHours += $hoursToSign;
                $validSignatures++;
            }
        }

        return $validSignatures > 0 ? round($totalHours / $validSignatures, 1) : null;
    }

    /**
     * Send reminder for contract signing
     */
    public function sendSigningReminder(Contract $contract, User $fromUser): bool
    {
        try {
            $nextSigner = $contract->getNextSigner();
            
            if (!$nextSigner) {
                return false; // No one needs to sign
            }

            $targetUser = null;
            if ($nextSigner === 'employer') {
                $targetUser = $contract->employer;
            } elseif ($nextSigner === 'gig_worker') {
                $targetUser = $contract->gigWorker;
            }

            if (!$targetUser) {
                return false;
            }

            // Use notification service to send reminder
            $notificationService = app(NotificationService::class);
            $notificationService->createContractSigningReminderNotification($targetUser, [
                'contract_id' => $contract->id,
                'contract_number' => $contract->contract_id,
                'job_title' => $contract->job->title ?? 'Unknown Project',
                'from_user' => $fromUser->first_name . ' ' . $fromUser->last_name,
                'days_pending' => $contract->created_at->diffInDays(now())
            ]);

            return true;

        } catch (\Exception $e) {
            \Log::error('Failed to send contract signing reminder', [
                'contract_id' => $contract->id,
                'from_user_id' => $fromUser->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }
}
