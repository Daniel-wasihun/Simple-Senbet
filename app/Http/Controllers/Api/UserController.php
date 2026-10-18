<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(protected UserService $userService) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        return response()->json(['users' => $this->userService->paginate()]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);
        $user = $this->userService->create($request->validated());

        return response()->json([
            'message' => __('auth.user_created'),
            'user' => $this->userData($user),
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);
        $cachedUser = $this->userService->find($user);

        return response()->json(['user' => $this->userData($cachedUser)]);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);
        $updatedUser = $this->userService->update($user, $request->validated());

        return response()->json([
            'message' => __('auth.user_updated'),
            'user' => $this->userData($updatedUser),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        if ($request->user()?->is($user)) {
            return response()->json(['message' => __('auth.cannot_delete_self')], 422);
        }

        $this->userService->delete($user);

        return response()->json(['message' => __('auth.user_deleted')]);
    }

    protected function userData(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->getRoleNames()->first() ?? 'student',
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
