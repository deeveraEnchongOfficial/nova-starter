<?php

namespace App\Support\Mixins;

use Closure;
use Illuminate\Http\RedirectResponse;

class RedirectResponseMixin
{
    public function withToastMessage(): Closure
    {
        return function (string $message, ?string $type = null): RedirectResponse {
            $messages = $this->getSession()->get('__toast_messages__', []);
            $messages[] = compact('message', 'type');
            $this->getSession()->flash('__toast_messages__', $messages);

            return $this;
        };
    }

    public function withToastError(): Closure
    {
        return function (string $message): RedirectResponse {
            return $this->withToastMessage($message, 'error');
        };
    }

    public function withToastSuccess(): Closure
    {
        return function (string $message): RedirectResponse {
            return $this->withToastMessage($message, 'success');
        };
    }

    public function withToastInfo(): Closure
    {
        return function (string $message): RedirectResponse {
            return $this->withToastMessage($message, 'info');
        };
    }

    public function withToastWarning(): Closure
    {
        return function (string $message): RedirectResponse {
            return $this->withToastMessage($message, 'warning');
        };
    }
}
