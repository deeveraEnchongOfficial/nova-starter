<?php

namespace App\Http\Controllers\App\Core\Role;

use App\Http\Controllers\Controller;
use App\Services\Core\Role\Permission;
use App\Services\Core\Role\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::with('permissions')
            ->orderBy('name')
            ->paginate(10);

        $roles->getCollection()->each(function ($role) {
            $role->users_count = $role->users()->count();
        });

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
        ]);
    }

    public function create()
    {
        $permissions = Permission::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Roles/Create', [
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('core.roles', 'name')],
            'permissions' => ['array'],
            'permissions.*' => [Rule::exists('core.permissions', '_id')],
        ]);

        $role = Role::create(['name' => $request->name]);

        if ($request->has('permissions')) {
            $permissionModels = Permission::whereIn('_id', $request->permissions)->get();
            $role->syncPermissions($permissionModels);
        }

        return redirect()->route('roles.index')
            ->with('message', 'Role created successfully.');
    }

    public function edit(Role $role)
    {
        $permissions = Permission::orderBy('name')->get(['id', 'name']);
        $role->load('permissions');

        return Inertia::render('Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('core.roles', 'name')->ignore($role->id)],
            'permissions' => ['array'],
            'permissions.*' => [Rule::exists('core.permissions', '_id')],
        ]);

        $role->update(['name' => $request->name]);

        if ($request->has('permissions')) {
            $permissionModels = Permission::whereIn('_id', $request->permissions)->get();
            $role->syncPermissions($permissionModels);
        }

        return redirect()->route('roles.index')
            ->with('message', 'Role updated successfully.');
    }

    public function destroy(Role $role)
    {
        if ($role->name === 'Super Admin') {
            return redirect()->route('roles.index')
                ->with('error', 'Cannot delete the Super Admin role.');
        }

        $role->delete();

        return redirect()->route('roles.index')
            ->with('message', 'Role deleted successfully.');
    }
}
