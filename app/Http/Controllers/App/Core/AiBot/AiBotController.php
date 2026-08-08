<?php

namespace App\Http\Controllers\App\Core\AiBot;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Prism\Prism\Prism;
use Prism\Prism\Enums\Provider;
use Prism\Prism\ValueObjects\Messages\UserMessage;
use Prism\Prism\ValueObjects\Messages\SystemMessage;
use Prism\Prism\ValueObjects\Messages\AssistantMessage;

class AiBotController extends Controller
{
    public function __construct(
        private readonly Prism $prism,
    ) {}

    /**
     * Send a chat message and get an AI response.
     */
    public function chat(Request $request)
    {
        $data = $request->validate([
            'messages' => ['required', 'array', 'min:1'],
            'messages.*.role' => ['required', 'string', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string'],
        ]);

        $systemPrompt = $this->loadSystemPrompt();

        // Build the message chain for Prism
        $prismMessages = [new SystemMessage($systemPrompt)];

        foreach ($data['messages'] as $msg) {
            if ($msg['role'] === 'user') {
                $prismMessages[] = new UserMessage($msg['content']);
            } else {
                $prismMessages[] = new AssistantMessage($msg['content']);
            }
        }

        try {
            $response = $this->prism->text()
                ->using(Provider::OpenRouter, config('prism.providers.openrouter.model', 'openai/gpt-4o-mini'))
                ->withMessages($prismMessages)
                ->asText();

            return response()->json([
                'message' => $response->text,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Sorry, I encountered an error while processing your request. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Load and concatenate all markdown files from the ai_bot directory
     * to form the system prompt.
     */
    protected function loadSystemPrompt(): string
    {
        $directory = base_path('ai_bot');

        if (! is_dir($directory)) {
            return 'You are a helpful AI assistant.';
        }

        $files = glob($directory . '/*.md');

        // Sort alphabetically, but put system-prompt.md first
        usort($files, function ($a, $b) {
            $aName = basename($a);
            $bName = basename($b);

            if ($aName === 'system-prompt.md') return -1;
            if ($bName === 'system-prompt.md') return 1;
            if ($aName === 'README.md') return 1;
            if ($bName === 'README.md') return -1;

            return strcmp($aName, $bName);
        });

        $parts = [];
        foreach ($files as $file) {
            $name = basename($file, '.md');
            if ($name === 'README') continue; // Skip README

            $content = file_get_contents($file);
            $parts[] = $content;
        }

        return implode("\n\n---\n\n", $parts);
    }
}
