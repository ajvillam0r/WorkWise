<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\Transaction;

class TestTransactionsSeeder extends Seeder
{
    public function run()
    {
        $project = Project::first();

        if (!$project) {
            $this->call(TestTransactionSeeder::class);
            $project = Project::first();
        }

        // Create escrow transaction
        $escrowTransaction = Transaction::create([
            'project_id' => $project->id,
            'payer_id' => $project->client_id,
            'payee_id' => $project->freelancer_id,
            'amount' => $project->agreed_amount,
            'platform_fee' => $project->platform_fee,
            'net_amount' => $project->net_amount,
            'type' => 'escrow',
            'status' => 'completed',
            'stripe_payment_intent_id' => 'pi_test_' . time(),
            'stripe_charge_id' => 'ch_test_' . time(),
            'description' => 'Test escrow payment for project #' . $project->id,
            'processed_at' => now()
        ]);

        // Create release transaction
        $releaseTransaction = Transaction::create([
            'project_id' => $project->id,
            'payer_id' => $project->client_id,
            'payee_id' => $project->freelancer_id,
            'amount' => $project->net_amount,
            'platform_fee' => 0,
            'net_amount' => $project->net_amount,
            'type' => 'release',
            'status' => 'completed',
            'stripe_payment_intent_id' => 'tr_test_' . time(),
            'description' => 'Test payment release for project #' . $project->id,
            'processed_at' => now()
        ]);

        // Create a refund transaction
        $refundTransaction = Transaction::create([
            'project_id' => $project->id,
            'payer_id' => $project->freelancer_id,
            'payee_id' => $project->client_id,
            'amount' => $project->agreed_amount,
            'platform_fee' => 0,
            'net_amount' => $project->agreed_amount,
            'type' => 'refund',
            'status' => 'completed',
            'stripe_payment_intent_id' => 'ref_test_' . time(),
            'description' => 'Test refund for project #' . $project->id,
            'processed_at' => now()
        ]);

        echo "Created test transactions:\n";
        echo "- Escrow Transaction ID: " . $escrowTransaction->id . "\n";
        echo "- Release Transaction ID: " . $releaseTransaction->id . "\n";
        echo "- Refund Transaction ID: " . $refundTransaction->id . "\n";
    }
} 