<?php

namespace App\Http\Controllers\App\Core\Role;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Http\Controllers\Controller;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::with('permissions')
            ->withCount('users')
            ->orderBy('name')
            ->paginate(10);

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
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $role = Role::create(['name' => $request->name]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
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
            'name' => ['required', 'string', 'max:255', 'unique:roles,name,' . $role->id],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,id'],
        ]);

        $role->update(['name' => $request->name]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
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
