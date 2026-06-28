<?php

namespace Database\Factories\Services\Core\Organization;

use App\Services\Core\Organization\Organization;
use App\Services\Core\Organization\OrganizationStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Organization>
 */
class OrganizationFactory extends Factory
{
    protected $model = Organization::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'status' => OrganizationStatus::ACTIVE,
            'is_active' => true,
        ];
    }
}
