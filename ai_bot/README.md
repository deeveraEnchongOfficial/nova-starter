# AI Bot Configuration

This folder contains markdown files that configure the AI chatbot's behavior, guardrails, and context.

## Files

| File | Purpose |
|------|---------|
| `system-prompt.md` | The core system prompt that defines the assistant's identity, role, and capabilities |
| `guardrails.md` | Safety rules — prohibited content, security boundaries, and behavioral constraints |
| `app-context.md` | Application context — tech stack, features, routes, and permissions the assistant should know about |
| `response-format.md` | Response formatting rules — markdown usage, structure, and length guidelines |

## How It Works

1. The `AiBotController` loads all `.md` files from this directory
2. Files are concatenated and sent as the system prompt to the AI provider
3. The AI uses this context to generate responses that are aligned with the application's purpose

## Adding New Context

To add new context for the bot:
1. Create a new `.md` file in this folder
2. The file will be automatically loaded (alphabetical order)
3. Use clear headers and structured content for best results

## Editing Guardrails

When modifying `guardrails.md`:
- Be specific about what is prohibited
- Include handling instructions for edge cases
- Test changes by asking the bot questions that should be blocked
