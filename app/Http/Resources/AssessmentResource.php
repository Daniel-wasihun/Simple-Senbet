<?php
namespace App\Http\Resources;
use Illuminate\Http\Request; use Illuminate\Http\Resources\Json\JsonResource;
class AssessmentResource extends JsonResource { public function toArray(Request $request): array { return ['id'=>$this->id,'teaching_assignment_id'=>$this->teaching_assignment_id,'name'=>$this->name,'total_score'=>$this->total_score,'weight_percentage'=>$this->weight_percentage,'created_at'=>$this->created_at,'updated_at'=>$this->updated_at]; } }
