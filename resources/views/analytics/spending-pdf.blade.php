<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Spending Report - {{ $user->first_name }} {{ $user->last_name }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        
        .report-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .report-subtitle {
            color: #666;
            font-size: 14px;
        }
        
        .summary-section {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            border: 1px solid #e2e8f0;
        }
        
        .summary-grid {
            display: table;
            width: 100%;
        }
        
        .summary-item {
            display: table-cell;
            text-align: center;
            padding: 10px;
            vertical-align: top;
        }
        
        .summary-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .summary-value {
            font-size: 16px;
            font-weight: bold;
            color: #dc2626;
        }
        
        .table-container {
            margin-top: 20px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #374151;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        th {
            background-color: #f3f4f6;
            color: #374151;
            font-weight: bold;
            padding: 12px 8px;
            text-align: left;
            border: 1px solid #d1d5db;
            font-size: 11px;
        }
        
        td {
            padding: 10px 8px;
            border: 1px solid #e5e7eb;
            font-size: 11px;
        }
        
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        .amount {
            text-align: right;
            font-weight: bold;
        }
        
        .negative {
            color: #dc2626;
        }
        
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-completed {
            background-color: #d1fae5;
            color: #065f46;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
        }
        
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">WorkWise</div>
        <div class="report-title">Spending Report</div>
        <div class="report-subtitle">
            {{ $user->first_name }} {{ $user->last_name }} • 
            {{ $period }} • 
            Generated on {{ $generatedAt->format('F j, Y \a\t g:i A') }}
        </div>
    </div>

    <div class="summary-section">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-label">Total Spending</div>
                <div class="summary-value">₱{{ number_format($totalSpending, 2) }}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Projects</div>
                <div class="summary-value">{{ $totalProjects }}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Platform Fees</div>
                <div class="summary-value">₱{{ number_format($totalFees, 2) }}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Average per Project</div>
                <div class="summary-value">₱{{ number_format($averageSpending, 2) }}</div>
            </div>
        </div>
    </div>

    <div class="table-container">
        <div class="section-title">Detailed Spending</div>
        
        @if($data->isNotEmpty())
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Project</th>
                        <th>Freelancer</th>
                        <th>Amount</th>
                        <th>Platform Fee</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data as $spending)
                        <tr>
                            <td>{{ $spending['Date'] }}</td>
                            <td>{{ $spending['Project'] }}</td>
                            <td>{{ $spending['Freelancer'] }}</td>
                            <td class="amount negative">₱{{ number_format($spending['Amount'], 2) }}</td>
                            <td class="amount">₱{{ number_format($spending['Platform Fee'], 2) }}</td>
                            <td>
                                <span class="status status-{{ strtolower($spending['Status']) }}">
                                    {{ $spending['Status'] }}
                                </span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p style="text-align: center; color: #666; font-style: italic; padding: 20px;">
                No spending data found for the selected period.
            </p>
        @endif
    </div>

    <div class="footer">
        <p>This report was generated by WorkWise Analytics on {{ $generatedAt->format('F j, Y \a\t g:i A') }}</p>
        <p>© {{ date('Y') }} WorkWise. All rights reserved.</p>
    </div>
</body>
</html>
