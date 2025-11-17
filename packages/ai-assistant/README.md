## AI Assistant (Codex, Claude, Gemini)

An AI assistant panel for Pulsar with pluggable providers:
- Codex (via Codex CLI `codex exec`)
- Anthropic Claude (HTTP v1/messages)
- Google Gemini (Generative Language API v1beta)

Features
- Right-side panel with prompt box, provider selector, model input, and output area.
- Toggle via `ctrl-alt-a` or Packages → AI Assistant → Toggle Panel.
- Real integrations only: calls live providers; no mocks.

Provider setup
- Codex: Install the Codex CLI and ensure `codex` is on PATH. No API key here; it uses your CLI auth.
- Claude: Set Anthropic API key under Settings → Packages → ai-assistant, or export `ANTHROPIC_API_KEY`.
- Gemini: Set Google API key under Settings → Packages → ai-assistant, or export `GOOGLE_API_KEY` / `GOOGLE_GENAI_API_KEY`.

Usage
1) Open the panel (ctrl-alt-a).
2) Choose provider and model (examples: `gpt-5`, `claude-3-5-sonnet-latest`, `gemini-1.5-pro`).
3) Enter your prompt and click Ask.

Notes
- For Codex, the package shells out to `codex exec` and returns the captured output.
- Claude/Gemini responses are non-streaming JSON calls rendered as text.
- Keep credentials out of source control. Prefer environment variables.

Troubleshooting
- Ensure Codex CLI is installed and accessible for the Codex provider.
- Verify API keys for Claude/Gemini.
- Check the developer console for errors (View → Developer → Toggle Developer Tools).

