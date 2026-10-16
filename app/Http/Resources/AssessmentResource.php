<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class AssessmentResource extends BaseJsonResource
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
            'teaching_assignment_id' => $this->teaching_assignment_id,
            'name' => $this->name,
            'total_score' => $this->total_score,
            'weight_percentage' => $this->weight_percentage,
            'teaching_assignment' => new TeachingAssignmentResource($this->whenLoaded('teachingAssignment')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ]);
    }
}
