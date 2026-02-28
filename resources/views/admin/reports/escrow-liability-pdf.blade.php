<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Escrow Liability Report</title>
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
        <div class="report-title">Escrow Liability Report</div>
        <div class="meta">Generated: {{ now()->format('Y-m-d H:i:s') }}</div>
        @if($dateFrom || $dateTo)
            <div class="meta">Period: {{ $dateFrom ?? '—' }} to {{ $dateTo ?? '—' }}</div>
        @endif
    </div>
    <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Escrow Total</td><td>{{ number_format($data['escrow_total'], 2) }}</td></tr>
        <tr><td>Released Total</td><td>{{ number_format($data['released_total'], 2) }}</td></tr>
        <tr><td>Refunded Total</td><td>{{ number_format($data['refunded_total'], 2) }}</td></tr>
        <tr><td>Escrow Liability (Locked)</td><td>{{ number_format($data['escrow_liability'], 2) }}</td></tr>
    </table>
    <div class="footer">WorkWise Admin — Client funds currently held in escrow</div>
</body>
</html>
