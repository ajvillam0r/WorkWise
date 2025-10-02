<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Projects Report - {{ $user->first_name }} {{ $user->last_name }}</title>
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
            color: #3b82f6;
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
            color: #059669;
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
        
        .status-active {
            background-color: #dbeafe;
            color: #1e40af;
        }
        
        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
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
        <div class="report-title">Projects Report</div>
        <div class="report-subtitle">
            {{ $user->first_name }} {{ $user->last_name }} • 
            {{ $period }} • 
            Generated on {{ $generatedAt->format('F j, Y \a\t g:i A') }}
        </div>
    </div>

    <div class="summary-section">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-label">Total Projects</div>
                <div class="summary-value">{{ $totalProjects }}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Completed</div>
                <div class="summary-value">{{ $completedProjects }}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Active</div>
                <div class="summary-value">{{ $activeProjects }}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Value</div>
                <div class="summary-value">₱{{ number_format($totalValue, 2) }}</div>
            </div>
        </div>
    </div>

    <div class="table-container">
        <div class="section-title">Project Details</div>
        
        @if($data->isNotEmpty())
            <table>
                <thead>
                    <tr>
                        <th>Project</th>
                        <th>{{ $userRole === 'gig_worker' ? 'Employer' : 'Gig Worker' }}</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Started</th>
                        <th>Completed</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data as $project)
                        <tr>
                            <td>{{ $project['Project'] }}</td>
                            <td>{{ $userRole === 'gig_worker' ? $project['Employer'] : $project['Gig Worker'] }}</td>
                            <td class="amount">₱{{ number_format($project['Amount'], 2) }}</td>
                            <td>
                                <span class="status status-{{ strtolower($project['Status']) }}">
                                    {{ $project['Status'] }}
                                </span>
                            </td>
                            <td>{{ $project['Started'] ?: '-' }}</td>
                            <td>{{ $project['Completed'] ?: '-' }}</td>
                            <td>{{ $project['Created'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p style="text-align: center; color: #666; font-style: italic; padding: 20px;">
                No project data found for the selected period.
            </p>
        @endif
    </div>

    <div class="footer">
        <p>This report was generated by WorkWise Analytics on {{ $generatedAt->format('F j, Y \a\t g:i A') }}</p>
        <p>© {{ date('Y') }} WorkWise. All rights reserved.</p>
    </div>
</body>
</html>
