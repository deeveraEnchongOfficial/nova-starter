<?php

namespace Database\Factories\Services\Core\User;

use App\Services\Core\User\User;
use Database\Factories\UserFactory as BaseUserFactory;

/**
 * @extends \Database\Factories\UserFactory<User>
 */
class UserFactory extends BaseUserFactory
{
    // Delegates to the base UserFactory so the service-based model
    // can resolve its factory via convention: App\Services\Core\User\User
    // → Database\Factories\Services\Core\User\UserFactory
}
