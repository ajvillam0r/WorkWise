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
            $query->where('employer_id', $user->id)
                  ->orWhere('gig_worker_id', $user->id);
        })
        ->with(['employer', 'gigWorker', 'job', 'project', 'signatures'])
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
        if ($contract->employer_id !== $user->id && $contract->gig_worker_id !== $user->id) {
            abort(403, 'Unauthorized to view this contract');
        }

        $userRole = $contract->getUserRole($user->id);

        // Additional check: Gig workers can only view contract after employer has signed
        if ($userRole === 'gig_worker' && !$contract->canGigWorkerAccess()) {
            abort(403, 'Contract is not available for viewing until the employer signs first');
        }

        $contract->load([
            'employer',
            'gigWorker',
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
            'user_role' => $user->user_type,
            'contract_employer_id' => $contract->employer_id,
            'contract_gig_worker_id' => $contract->gig_worker_id,
            'contract_status' => $contract->status,
            'user_can_sign' => $contract->canUserSign($user->id),
            'user_role_in_contract' => $contract->getUserRole($user->id),
            'has_user_signed' => $contract->hasUserSigned($user->id)
        ]);

        $userRole = $contract->getUserRole($user->id);

        // Additional check: Gig workers can only sign after employer has signed
        if ($userRole === 'gig_worker' && !$contract->canGigWorkerAccess()) {
            \Log::warning('Gig worker trying to sign before employer', [
                'contract_id' => $contract->id,
                'user_id' => $user->id,
                'employer_signed' => $contract->hasEmployerSigned()
            ]);

            // Load contract relationships for proper display
            $contract->load([
                'employer',
                'gigWorker',
                'job',
                'project',
                'bid',
                'signatures'
            ]);

            // Return Inertia response with waiting flag for modal handling
            return Inertia::render('Contracts/OptimizedSign', [
                'contract' => $contract,
                'userRole' => $userRole,
                'user' => $user,
                'waitingForEmployer' => true,
                'employerName' => $contract->employer ? $contract->employer->first_name . ' ' . $contract->employer->last_name : 'the employer'
            ]);
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
            'employer',
            'gigWorker',
            'job',
            'project',
            'bid',
            'signatures'
        ]);

        return Inertia::render('Contracts/OptimizedSign', [
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

        // Enhanced validation
        $request->validate([
            'full_name' => 'required|string|max:255|min:2',
            'browser_info' => 'nullable|array',
            'browser_info.userAgent' => 'nullable|string',
            'browser_info.language' => 'nullable|string',
            'browser_info.platform' => 'nullable|string',
            'browser_info.timestamp' => 'nullable|string',
        ]);

        // Additional security checks
        $fullName = trim($request->full_name);
        if (empty($fullName) || strlen($fullName) < 2) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a valid full name for the signature'
            ], 422);
        }

        $userRole = $contract->getUserRole($user->id);

        // Additional check: Gig workers can only sign after employer has signed
        if ($userRole === 'gig_worker' && !$contract->canGigWorkerAccess()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot sign this contract until the employer signs first',
                'waiting_for_employer' => true,
                'employer_name' => $contract->employer ? $contract->employer->first_name . ' ' . $contract->employer->last_name : 'the employer'
            ], 200); // Return 200 instead of 403 for modal handling
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

            // Ensure contract relationships are loaded
            $contract->load([
                'employer',
                'gigWorker',
                'job',
                'project',
                'bid',
                'signatures'
            ]);

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

            // Check if contract has a valid project
            $redirectUrl = route('contracts.show', $contract);
            if ($contract->isFullySigned() && $contract->project_id) {
                $redirectUrl = route('projects.show', $contract->project_id);
            }

            return response()->json([
                'success' => true,
                'message' => 'Contract signed successfully!',
                'contract_status' => $contract->status,
                'redirect_url' => $redirectUrl
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Contract signing failed', [
                'contract_id' => $contract->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to sign contract. Please try again. Error: ' . $e->getMessage()
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
        if ($contract->employer_id !== $user->id && $contract->gig_worker_id !== $user->id) {
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

        // Only employer can cancel, and only if not fully signed
        if ($contract->employer_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the employer can cancel the contract'
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
