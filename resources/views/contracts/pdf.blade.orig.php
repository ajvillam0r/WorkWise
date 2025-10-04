<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WorkWise Contract - {{ $contract->contract_id }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .page {
            background: white;
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }
        
        .header {
            background: #4ade80;
            color: white;
            padding: 20px;
            text-align: center;
            position: relative;
        }
        
        .header-content {
            background: #f5f5f5;
            color: #333;
            padding: 15px 20px;
            margin: 10px 0;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .company-info {
            text-align: right;
            font-size: 11px;
        }
        
        .contract-title {
            font-size: 36px;
            font-weight: bold;
            color: #4ade80;
            text-align: center;
            margin: 30px 0;
        }
        
        .contract-details {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            padding: 10px 0;
            border-bottom: 2px solid #4ade80;
        }
        
        .contract-details div {
            font-weight: bold;
        }
        
        .section {
            margin: 30px 0;
        }
        
        .section-title {
            font-size: 24px;
            font-weight: bold;
            color: #8b5a3c;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        
        .parties-section {
            margin: 20px 0;
        }
        
        .party {
            margin: 20px 0;
        }
        
        .party-title {
            font-size: 14px;
            font-weight: bold;
            color: #8b5a3c;
            margin-bottom: 10px;
        }
        
        .party-details {
            margin-left: 20px;
        }
        
        .party-details div {
            margin: 5px 0;
        }
        
        .party-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
        }
        
        .content {
            padding: 0 40px;
        }
        
        .scope-list {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .scope-list li {
            margin: 5px 0;
        }
        
        .payment-terms {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
        }
        
        .payment-item {
            font-weight: bold;
        }
        
        .deadlines {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
        }
        
        .deadline-item {
            font-weight: bold;
        }
        
        .responsibilities ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .responsibilities li {
            margin: 5px 0;
        }
        
        .signature-section {
            margin-top: 50px;
            text-align: center;
        }
        
        .signature-text {
            margin: 20px 0;
            font-style: italic;
        }
        
        .signatures {
            display: flex;
            justify-content: space-between;
            margin: 40px 0;
        }
        
        .signature-block {
            text-align: center;
            width: 45%;
        }
        
        .signature-title {
            font-weight: bold;
            margin-bottom: 20px;
        }
        
        .signature-line {
            font-family: 'Dancing Script', cursive;
            font-size: 24px;
            font-weight: 400;
            border-bottom: 2px solid #333;
            padding: 10px 0;
            margin: 10px 0;
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .signature-name {
            font-weight: bold;
            margin-top: 10px;
        }
        
        .signature-date {
            margin-top: 20px;
            font-weight: bold;
        }
        
        .disclaimer {
            margin-top: 40px;
            padding: 20px;
            background: #f9f9f9;
            border-left: 4px solid #4ade80;
            font-size: 10px;
            font-style: italic;
        }
        
        .disclaimer-title {
            font-weight: bold;
            color: #4ade80;
            margin-bottom: 10px;
        }
        
        .page-number {
            position: fixed;
            bottom: 20px;
            right: 40px;
            font-size: 10px;
            color: #666;
        }
        
        .footer-bar {
            background: #4ade80;
            height: 10px;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
        }
        
        .break-page {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <div class="header-content">
                <div class="logo-section">
                    <div>
                        <strong>WorkWise</strong><br>
                        <small>Gig Worker Platform</small>
                    </div>
                    <div class="company-info">
                        bitboss@workwise.com<br>
                        (123) 234-5678
                    </div>
                </div>
            </div>
        </div>

        <div class="content">
            <!-- Contract Title -->
            <div class="contract-title">WorkWise Contract</div>

            <!-- Contract Details -->
            <div class="contract-details">
                <div>
                    <strong>Contract ID:</strong> {{ $contract->contract_id }}
                </div>
                <div>
                    <strong>Date:</strong> {{ $contract->created_at->format('F j, Y') }}
                </div>
            </div>

            <!-- Parties Involved -->
            <div class="section">
                <div class="section-title">Parties Involved:</div>
                
                <div class="party">
                    <div class="party-title">EMPLOYER</div>
                    <div class="party-details">
                        <div><span class="party-label">Name:</span> {{ $employer->first_name }} {{ $employer->last_name }}</div>
                        <div><span class="party-label">Email:</span> {{ $employer->email }}</div>
                        <div><span class="party-label">Phone Number:</span> {{ $employer->phone ?? 'Not provided' }}</div>
                        <div><span class="party-label">Location:</span> {{ $employer->location ?? $employer->barangay ?? 'Not provided' }}</div>
                    </div>
                </div>

                <div class="party">
                    <div class="party-title">GIG WORKER</div>
                    <div class="party-details">
                        <div><span class="party-label">Name:</span> {{ $gigWorker->first_name }} {{ $gigWorker->last_name }}</div>
                        <div><span class="party-label">Email:</span> {{ $gigWorker->email }}</div>
                        <div><span class="party-label">Phone Number:</span> {{ $gigWorker->phone ?? 'Not provided' }}</div>
                        <div><span class="party-label">Location:</span> {{ $gigWorker->location ?? $gigWorker->barangay ?? 'Not provided' }}</div>
                    </div>
                </div>

                <p style="margin-top: 20px;">
                    The contract will commence on {{ \Carbon\Carbon::parse($contract->project_start_date)->format('F j, Y') }}, 
                    and will continue until terminated in accordance with the terms of this Agreement.
                </p>
            </div>

            <!-- Page break for page 2 -->
            <div class="break-page"></div>

            <!-- Scope of Work -->
            <!-- <div class="section">
                <div class="section-title">Scope of Work</div>
                <div style="white-space: pre-line;">{{ $contract->scope_of_work }}</div>
            </div> -->
            <div class="section">
                <div class="section-title">Scope of Work</div>
                <div style="white-space: pre-line; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">
                    {{ $contract->scope_of_work }}
                </div>
            </div>


            <!-- Payment Terms -->
            <div class="section">
                <div class="section-title">Payment Terms</div>
                <div class="payment-terms">
                    <div class="payment-item">
                        <strong>Contract Type:</strong> {{ $contract->contract_type }}
                    </div>
                    <div class="payment-item">
                        <strong>Total Payment:</strong> ₱{{ number_format($contract->total_payment, 2) }}
                    </div>
                </div>
            </div>

            <!-- Deadlines -->
            <div class="section">
                <div class="section-title">Deadlines</div>
                <div class="deadlines">
                    <div class="deadline-item">
                        <strong>Project Start Date:</strong> {{ \Carbon\Carbon::parse($contract->project_start_date)->format('F j, Y') }}
                    </div>
                    <div class="deadline-item">
                        <strong>Project End Date:</strong> {{ \Carbon\Carbon::parse($contract->project_end_date)->format('F j, Y') }}
                    </div>
                </div>
            </div>

            <!-- Employer Responsibilities -->
            <div class="section">
                <div class="section-title">Employer Responsibilities</div>
                <div class="responsibilities">
                    <ul>
                        @foreach($contract->employer_responsibilities ?? [] as $responsibility)
                            <li>{{ $responsibility }}</li>
                        @endforeach
                    </ul>
                </div>
            </div>

            <!-- Page break for page 3 -->
            <div class="break-page"></div>

            <!-- Gig Worker Responsibilities -->
            <div class="section">
                <div class="section-title">Gig Worker Responsibilities</div>
                <div class="responsibilities">
                    <ul>
                        @foreach($contract->gig_worker_responsibilities ?? [] as $responsibility)
                            <li>{{ $responsibility }}</li>
                        @endforeach
                    </ul>
                </div>
            </div>

            <!-- Communication -->
            <div class="section">
                <div class="section-title">Communication</div>
                <div style="margin: 15px 0;">
                    <div><strong>Preferred Method:</strong> {{ $contract->preferred_communication }}</div>
                    <div style="margin-top: 10px;"><strong>Frequency:</strong> {{ $contract->communication_frequency }}</div>
                </div>
            </div>

            <!-- Dispute Resolution -->
            <div class="section">
                <div class="section-title">Dispute Resolution</div>
                <p>In the event of a dispute, both parties agree to resolve the issue through WorkWise's mediation and arbitration services.</p>
            </div>

            <!-- Additional Terms -->
            <div class="section">
                <div class="section-title">Additional Terms</div>
                <ul>
                    <li>All work produced under this contract will be the property of the employer upon final payment.</li>
                    <li>The gig worker agrees to maintain confidentiality and not disclose any project details without the employer's consent.</li>
                </ul>
            </div>

            <!-- Page break for signature page -->
            <div class="break-page"></div>

            <!-- Signature Section -->
            <div class="signature-section">
                <div class="signature-text">
                    <strong>[SIGNATURE PAGE FOLLOWS]</strong>
                </div>

                <p style="margin: 20px 0;">
                    <strong>IN WITNESS WHEREOF,</strong> the parties have executed this WorkWise Contract as of the date first above written.
                </p>

                <div class="signatures">
                    <div class="signature-block">
                        <div class="signature-title">Gig Worker</div>
                        <div class="signature-line">
                            @if($gigWorkerSignature)
                                {{ $gigWorkerSignature->full_name }}
                            @endif
                        </div>
                        <div class="signature-name">{{ $gigWorker->first_name }} {{ $gigWorker->last_name }}</div>
                        @if($gigWorkerSignature)
                            <div class="signature-date">Date: {{ $gigWorkerSignature->signed_at->format('F j, Y') }}</div>
                        @endif
                    </div>

                    <div class="signature-block">
                        <div class="signature-title">Employer</div>
                        <div class="signature-line">
                            @if($employerSignature)
                                {{ $employerSignature->full_name }}
                            @endif
                        </div>
                        <div class="signature-name">{{ $employer->first_name }} {{ $employer->last_name }}</div>
                        @if($employerSignature)
                            <div class="signature-date">Date: {{ $employerSignature->signed_at->format('F j, Y') }}</div>
                        @endif
                    </div>
                </div>

                @if($isFullySigned)
                    <div style="text-align: center; margin-top: 30px;">
                        <strong>Contract Date: {{ $contract->fully_signed_at->format('F j, Y') }}</strong>
                    </div>
                @endif
            </div>

            <!-- Disclaimer -->
            <div class="disclaimer">
                <div class="disclaimer-title">Disclaimer</div>
                <p>
                    "Parties are advised to consult a legal professional to ensure compliance with local laws. 
                    This template serves as a general guide and may not cover all legal requirements."
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer-bar"></div>
        <div class="page-number">{{ $loop->iteration ?? 1 }}</div>
    </div>
</body>
</html>
