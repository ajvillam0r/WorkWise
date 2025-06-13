<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Project;
use App\Models\Bid;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ContractService
{
    /**
     * Create contract from accepted bid
     */
    public function createContractFromBid(Project $project, Bid $bid): Contract
    {
        try {
            \Log::info('Starting contract creation from bid', [
                'project_id' => $project->id,
                'bid_id' => $bid->id
            ]);

            $job = $bid->job;
            $client = $job->employer;
            $freelancer = $bid->freelancer;

            \Log::info('Contract parties identified', [
                'client_id' => $client->id,
                'client_name' => $client->first_name . ' ' . $client->last_name,
                'freelancer_id' => $freelancer->id,
                'freelancer_name' => $freelancer->first_name . ' ' . $freelancer->last_name,
                'job_id' => $job->id,
                'job_title' => $job->title
            ]);

            // Calculate project dates
            $startDate = now()->addDays(2); // Give 2 days for contract signing
            $endDate = $startDate->copy()->addDays($bid->estimated_days);

            // Default responsibilities
            $clientResponsibilities = [
                'Provide detailed requirements and feedback promptly.',
                'Supply all necessary content and materials for the project.',
                'Approve milestones and release payments as per the agreed schedule.'
            ];

            $freelancerResponsibilities = [
                'Complete the tasks as outlined in the scope of work.',
                'Communicate regularly with the client regarding progress.',
                'Deliver work according to the agreed deadlines and quality standards.',
                'Make revisions based on client feedback within reasonable limits.'
            ];

            $contractData = [
                'contract_id' => Contract::generateContractId(),
                'project_id' => $project->id,
                'client_id' => $client->id,
                'freelancer_id' => $freelancer->id,
                'job_id' => $job->id,
                'bid_id' => $bid->id,
                'scope_of_work' => $this->generateScopeOfWork($job, $bid),
                'total_payment' => $bid->bid_amount,
                'contract_type' => 'Fixed-Price Contract',
                'project_start_date' => $startDate->toDateString(),
                'project_end_date' => $endDate->toDateString(),
                'client_responsibilities' => $clientResponsibilities,
                'freelancer_responsibilities' => $freelancerResponsibilities,
                'preferred_communication' => 'Email and WorkWise messaging',
                'communication_frequency' => 'Weekly updates',
                'status' => 'pending_client_signature'
            ];

            \Log::info('Creating contract with data', [
                'contract_data' => $contractData
            ]);

            $contract = Contract::create($contractData);

            \Log::info('Contract created successfully', [
                'contract_id' => $contract->id,
                'contract_number' => $contract->contract_id
            ]);

            // Update project with contract reference
            $project->update([
                'contract_id' => $contract->id
            ]);

            \Log::info('Project updated with contract reference', [
                'project_id' => $project->id,
                'contract_id' => $contract->id
            ]);

            return $contract;

        } catch (\Exception $e) {
            \Log::error('Contract creation failed in service', [
                'project_id' => $project->id,
                'bid_id' => $bid->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Generate scope of work from job and bid
     */
    private function generateScopeOfWork($job, $bid): string
    {
        $scope = "The freelancer, {$bid->freelancer->first_name} {$bid->freelancer->last_name}, agrees to provide the following services for the client, {$job->employer->first_name} {$job->employer->last_name}:\n\n";
        
        // Add job description as main scope
        $scope .= "Project: {$job->title}\n\n";
        $scope .= "Description: {$job->description}\n\n";
        
        // Add specific deliverables if available
        $skills = $job->required_skills;

        // Handle case where skills might be a string or need decoding
        if (is_string($skills)) {
            // Try to decode if it's a JSON string
            $decoded = json_decode($skills, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $skills = $decoded;
            } else {
                // If it's not valid JSON, treat as null
                $skills = null;
            }
        }

        if ($skills && is_array($skills) && count($skills) > 0) {
            $scope .= "Required Skills/Technologies:\n";
            foreach ($skills as $index => $skill) {
                $scope .= ($index + 1) . ". {$skill}\n";
            }
            $scope .= "\n";
        }

        // Add proposal details
        $scope .= "Additional Details from Proposal:\n";
        $scope .= $bid->proposal_message;

        return $scope;
    }

    /**
     * Update contract status after signature
     * Client must sign first, then freelancer
     */
    public function updateContractAfterSignature(Contract $contract, string $signerRole): void
    {
        $now = now();

        if ($signerRole === 'client') {
            // Client signs first
            $contract->update([
                'client_signed_at' => $now,
                'status' => 'pending_freelancer_signature'
            ]);
        } elseif ($signerRole === 'freelancer') {
            // Freelancer signs after client
            $contract->update([
                'freelancer_signed_at' => $now,
                'status' => 'fully_signed',
                'fully_signed_at' => $now
            ]);

            // Update project status to active and mark contract as signed
            $contract->project->update([
                'status' => 'active',
                'contract_signed' => true,
                'contract_signed_at' => $now,
                'started_at' => $now
            ]);

            // Generate final PDF
            $this->generateContractPdf($contract);
        }
    }

    /**
     * Generate contract PDF
     */
    public function generateContractPdf(Contract $contract): string
    {
        $contract->load([
            'client',
            'freelancer',
            'job',
            'project',
            'bid',
            'signatures'
        ]);

        // Prepare data for PDF
        $data = [
            'contract' => $contract,
            'client' => $contract->client,
            'freelancer' => $contract->freelancer,
            'job' => $contract->job,
            'project' => $contract->project,
            'bid' => $contract->bid,
            'clientSignature' => $contract->getSignatureForRole('client'),
            'freelancerSignature' => $contract->getSignatureForRole('freelancer'),
            'isFullySigned' => $contract->isFullySigned(),
            'generatedAt' => now()
        ];

        // Generate PDF
        $pdf = Pdf::loadView('contracts.pdf', $data)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'defaultFont' => 'DejaVu Sans',
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => true
            ]);

        // Save PDF
        $filename = "contracts/contract_{$contract->contract_id}.pdf";
        Storage::put($filename, $pdf->output());

        // Update contract with PDF path
        $contract->update([
            'pdf_path' => $filename,
            'pdf_generated_at' => now()
        ]);

        return $filename;
    }

    /**
     * Send contract notification to user
     */
    public function sendContractNotification(Contract $contract, User $user, string $type): void
    {
        $message = '';
        $senderId = null;

        switch ($type) {
            case 'contract_ready':
                // Notify freelancer that contract is ready for signing
                $message = "🎉 Great news! {$contract->client->first_name} {$contract->client->last_name} has accepted your bid for \"{$contract->job->title}\"!\n\n" .
                          "💰 Project Amount: ₱{$contract->total_payment}\n" .
                          "📋 Contract ID: {$contract->contract_id}\n\n" .
                          "Please review and sign the contract to begin work. You can access it from your Contracts dashboard.";
                $senderId = $contract->client_id;
                break;

            case 'awaiting_client_signature':
                // Notify client that freelancer has signed
                $message = "✅ {$contract->freelancer->first_name} {$contract->freelancer->last_name} has signed the contract for \"{$contract->job->title}\"!\n\n" .
                          "📋 Contract ID: {$contract->contract_id}\n" .
                          "💰 Project Amount: ₱{$contract->total_payment}\n\n" .
                          "Please review and sign the contract to officially begin the project.";
                $senderId = $contract->freelancer_id;
                break;

            case 'contract_fully_signed':
                // Notify both parties that contract is fully signed
                $message = "🚀 The contract for \"{$contract->job->title}\" is now fully signed!\n\n" .
                          "📋 Contract ID: {$contract->contract_id}\n" .
                          "💰 Project Amount: ₱{$contract->total_payment}\n\n" .
                          "Work can now officially begin. Good luck with your project!";
                $senderId = $user->id === $contract->client_id ? $contract->freelancer_id : $contract->client_id;
                break;
        }

        if ($message && $senderId) {
            try {
                // Create a system message
                \App\Models\Message::create([
                    'sender_id' => $senderId,
                    'receiver_id' => $user->id,
                    'project_id' => $contract->project_id,
                    'message' => $message,
                    'type' => 'system'
                ]);

                \Log::info('Contract notification sent', [
                    'type' => $type,
                    'contract_id' => $contract->id,
                    'user_id' => $user->id,
                    'sender_id' => $senderId
                ]);
            } catch (\Exception $e) {
                \Log::warning('Failed to send contract notification', [
                    'error' => $e->getMessage(),
                    'type' => $type,
                    'contract_id' => $contract->id,
                    'user_id' => $user->id
                ]);
                // Don't fail the whole process for notification failure
            }
        }
    }

    /**
     * Get contract summary for dashboard
     */
    public function getContractSummary(User $user): array
    {
        $query = Contract::where(function ($q) use ($user) {
            $q->where('client_id', $user->id)
              ->orWhere('freelancer_id', $user->id);
        });

        return [
            'total' => $query->count(),
            'pending_signature' => $query->where('status', 'like', 'pending_%')->count(),
            'fully_signed' => $query->where('status', 'fully_signed')->count(),
            'cancelled' => $query->where('status', 'cancelled')->count(),
        ];
    }
}
