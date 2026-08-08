<?php

namespace App\Http\Controllers\RestApi;

use App\Http\Controllers\Controller;
use App\Services\Core\User\UserRepository;
use Illuminate\Http\Request;

class ShareableUserController extends Controller
{
    public function __construct(
        private readonly UserRepository $userRepository,
    ) {}

    /**
     * List users that the current user can share resources with.
     * Excludes the current user.
     */
    public function __invoke(Request $request)
    {
        $users = $this->userRepository->findAll()
            ->filter(fn ($user) => $user->getKey() !== $request->user()->getKey())
            ->map(fn ($user) => [
                'id' => $user->getKey(),
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->values();

        return response()->json(['users' => $users]);
    }
}
