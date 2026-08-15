<?php

namespace App\Console\Commands\DevOps;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

class AiCodeReview extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devops:ai-code-review
    {--severity=P1 : The minimum severity level to report (P1, P2, P3)}
    {--commit=HEAD~1 : The commit to diff against (default: last commit)}
    {--model= : Override the OpenRouter model (default: from .env)}
    {--save : Save the review results to reviews/ directory}
    {--debug : Enable debug output}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform AI-powered code review of the last commit using OpenRouter';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $severity = $this->option('severity');
        $commit = $this->option('commit');
        $debug = $this->option('debug');
        $save = $this->option('save');

        $apiKey = config('services.openrouter.api_key') ?: env('OPENROUTER_API_KEY');
        $url = config('services.openrouter.url') ?: env('OPENROUTER_URL', 'https://openrouter.ai/api/v1');
        $model = $this->option('model') ?: env('OPENROUTER_MODEL', 'openai/gpt-4o-mini');

        if (empty($apiKey)) {
            $this->error('OPENROUTER_API_KEY is not set. Add it to your .env file.');

            return self::FAILURE;
        }

        // Get the diff
        $diffContent = $this->getGitDiff($commit);
        if (empty($diffContent)) {
            $this->warn("No diff content found for commit range: {$commit}..HEAD");

            return self::SUCCESS;
        }

        if ($debug) {
            $this->info("Diff size: " . strlen($diffContent) . " bytes");
            $this->info("Model: {$model}");
            $this->info("Severity: {$severity}");
        }

        // Build the prompt
        $prompt = $this->buildPrompt($severity, $diffContent);

        if ($debug) {
            $this->info('Sending review request to OpenRouter...');
        }

        // Send to OpenRouter with streaming
        return $this->streamReview($url, $apiKey, $model, $prompt, $debug, $save, $commit, $severity);
    }

    /**
     * Get the git diff for the specified commit range.
     */
    protected function getGitDiff(string $commit): string
    {
        $escapedCommit = escapeshellarg($commit);
        $output = shell_exec("git diff {$escapedCommit}..HEAD --no-color 2>/dev/null");

        return trim((string) $output);
    }

    /**
     * Build the complete prompt with project context and diff.
     */
    protected function buildPrompt(string $severity, string $diffContent): string
    {
        // Base prompt from the Blade template (includes all coding standards)
        $prompt = view('devops.review-prompt', [
            'severity' => $severity,
        ])->render();

        // Add AGENTS.md as project context
        $agentsFile = base_path('AGENTS.md');
        if (File::exists($agentsFile)) {
            $prompt .= "\n\n## PROJECT CONTEXT (AGENTS.md)\n";
            $prompt .= "```\n";
            $prompt .= File::get($agentsFile);
            $prompt .= "\n```\n";
        }

        // Add README.md as architecture reference
        $readmeFile = base_path('README.md');
        if (File::exists($readmeFile)) {
            $prompt .= "\n## PROJECT ARCHITECTURE (README.md)\n";
            $prompt .= "```\n";
            $prompt .= File::get($readmeFile);
            $prompt .= "\n```\n";
        }

        // Add the diff
        $prompt .= "\n## CODE CHANGES TO REVIEW\n";
        $prompt .= "```diff\n";
        $prompt .= $diffContent;
        $prompt .= "\n```\n";

        return $prompt;
    }

    /**
     * Stream the review response from OpenRouter.
     */
    protected function streamReview(
        string $url,
        string $apiKey,
        string $model,
        string $prompt,
        bool $debug,
        bool $save,
        string $commit,
        string $severity,
    ): int {
        $endpoint = rtrim($url, '/') . '/chat/completions';

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
            'HTTP-Referer' => config('app.url', 'http://localhost'),
            'X-Title' => 'Nova Starter AI Code Review',
        ])->withOptions([
            'stream' => true,
            'timeout' => 120,
            'connect_timeout' => 30,
        ])->post($endpoint, [
            'model' => $model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are an expert Laravel code reviewer. Be concise, specific, and actionable. Only report real issues.',
                ],
                [
                    'role' => 'user',
                    'content' => $prompt,
                ],
            ],
            'stream' => true,
            'temperature' => 0.3,
        ]);

        if (! $response->ok()) {
            $this->error("OpenRouter request failed: HTTP {$response->status()}");
            if ($debug) {
                $this->line($response->body());
            }

            return self::FAILURE;
        }

        // Parse SSE stream — read in chunks and split by newlines
        $body = $response->getBody();
        $buffer = '';
        $fullContent = '';

        while (! $body->eof()) {
            $chunk = $body->read(1024);
            if ($chunk === '') {
                break;
            }

            $buffer .= $chunk;

            // Process complete lines from the buffer
            while (($pos = strpos($buffer, "\n")) !== false) {
                $line = substr($buffer, 0, $pos);
                $buffer = substr($buffer, $pos + 1);

                $line = trim($line);

                if ($line === '' || ! str_starts_with($line, 'data: ')) {
                    continue;
                }

                $data = substr($line, 6);

                // "[DONE]" signals end of stream
                if ($data === '[DONE]') {
                    $buffer = '';
                    break 2;
                }

                $parsed = json_decode($data, true);
                if (isset($parsed['choices'][0]['delta']['content'])) {
                    $text = $parsed['choices'][0]['delta']['content'];
                    $fullContent .= $text;
                    echo $text;

                    if (ob_get_level()) {
                        ob_flush();
                    }
                    flush();
                }
            }
        }

        echo "\n\n";

        // Save to file if requested
        if ($save && ! empty($fullContent)) {
            $savedPath = $this->saveReview($fullContent, $commit, $severity, $model);
            $this->newLine();
            $this->info("📄 Review saved to: {$savedPath}");
        }

        if ($debug) {
            $this->newLine();
            $this->info('✅ Code review completed!');
        }

        return self::SUCCESS;
    }

    /**
     * Save the review results to the reviews/ directory.
     */
    protected function saveReview(string $content, string $commit, string $severity, string $model): string
    {
        $reviewsDir = base_path('reviews');
        if (! File::exists($reviewsDir)) {
            File::makeDirectory($reviewsDir, 0755, true);
        }

        $timestamp = now()->format('Y-m-d_His');
        $commitShort = str_replace(['HEAD', '~'], ['', '-'], $commit);
        $filename = "review_{$timestamp}_{$commitShort}_{$severity}.md";
        $filepath = "{$reviewsDir}/{$filename}";

        $header = "# AI Code Review\n\n";
        $header .= "- **Date:** " . now()->toDateTimeString() . "\n";
        $header .= "- **Commit range:** {$commit}..HEAD\n";
        $header .= "- **Severity:** {$severity}\n";
        $header .= "- **Model:** {$model}\n\n";
        $header .= "---\n\n";

        File::put($filepath, $header . $content . "\n");

        return $filepath;
    }
}
