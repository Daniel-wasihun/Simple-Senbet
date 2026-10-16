<?php
namespace App\Http\Resources;
use Illuminate\Http\Request; use Illuminate\Http\Resources\Json\JsonResource;
class SchoolClassResource extends JsonResource { public function toArray(Request $request): array { return ['id'=>$this->id,'name'=>$this->name,'code'=>$this->code,'number_of_sections'=>$this->number_of_sections,'passing_score'=>$this->passing_score,'created_at'=>$this->created_at,'updated_at'=>$this->updated_at]; } }
