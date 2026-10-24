<?php

namespace App\Http\Requests\Payment;

use App\Http\Requests\BaseRequest;
use App\Models\MemberPayment;

class VoidPaymentRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('void', MemberPayment::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'min:3', 'max:255'],
        ];
    }
}
