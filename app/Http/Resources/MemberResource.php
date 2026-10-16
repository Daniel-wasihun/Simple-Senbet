<?php
namespace App\Http\Resources;
use Illuminate\Http\Request; use Illuminate\Http\Resources\Json\JsonResource;
class MemberResource extends JsonResource { public function toArray(Request $request): array { return ['id'=>$this->id,'full_name'=>$this->full_name,'christian_name'=>$this->christian_name,'date_of_birth'=>$this->date_of_birth,'gender'=>$this->gender,'emergency_contact_name'=>$this->emergency_contact_name,'emergency_contact_phone'=>$this->emergency_contact_phone,'phone_number'=>$this->phone_number,'membership_date'=>$this->membership_date,'sol_father_name'=>$this->sol_father_name,'class_id'=>$this->class_id,'section'=>$this->section,'school_class'=>SchoolClassResource::make($this->whenLoaded('schoolClass')),'created_at'=>$this->created_at,'updated_at'=>$this->updated_at]; } }
