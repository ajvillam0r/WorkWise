<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $path = base_path('full_freelance_services_taxonomy.json');
        if (!file_exists($path)) {
            return;
        }

        $taxonomy = json_decode(file_get_contents($path), true);
        if (!is_array($taxonomy) || empty($taxonomy['services'])) {
            return;
        }

        $now = now();
        $existing = DB::table('skills')->pluck('name')->map(fn ($n) => strtolower(trim($n)))->toArray();

        $rows = [];
        foreach ($taxonomy['services'] as $service) {
            foreach ($service['categories'] ?? [] as $category) {
                foreach ($category['skills'] ?? [] as $skillName) {
                    $trimmed = trim($skillName);
                    $lower = strtolower($trimmed);
                    if ($trimmed === '' || in_array($lower, $existing, true)) {
                        // Already exists – update source to taxonomy
                        DB::table('skills')
                            ->whereRaw('LOWER(TRIM(name)) = ?', [$lower])
                            ->where('source', '!=', 'taxonomy')
                            ->update(['source' => 'taxonomy', 'updated_at' => $now]);
                        continue;
                    }
                    $existing[] = $lower;
                    $rows[] = [
                        'name'       => $trimmed,
                        'source'     => 'taxonomy',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }

        if (!empty($rows)) {
            foreach (array_chunk($rows, 100) as $chunk) {
                DB::table('skills')->insert($chunk);
            }
        }
    }

    public function down(): void
    {
        DB::table('skills')->where('source', 'taxonomy')->delete();
    }
};
