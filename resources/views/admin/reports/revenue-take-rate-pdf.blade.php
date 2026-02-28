<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Platform Revenue & Take-Rate Report</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #333; margin: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        .report-title { font-size: 16px; font-weight: bold; }
        .meta { color: #666; font-size: 10px; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
        th { background: #f1f5f9; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 9px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="header">
        <div class="report-title">Platform Revenue & Take-Rate Report</div>
        <div class="meta">Generated: {{ now()->format('Y-m-d H:i:s') }}</div>
        @if($dateFrom || $dateTo)
            <div class="meta">Period: {{ $dateFrom ?? '—' }} to {{ $dateTo ?? '—' }}</div>
        @endif
    </div>
    <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Platform Revenue</td><td>{{ number_format($data['platform_revenue'], 2) }}</td></tr>
        <tr><td>Total Transaction Volume</td><td>{{ number_format($data['total_volume'], 2) }}</td></tr>
        <tr><td>Take Rate (%)</td><td>{{ number_format($data['take_rate_percent'], 2) }}%</td></tr>
    </table>
    <div class="footer">WorkWise Admin — Mandatory Transaction Report</div>
</body>
</html>
