<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MemberPayment extends Model
{
    protected $table = 'member_payments';

    protected $fillable = [
        'member_id',
        'payment_rule_id',
        'payment_month',
        'expected_amount',
        'paid_amount',
        'remaining_balance',
        'payment_status',
        'payment_date',
        'payment_method',
        'reference_number',
        'notes',
        'idempotency_key',
        'recorded_by',
        'is_void',
        'void_reason',
        'voided_at',
        'voided_by',
    ];

    protected function casts(): array
    {
        return [
            'member_id' => 'integer',
            'payment_rule_id' => 'integer',
            'expected_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'remaining_balance' => 'decimal:2',
            'payment_date' => 'date',
            'recorded_by' => 'integer',
            'is_void' => 'boolean',
            'voided_at' => 'datetime',
            'voided_by' => 'integer',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'member_id');
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(MonthlyPaymentRule::class, 'payment_rule_id');
    }

    public function recordedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function voidedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(PaymentAuditLog::class, 'member_payment_id');
    }
}
