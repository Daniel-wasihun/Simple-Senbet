<?php

namespace App\Http\Requests\Payment;

use App\Http\Requests\BaseRequest;
use App\Models\MemberPayment;

class StorePaymentRuleRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageRules', MemberPayment::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => $this->translatable(required: true, max: 100),
            'amount' => ['required', 'numeric', 'min:0.01'],
            'minimum_age' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:120'],
            'minimum_class_id' => ['sometimes', 'nullable', 'integer', 'exists:classes,id'],
            'class_id' => ['sometimes', 'nullable', 'integer', 'exists:classes,id'],
            'target_class_id' => ['sometimes', 'nullable', 'integer', 'exists:classes,id'],
            'effective_from' => ['required', 'date'],
            'effective_to' => ['sometimes', 'nullable', 'date', 'after_or_equal:effective_from'],
            'is_active' => ['sometimes', 'boolean'],
            'allow_credit_carry_forward' => ['sometimes', 'boolean'],
            'carry_forward_credit' => ['sometimes', 'boolean'],
        ];
    }
}
