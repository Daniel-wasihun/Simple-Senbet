<?php

namespace App\Http\Requests\Payment;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class RecordPaymentRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'member_id' => ['required', 'integer', 'exists:members,id'],
            'payment_month' => ['required', 'string', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['sometimes', 'nullable', 'date'],
            'payment_method' => ['sometimes', 'string', Rule::in(['CASH', 'BANK_TRANSFER', 'TELEBIRR', 'CBE_BIRR'])],
            'reference_number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:500'],
            'idempotency_key' => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }
}
