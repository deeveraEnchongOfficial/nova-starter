<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Drops the redundant unique index on the sessions "id" field.
 *
 * The MongoDB session driver stores the session ID in "_id", not "id".
 * The original migration (0001_01_01_000000) creates a unique index on
 * "id" via $table->string('id')->primary(), which means every session
 * document has id: null and the unique index only allows one — causing
 * "E11000 duplicate key error" on the second request.
 */
return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('primary')->getDatabase()->selectCollection('sessions');

        foreach ($collection->listIndexes() as $index) {
            if (($index['name'] ?? null) === 'id_1') {
                $collection->dropIndex('id_1');
                break;
            }
        }
    }

    public function down(): void
    {
        // No-op: the index is intentionally dropped because it breaks
        // the MongoDB session driver. Re-creating it would reintroduce
        // the duplicate-key bug.
    }
};
