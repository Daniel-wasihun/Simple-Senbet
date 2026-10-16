<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class MemberResource extends BaseJsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return $this->appendLocalized([
            'id' => $this->id,
            'full_name' => $this->full_name,
            'christian_name' => $this->christian_name,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'gender' => $this->gender,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'phone_number' => $this->phone_number,
            'membership_date' => $this->membership_date?->toDateString(),
            'sol_father_name' => $this->sol_father_name,
            'class_id' => $this->class_id,
            'section' => $this->section,
            'school_class' => new SchoolClassResource($this->whenLoaded('schoolClass')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ]);
    }
}
