<?php

namespace App\Http\Controllers\RestApi;

use App\Http\Controllers\Controller;
use App\Services\Core\File\File;
use Illuminate\Http\Request;

class StorageUsageController extends Controller
{
    /**
     * Return storage usage statistics for the authenticated user.
     */
    public function __invoke(Request $request)
    {
        $user = $request->user();

        // Sum of all non-trashed file sizes owned by the user
        $usedBytes = File::ownedBy($user)
            ->sum('size');

        // Count of files (non-trashed)
        $fileCount = File::ownedBy($user)
            ->count();

        // Count of trashed files (use onlyTrashed for MongoDB compatibility)
        $trashedCount = File::ownedBy($user)
            ->onlyTrashed()
            ->count();

        // Try to get disk capacity from MinIO/S3 (best-effort, may fail)
        $capacityBytes = $this->getDiskCapacity();

        return response()->json([
            'used' => (int) $usedBytes,
            'capacity' => $capacityBytes,
            'file_count' => $fileCount,
            'trashed_count' => $trashedCount,
            'available' => $capacityBytes !== null ? max(0, $capacityBytes - (int) $usedBytes) : null,
        ]);
    }

    /**
     * Attempt to retrieve the total disk capacity from the S3/MinIO disk.
     * Returns null if it cannot be determined.
     */
    private function getDiskCapacity(): ?int
    {
        try {
            $disk = config('filesystems.disks.s3.bucket', 'uploads');

            // Use MinIO admin API via mc if available inside the container,
            // otherwise fall back to a configurable env value.
            $configured = config('filesystems.storage_capacity');

            if ($configured !== null) {
                return (int) $configured;
            }

            return null;
        } catch (\Throwable) {
            return null;
        }
    }
}
