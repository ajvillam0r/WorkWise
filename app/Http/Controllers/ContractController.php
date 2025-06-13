<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\ContractSignature;
use App\Models\Project;
use App\Services\ContractService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ContractController extends Controller
{
    protected ContractService $contractService;

    public function __construct(ContractService $contractService)
    {
        $this->contractService = $contractService;
    }

    /**
     * Display a listing of contracts for the authenticated user
     */
    public function index(): Response
    {
        $user = auth()->user();
        
        $contracts = Contract::where(function ($query) use ($user) {
            $query->where('client_id', $user->id)
                  ->orWhere('freelancer_id', $user->id);
        })
        ->with(['client', 'freelancer', 'job', 'project', 'signatures'])
        ->orderBy('created_at', 'desc')
        ->paginate(10);

        return Inertia::render('Contracts/Index', [
            'contracts' => $contracts,
            'userRole' => $user->user_type
        ]);
    }

    /**
     * Display the specified contract
     */
    public function show(Contract $contract): Response
    {
        $user = auth()->user();

        // Check if user is authorized to view this contract
        if ($contract->client_id !== $user->id && $contract->freelancer_id !== $user->id) {
            abort(403, 'Unauthorized to view this contract');
        }

        $userRole = $contract->getUserRole($user->id);

        // Additional check: Freelancers can only view contract after client has signed
        if ($userRole === 'freelancer' && !$contract->canFreelancerAccess()) {
            abort(403, 'Contract is not available for viewing until the client signs first');
        }

        $contract->load([
            'client',
            'freelancer',
            'job',
            'project',
            'bid',
            'signatures'
        ]);

        $canSign = $contract->canUserSign($user->id);
        $nextSigner = $contract->getNextSigner();

        return Inertia::render('Contracts/Show', [
            'contract' => $contract,
            'userRole' => $userRole,
            'canSign' => $canSign,
            'nextSigner' => $nextSigner,
            'hasUserSigned' => $contract->hasUserSigned($user->id)
        ]);
    }

    /**
     * Show contract signing form
     */
    public function sign(Contract $contract): Response
    {
        $user = auth()->user();

        \Log::info('Contract signing attempt', [
            'contract_id' => $contract->id,
            'contract_contract_id' => $contract->contract_id,
            'user_id' => $user->id,
            'user_role' => $user->role,
            'contract_client_id' => $contract->client_id,
            'contract_freelancer_id' => $contract->freelancer_id,
            'contract_status' => $contract->status,
            'user_can_sign' => $contract->canUserSign($user->id),
            'user_role_in_contract' => $contract->getUserRole($user->id),
            'has_user_signed' => $contract->hasUserSigned($user->id)
        ]);

        $userRole = $contract->getUserRole($user->id);

        // Additional check: Freelancers can only sign after client has signed
        if ($userRole === 'freelancer' && !$contract->canFreelancerAccess()) {
            \Log::warning('Freelancer trying to sign before client', [
                'contract_id' => $contract->id,
                'user_id' => $user->id,
                'client_signed' => $contract->hasClientSigned()
            ]);
            abort(403, 'You cannot sign this contract until the client signs first');
        }

        // Check authorization
        if (!$contract->canUserSign($user->id)) {
            \Log::warning('Contract signing authorization failed', [
                'contract_id' => $contract->id,
                'user_id' => $user->id,
                'reason' => 'canUserSign returned false'
            ]);
            abort(403, 'You are not authorized to sign this contract or have already signed it');
        }

        $contract->load([
            'client',
            'freelancer',
            'job',
            'project',
            'bid'
        ]);

        return Inertia::render('Contracts/Sign', [
            'contract' => $contract,
            'userRole' => $userRole,
            'user' => $user
        ]);
    }

    /**
     * Process contract signature
     */
    public function processSignature(Request $request, Contract $contract): JsonResponse
    {
        $user = auth()->user();

        // Validate request
        $request->validate([
            'full_name' => 'required|string|max:255',
            'browser_info' => 'nullable|array'
        ]);

        $userRole = $contract->getUserRole($user->id);

        // Additional check: Freelancers can only sign after client has signed
        if ($userRole === 'freelancer' && !$contract->canFreelancerAccess()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot sign this contract until the client signs first'
            ], 403);
        }

        // Check authorization
        if (!$contract->canUserSign($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to sign this contract or have already signed it'
            ], 403);
        }

        try {
            \DB::beginTransaction();

            $userRole = $contract->getUserRole($user->id);
            
            // Create signature
            $signature = ContractSignature::createSignature(
                $contract,
                $user,
                $request->full_name,
                $userRole,
                [
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'browser_info' => $request->browser_info,
                    'contract_version_hash' => hash('sha256', serialize($contract->toArray()))
                ]
            );

            // Update contract status
            $this->contractService->updateContractAfterSignature($contract, $userRole);

            \DB::commit();

            $contract->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Contract signed successfully!',
                'contract_status' => $contract->status,
                'redirect_url' => $contract->isFullySigned()
                    ? route('projects.show', $contract->project)
                    : route('contracts.show', $contract)
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Contract signing failed', [
                'contract_id' => $contract->id,
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to sign contract. Please try again.'
            ], 500);
        }
    }

    /**
     * Download contract PDF
     */
    public function downloadPdf(Contract $contract)
    {
        $user = auth()->user();

        // Check authorization
        if ($contract->client_id !== $user->id && $contract->freelancer_id !== $user->id) {
            abort(403, 'Unauthorized to download this contract');
        }

        // Generate PDF if not exists or contract is fully signed and PDF is outdated
        if (!$contract->pdf_path || ($contract->isFullySigned() && !$contract->pdf_generated_at)) {
            $this->contractService->generateContractPdf($contract);
            $contract->refresh();
        }

        // Use Storage facade to get the correct path
        if (!$contract->pdf_path || !Storage::exists($contract->pdf_path)) {
            abort(404, 'Contract PDF not found');
        }

        return response()->download(
            Storage::path($contract->pdf_path),
            "WorkWise_Contract_{$contract->contract_id}.pdf"
        );
    }

    /**
     * Cancel contract (only if not fully signed)
     */
    public function cancel(Request $request, Contract $contract): JsonResponse
    {
        $user = auth()->user();

        // Only client can cancel, and only if not fully signed
        if ($contract->client_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the client can cancel the contract'
            ], 403);
        }

        if ($contract->isFullySigned()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel a fully signed contract'
            ], 400);
        }

        $request->validate([
            'cancellation_reason' => 'required|string|max:500'
        ]);

        try {
            $contract->update([
                'status' => 'cancelled'
            ]);

            // Update project status
            $contract->project->update([
                'status' => 'cancelled',
                'completion_notes' => 'Contract cancelled: ' . $request->cancellation_reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Contract cancelled successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Contract cancellation failed', [
                'contract_id' => $contract->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel contract'
            ], 500);
        }
    }
}
