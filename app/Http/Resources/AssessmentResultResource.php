<?php
namespace App\Http\Resources;
use Illuminate\Http\Request; use Illuminate\Http\Resources\Json\JsonResource;
class AssessmentResultResource extends JsonResource { public function toArray(Request $request): array { return ['id'=>$this->id,'assessment_id'=>$this->assessment_id,'member_id'=>$this->member_id,'score'=>$this->score,'assessment'=>AssessmentResource::make($this->whenLoaded('assessment')),'member'=>MemberResource::make($this->whenLoaded('member')),'created_at'=>$this->created_at,'updated_at'=>$this->updated_at]; } }
