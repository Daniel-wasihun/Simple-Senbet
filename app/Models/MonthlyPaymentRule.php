<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MonthlyPaymentRule extends Model
{
    use HasTranslations;

    protected $table = 'monthly_payment_rules';

    protected array $translatable = [
        'name',
    ];

    protected $fillable = [
        'name',
        'amount',
        'minimum_age',
        'minimum_class_id',
        'class_id',
        'effective_from',
        'effective_to',
        'is_active',
        'allow_credit_carry_forward',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'amount' => 'decimal:2',
            'minimum_age' => 'integer',
            'minimum_class_id' => 'integer',
            'class_id' => 'integer',
            'effective_from' => 'date',
            'effective_to' => 'date',
            'is_active' => 'boolean',
            'allow_credit_carry_forward' => 'boolean',
            'created_by' => 'integer',
        ];
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function minimumSchoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'minimum_class_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(MemberPayment::class, 'payment_rule_id');
    }
}
