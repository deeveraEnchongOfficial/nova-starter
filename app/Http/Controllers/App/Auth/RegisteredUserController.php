<?php

namespace App\Http\Controllers\App\Auth;

use App\Http\Controllers\Controller;
use App\Services\Core\Organization\Actions\UpsertOrganization;
use App\Services\Core\Organization\Organization;
use App\Services\Core\Organization\OrganizationStatus;
use App\Services\Core\Role\Actions\UpsertRole;
use App\Services\Core\Role\Permission;
use App\Services\Core\Role\Role;
use App\Services\Core\User\Actions\UpsertUser;
use App\Services\Core\User\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(
        private readonly UpsertUser $upsertUser,
        private readonly UpsertOrganization $upsertOrganization,
        private readonly UpsertRole $upsertRole,
    ) {}

    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $isMultiTenant = config('features.multi_tenant', false);

        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ...$isMultiTenant ? [
                'organization_name' => 'required|string|max:255',
            ] : [],
        ]);

        $userData = [
            'first_name' => $request->first_name,
            'middle_name' => $request->middle_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ];

        $organization = null;

        if ($isMultiTenant) {
            $organization = $this->upsertOrganization->execute(
                new Organization,
                $request->organization_name,
                OrganizationStatus::ACTIVE->value,
                true,
            );
        }

        $user = $this->upsertUser->execute(
            new User,
            $userData['first_name'],
            $userData['middle_name'],
            $userData['last_name'],
            $userData['email'],
            tenant: $isMultiTenant ? $organization : null,
            password: $userData['password'],
        );

        $roleModel = Role::where('name', $request->role)->first() ?? new Role;
        $permissions = $roleModel->permissions()->count() === 0 ? Permission::all()->all() : [];

        $role = $this->upsertRole->execute(
            $roleModel,
            $request->role,
            tenant: $isMultiTenant ? $organization : null,
            permissions: $permissions,
        );
        $user->assignRole($role);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
