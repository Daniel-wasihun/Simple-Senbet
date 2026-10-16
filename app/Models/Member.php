<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use HasTranslations, SoftDeletes;

    /**
     * Translatable attributes stored as JSON.
     *
     * @var list<string>
     */
    protected array $translatable = [
        'full_name',
        'christian_name',
        'emergency_contact_name',
        'sol_father_name',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'full_name',
        'christian_name',
        'date_of_birth',
        'gender',
        'emergency_contact_name',
        'emergency_contact_phone',
        'phone_number',
        'membership_date',
        'sol_father_name',
        'class_id',
        'section',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'full_name' => 'array',
            'christian_name' => 'array',
            'emergency_contact_name' => 'array',
            'sol_father_name' => 'array',
            'date_of_birth' => 'date',
            'membership_date' => 'date',
            'class_id' => 'integer',
        ];
    }

    /**
     * Get the class to which this member belongs.
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * Get the assessment results recorded for this member.
     */
    public function assessmentResults(): HasMany
    {
        return $this->hasMany(AssessmentResult::class, 'member_id');
    }
}
