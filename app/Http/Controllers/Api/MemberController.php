<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HandlesCachedCrud;
use App\Http\Controllers\Controller;
use App\Http\Resources\MemberResource;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberController extends Controller
{
    use HandlesCachedCrud;

    private function rules(): array
    {
        return [
            'full_name' => ['required'],
            'christian_name' => ['nullable'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'string', 'max:20'],
            'emergency_contact_name' => ['nullable'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
            'phone_number' => ['nullable', 'string', 'max:50'],
            'membership_date' => ['nullable', 'date'],
            'sol_father_name' => ['nullable'],
            'class_id' => ['required', 'exists:classes,id'],
            'section' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function index()
    {
        $this->authorize('viewAny', Member::class);

        $query = Member::with('schoolClass')->latest();
        $search = trim((string) request()->query('search', ''));
        if ($search !== '') {
            $driver = DB::connection()->getDriverName();
            $likeOp = $driver === 'pgsql' ? 'ilike' : 'like';

            $query->where(function ($members) use ($search, $likeOp, $driver) {
                $members->where('full_name->en', $likeOp, "%{$search}%")
                    ->orWhere('full_name->am', $likeOp, "%{$search}%")
                    ->orWhere('christian_name', $likeOp, "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%");

                if ($driver === 'pgsql') {
                    $members->orWhereRaw('full_name::text ilike ?', ["%{$search}%"]);
                } else {
                    $members->orWhereRaw('cast(full_name as text) like ?', ["%{$search}%"]);
                }
            });
        }

        return MemberResource::collection($query->paginate(min(max(request()->integer('per_page', 20), 1), 100)));
    }

    public function store(Request $r)
    {
        return $this->storeCrud($r, Member::class, MemberResource::class, $this->rules(), ['schoolClass'], true);
    }

    public function show(Member $member)
    {
        return $this->showCrud($member, MemberResource::class, ['schoolClass'], true);
    }

    public function update(Request $r, Member $member)
    {
        return $this->updateCrud($r, $member, MemberResource::class, $this->rules(), ['schoolClass'], true);
    }

    public function destroy(Member $member)
    {
        return $this->destroyCrud($member, true);
    }
}
