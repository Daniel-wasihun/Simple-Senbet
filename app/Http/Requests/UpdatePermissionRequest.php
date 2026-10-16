<?php

namespace App\Http\Requests;

class UpdatePermissionRequest extends StorePermissionRequest
{
    public function rules(): array
    {
        return array_replace(parent::rules(), ['name' => ['required', 'string', 'max:100', 'regex:/^[a-z]+(\.[a-z]+)*$/', 'unique:permissions,name,' . $this->route('permission')->id]]);
    }
}
