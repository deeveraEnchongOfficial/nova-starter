<?php

namespace App\Console\Commands\DevOps;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use MongoDB\Database;

class DropAllDatabases extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devops:drop-all-databases
    {--force : Skip the confirmation prompt}
    {--keep-system : Keep system databases (admin, config, local)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Drop all MongoDB databases (app + test). Destructive — requires --force or confirmation.';

    /**
     * System databases that should never be dropped unless explicitly requested.
     */
    private const SYSTEM_DATABASES = ['admin', 'config', 'local'];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $client = DB::connection('core')->getClient();

        $databases = iterator_to_array($client->listDatabases());
        $allNames = array_map(fn ($db) => $db->getName(), $databases);

        // Determine which databases to drop
        $keepSystem = $this->option('keep-system');
        $toDrop = array_filter($allNames, function (string $name) use ($keepSystem) {
            if ($keepSystem && in_array($name, self::SYSTEM_DATABASES, true)) {
                return false;
            }

            return true;
        });

        $toDrop = array_values($toDrop);

        if (empty($toDrop)) {
            $this->info('No databases found to drop.');

            return self::SUCCESS;
        }

        $this->warn('The following databases will be dropped:');
        foreach ($toDrop as $name) {
            $this->line("  • {$name}");
        }

        if (! $this->option('force') && ! $this->confirm('Are you sure you want to drop ALL of these databases? This is irreversible.')) {
            $this->info('Operation cancelled.');

            return self::SUCCESS;
        }

        $dropped = 0;
        $failed = 0;

        foreach ($toDrop as $name) {
            try {
                /** @var Database $db */
                $db = $client->selectDatabase($name);
                $db->drop();

                $this->info("✅ Dropped: {$name}");
                $dropped++;
            } catch (\Throwable $e) {
                $this->error("❌ Failed to drop {$name}: {$e->getMessage()}");
                $failed++;
            }
        }

        $this->newLine();
        $this->info("Done. {$dropped} database(s) dropped, {$failed} failed.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
