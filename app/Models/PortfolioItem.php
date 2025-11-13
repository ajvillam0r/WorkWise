<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioItem extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'project_url',
        'images',
        'document_file',
        'tags',
        'completion_date',
        'project_type',
        'display_order',
    ];

    protected $casts = [
        'images' => 'array',
        'tags' => 'array',
        'completion_date' => 'date',
        'display_order' => 'integer',
    ];

    /**
     * Get the user that owns the portfolio item
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
