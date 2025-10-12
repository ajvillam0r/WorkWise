<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FraudDetectionRule;
use App\Models\User;

class FraudDetectionRulesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🛡️  Creating fraud detection rules...');

        // Get admin user for created_by field
        $admin = User::where('is_admin', true)->first();
        if (!$admin) {
            // Get first user if no admin
            $admin = User::first();
            if (!$admin) {
                $this->command->error('❌ No users found! Please create a user first.');
                return;
            }
        }

        // Clear existing rules
        FraudDetectionRule::query()->delete();

        $rules = [
            // Payment Rules
            [
                'rule_name' => 'Payment Velocity Check',
                'rule_type' => 'payment_velocity',
                'description' => 'Detect rapid successive payments within 5 minutes',
                'conditions' => ['action' => 'require_verification'],
                'parameters' => [
                    'time_window' => 5,
                    'max_attempts' => 3,
                ],
                'time_window_minutes' => 5,
                'risk_score' => 75.00,
                'severity' => 'high',
                'enabled' => true,
                'priority' => 1,
                'created_by' => $admin->id,
            ],
            [
                'rule_name' => 'High Value Transaction',
                'rule_type' => 'transaction_anomaly',
                'description' => 'Flag transactions that are 3x higher than user average',
                'conditions' => ['action' => 'manual_review'],
                'parameters' => [
                    'multiplier' => 3,
                    'min_amount' => 1000,
                ],
                'time_window_minutes' => 60,
                'risk_score' => 60.00,
                'severity' => 'medium',
                'enabled' => true,
                'priority' => 2,
                'created_by' => $admin->id,
            ],
            [
                'rule_name' => 'Failed Payment Attempts',
                'rule_type' => 'payment_failure',
                'description' => 'Multiple failed payment attempts in 24 hours',
                'conditions' => ['action' => 'require_verification'],
                'parameters' => [
                    'time_window' => 24,
                    'max_failures' => 3,
                ],
                'time_window_minutes' => 1440, // 24 hours
                'risk_score' => 65.00,
                'severity' => 'medium',
                'enabled' => true,
                'priority' => 3,
                'created_by' => $admin->id,
            ],

            // Account Behavior Rules
            [
                'rule_name' => 'Email Change Alert',
                'rule_type' => 'profile_modification',
                'description' => 'Flag email address changes (potential account takeover)',
                'conditions' => ['action' => 'require_verification'],
                'parameters' => [
                    'cooldown_days' => 30,
                ],
                'time_window_minutes' => 43200, // 30 days
                'risk_score' => 85.00,
                'severity' => 'high',
                'enabled' => true,
                'priority' => 1,
                'created_by' => $admin->id,
            ],
            [
                'rule_name' => 'Rapid Profile Changes',
                'rule_type' => 'profile_modification',
                'description' => 'Multiple profile changes within 1 hour',
                'conditions' => ['action' => 'manual_review'],
                'parameters' => [
                    'time_window' => 1,
                    'max_changes' => 3,
                ],
                'time_window_minutes' => 60,
                'risk_score' => 70.00,
                'severity' => 'medium',
                'enabled' => true,
                'priority' => 2,
                'created_by' => $admin->id,
            ],

            // Geographic Rules
            [
                'rule_name' => 'Geographic Anomaly',
                'rule_type' => 'location_mismatch',
                'description' => 'Access from unexpected country (outside Philippines)',
                'conditions' => ['action' => 'require_verification', 'allowed_countries' => ['Philippines', 'PH']],
                'parameters' => [
                    'allowed_countries' => ['Philippines', 'PH'],
                ],
                'time_window_minutes' => 60,
                'risk_score' => 60.00,
                'severity' => 'medium',
                'enabled' => true,
                'priority' => 3,
                'created_by' => $admin->id,
            ],
            [
                'rule_name' => 'Rapid IP Changes',
                'rule_type' => 'device_behavior',
                'description' => 'Multiple IP addresses within 24 hours',
                'conditions' => ['action' => 'monitor'],
                'parameters' => [
                    'time_window' => 24,
                    'max_ips' => 3,
                ],
                'time_window_minutes' => 1440,
                'risk_score' => 55.00,
                'severity' => 'low',
                'enabled' => true,
                'priority' => 4,
                'created_by' => $admin->id,
            ],

            // Behavioral Rules
            [
                'rule_name' => 'Bid Flooding',
                'rule_type' => 'bid_manipulation',
                'description' => 'Rapid bid submissions (5+ in 10 minutes)',
                'conditions' => ['action' => 'rate_limit'],
                'parameters' => [
                    'time_window' => 10,
                    'max_bids' => 5,
                ],
                'time_window_minutes' => 10,
                'risk_score' => 65.00,
                'severity' => 'medium',
                'enabled' => true,
                'priority' => 2,
                'created_by' => $admin->id,
            ],
            [
                'rule_name' => 'Message Spam',
                'rule_type' => 'message_abuse',
                'description' => 'High message volume (10+ in 5 minutes)',
                'conditions' => ['action' => 'rate_limit'],
                'parameters' => [
                    'time_window' => 5,
                    'max_messages' => 10,
                ],
                'time_window_minutes' => 5,
                'risk_score' => 50.00,
                'severity' => 'low',
                'enabled' => true,
                'priority' => 5,
                'created_by' => $admin->id,
            ],
            [
                'rule_name' => 'Bot Detection',
                'rule_type' => 'automated_behavior',
                'description' => 'Detect bot-like behavior patterns',
                'conditions' => ['action' => 'block'],
                'parameters' => [
                    'requests_per_minute' => 50,
                ],
                'time_window_minutes' => 1,
                'risk_score' => 80.00,
                'severity' => 'high',
                'enabled' => true,
                'priority' => 1,
                'created_by' => $admin->id,
            ],
        ];

        foreach ($rules as $rule) {
            FraudDetectionRule::create($rule);
            $this->command->info("  ✓ Created: {$rule['rule_name']}");
        }

        $this->command->info("\n✅ Created " . count($rules) . " fraud detection rules!");
        $this->command->info("🛡️  Fraud detection system is ready to use!");
    }
}
