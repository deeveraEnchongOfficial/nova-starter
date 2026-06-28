<?php

return [
    'multi_tenant' => env('FEATURE_MULTI_TENANT', false),
    'user_registration' => env('FEATURE_USER_REGISTRATION', true),
    'password_reset' => env('FEATURE_PASSWORD_RESET', true),
    'email_verification' => env('FEATURE_EMAIL_VERIFICATION', false),
    'two_factor_auth' => env('FEATURE_TWO_FACTOR_AUTH', false),
    'user_profile_edit' => env('FEATURE_USER_PROFILE_EDIT', true),
    'account_deletion' => env('FEATURE_ACCOUNT_DELETION', true),
    'api_tokens' => env('FEATURE_API_TOKENS', false),
    'dark_mode' => env('FEATURE_DARK_MODE', true),
];
