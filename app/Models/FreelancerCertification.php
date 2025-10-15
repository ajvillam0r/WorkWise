<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class FreelancerCertification extends Model
{
    use HasFactory;

    protected $fillable = [
        'freelancer_id',
        'name',
        'issuing_organization',
        'description',
        'issue_date',
        'expiration_date',
        'does_not_expire',
        'credential_id',
        'credential_url',
        'skills_validated',
        'certificate_file',
        'is_verified',
        'display_order',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'expiration_date' => 'date',
        'does_not_expire' => 'boolean',
        'skills_validated' => 'array',
        'is_verified' => 'boolean',
        'display_order' => 'integer',
    ];

    /**
     * Get the freelancer that owns this certification.
     */
    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(Freelancer::class);
    }

    /**
     * Check if the certification is expired.
     */
    public function getIsExpiredAttribute(): bool
    {
        if ($this->does_not_expire || !$this->expiration_date) {
            return false;
        }
        
        return $this->expiration_date->isPast();
    }

    /**
     * Check if the certification is expiring soon (within 30 days).
     */
    public function getIsExpiringSoonAttribute(): bool
    {
        if ($this->does_not_expire || !$this->expiration_date || $this->is_expired) {
            return false;
        }
        
        return $this->expiration_date->diffInDays(now()) <= 30;
    }

    /**
     * Get the status of the certification.
     */
    public function getStatusAttribute(): string
    {
        if ($this->is_expired) {
            return 'expired';
        } elseif ($this->is_expiring_soon) {
            return 'expiring_soon';
        } elseif ($this->is_verified) {
            return 'verified';
        } else {
            return 'pending_verification';
        }
    }

    /**
     * Get formatted expiration info.
     */
    public function getExpirationInfoAttribute(): string
    {
        if ($this->does_not_expire) {
            return 'No expiration date';
        }
        
        if (!$this->expiration_date) {
            return 'Expiration date not specified';
        }
        
        if ($this->is_expired) {
            return 'Expired on ' . $this->expiration_date->format('M j, Y');
        }
        
        if ($this->is_expiring_soon) {
            $days = $this->expiration_date->diffInDays(now());
            return "Expires in {$days} day" . ($days > 1 ? 's' : '') . ' (' . $this->expiration_date->format('M j, Y') . ')';
        }
        
        return 'Expires on ' . $this->expiration_date->format('M j, Y');
    }

    /**
     * Get the certificate file URL.
     */
    public function getCertificateUrlAttribute(): ?string
    {
        return $this->certificate_file ? asset('storage/' . $this->certificate_file) : null;
    }

    /**
     * Scope to get verified certifications.
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope to get active (non-expired) certifications.
     */
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->where('does_not_expire', true)
              ->orWhere('expiration_date', '>', now())
              ->orWhereNull('expiration_date');
        });
    }

    /**
     * Scope to get expired certifications.
     */
    public function scopeExpired($query)
    {
        return $query->where('does_not_expire', false)
                    ->where('expiration_date', '<=', now());
    }

    /**
     * Scope to get certifications expiring soon.
     */
    public function scopeExpiringSoon($query)
    {
        return $query->where('does_not_expire', false)
                    ->where('expiration_date', '>', now())
                    ->where('expiration_date', '<=', now()->addDays(30));
    }

    /**
     * Scope to order by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('issue_date', 'desc');
    }

    /**
     * Scope to filter by issuing organization.
     */
    public function scopeByOrganization($query, $organization)
    {
        return $query->where('issuing_organization', 'like', "%{$organization}%");
    }
}
