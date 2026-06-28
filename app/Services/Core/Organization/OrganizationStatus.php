<?php

namespace App\Services\Core\Organization;

enum OrganizationStatus: string
{
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case PENDING = 'pending';
}
