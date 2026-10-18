<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class SchoolClassResource extends BaseJsonResource
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
            'name' => $this->name,
            'code' => $this->code,
            'number_of_sections' => $this->number_of_sections,
            'passing_score' => $this->passing_score,
            'next_class_id' => $this->next_class_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ]);
    }
}
