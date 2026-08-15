<?php

namespace App\Http\Controllers\App\Core\Activity;

use App\Http\Controllers\Controller;
use App\Services\Core\Activity\Activity;
use App\Services\Core\Activity\ActivityLogType;
use App\Services\Core\Activity\ActivityRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function __construct(
        private readonly ActivityRepository $activityRepository,
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'per_page', 'type', 'created_by_id', 'subject_type']);

        $activities = $this->activityRepository->paginateAll(
            search: $request->search,
            perPage: (int) $request->get('per_page', 10),
            filters: $filters,
        );

        return Inertia::render('ActivityLogs/Index', [
            'activities' => $activities,
            'filters' => $filters,
            'types' => collect(ActivityLogType::cases())->map(fn ($type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ])->values(),
        ]);
    }

    public function show(Activity $activity)
    {
        // Verify the activity belongs to the authenticated user's tenant
        if (config('features.multi_tenant', false) && $activity->tenant_id !== null) {
            $user = request()->user();
            if (! $user || $activity->tenant_id !== $user->tenant_id || $activity->tenant_type !== $user->tenant_type) {
                abort(404);
            }
        }

        $activity->load(['createdBy', 'subject']);

        return Inertia::render('ActivityLogs/Show', [
            'activity' => $activity,
        ]);
    }

    public function clear(): RedirectResponse
    {
        $this->activityRepository->clearAll();

        return redirect()->route('activity-logs.index')
            ->with('status', 'Activity logs have been cleared.');
    }
}
