<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentAuditLog extends Model
{
    protected $table = 'payment_audit_logs';

    protected $fillable = [
        'member_payment_id',
        'action',
        'previous_payload',
        'new_payload',
        'reason',
        'performed_by',
    ];

    protected function casts(): array
    {
        return [
            'member_payment_id' => 'integer',
            'previous_payload' => 'array',
            'new_payload' => 'array',
            'performed_by' => 'integer',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(MemberPayment::class, 'member_payment_id');
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
