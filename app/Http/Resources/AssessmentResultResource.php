<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class AssessmentResultResource extends BaseJsonResource
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
            'assessment_id' => $this->assessment_id,
            'member_id' => $this->member_id,
            'score' => $this->score,
            'remarks' => $this->remarks,
            'assessment' => new AssessmentResource($this->whenLoaded('assessment')),
            'member' => new MemberResource($this->whenLoaded('member')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ]);
    }
}
