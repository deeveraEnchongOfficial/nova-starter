<?php

namespace App\Http\Controllers\App\Core\User;

use App\Http\Controllers\Controller;
use App\Services\Core\Role\Role;
use App\Services\Core\User\Actions\UpsertUser;
use App\Services\Core\User\User;
use App\Services\Core\User\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(
        private readonly UpsertUser $upsertUser,
        private readonly UserRepository $userRepository,
    ) {}

    public function index(Request $request)
    {
        $users = $this->userRepository->paginateAll(
            search: $request->search,
            perPage: 10,
            with: ['roles'],
        );

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $roles = Role::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Users/Create', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('core.users')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'roles' => ['array'],
            'roles.*' => [Rule::exists('core.roles', '_id')],
        ]);

        $user = $this->upsertUser->execute(
            new User,
            $validated['first_name'],
            $validated['middle_name'],
            $validated['last_name'],
            $validated['email'],
            tenant: null,
            password: $validated['password'],
            createdBy: $request->user(),
        );

        if (! empty($validated['roles'])) {
            $roleModels = Role::whereIn('_id', $validated['roles'])->get();
            $user->assignRole($roleModels);
        }

        return redirect()->route('users.index')
            ->with('message', 'User created successfully.');
    }

    public function edit(User $user)
    {
        $roles = Role::orderBy('name')->get(['id', 'name']);
        $user->load('roles');

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('core.users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'roles' => ['array'],
            'roles.*' => [Rule::exists('core.roles', '_id')],
        ]);

        $this->upsertUser->execute(
            $user,
            $validated['first_name'],
            $validated['middle_name'],
            $validated['last_name'],
            $validated['email'],
            password: $validated['password'] ?? null,
        );

        if (! empty($validated['roles'])) {
            $roleModels = Role::whereIn('_id', $validated['roles'])->get();
            $user->syncRoles($roleModels);
        }

        return redirect()->route('users.index')
            ->with('message', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('users.index')
            ->with('message', 'User deleted successfully.');
    }
}
