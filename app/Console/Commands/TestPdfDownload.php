<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\Contract;

class TestPdfDownload extends Command
{
    protected $signature = 'test:pdf-download {contract_id}';
    protected $description = 'Test PDF download functionality for a contract';

    public function handle()
    {
        $contractId = $this->argument('contract_id');
        
        $contract = Contract::find($contractId);
        
        if (!$contract) {
            $this->error("Contract with ID {$contractId} not found.");
            return 1;
        }
        
        if (!$contract->pdf_path) {
            $this->error("Contract {$contractId} has no PDF path.");
            return 1;
        }
        
        $this->info("Testing PDF download for Contract ID: {$contractId}");
        $this->info("PDF path: {$contract->pdf_path}");
        
        // Test Storage::exists
        $exists = Storage::exists($contract->pdf_path);
        $this->info("Storage::exists(): " . ($exists ? 'true' : 'false'));
        
        if ($exists) {
            // Test Storage::path
            $fullPath = Storage::path($contract->pdf_path);
            $this->info("Full path: {$fullPath}");
            
            // Test file_exists
            $fileExists = file_exists($fullPath);
            $this->info("file_exists(): " . ($fileExists ? 'true' : 'false'));
            
            if ($fileExists) {
                $fileSize = filesize($fullPath);
                $this->info("File size: {$fileSize} bytes");
                $this->info("✅ PDF download should work!");
                return 0;
            } else {
                $this->error("❌ File does not exist at the resolved path.");
                return 1;
            }
        } else {
            $this->error("❌ Storage cannot find the file.");
            return 1;
        }
    }
}
