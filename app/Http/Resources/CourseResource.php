<?php
namespace App\Http\Resources;
use Illuminate\Http\Request; use Illuminate\Http\Resources\Json\JsonResource;
class CourseResource extends JsonResource { public function toArray(Request $request): array { return ['id'=>$this->id,'name'=>$this->name,'code'=>$this->code,'description'=>$this->description,'credit_hour'=>$this->credit_hour,'class_id'=>$this->class_id,'school_class'=>SchoolClassResource::make($this->whenLoaded('schoolClass')),'created_at'=>$this->created_at,'updated_at'=>$this->updated_at]; } }
