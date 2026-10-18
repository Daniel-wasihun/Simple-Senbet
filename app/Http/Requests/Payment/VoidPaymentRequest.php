<?php

namespace App\Http\Requests\Payment;

use App\Http\Requests\BaseRequest;

class VoidPaymentRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'min:3', 'max:255'],
        ];
    }
}
