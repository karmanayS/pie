# Pie

## Architecture

Pie is a Bun and TypeScript coding-agent CLI. Commands configure the provider and model, then the agent sends the prompt and current chat history to the provider API. The model can request file or shell tools; Pie executes them, returns their results to the model, and persists the completed conversation locally.

```text
CLI command → agent loop → provider API → tool execution
                    ↑                                  ↓
                    └──────── tool results ────────────┘
                              ↓
                     local chat persistence
```

Provider/model selection and the active chat are stored in `db/state.json`, credentials in `db/auth.json`, and chat history in `db/chats.json`.

## Local usage

Install [Bun](https://bun.sh), clone the project, and run:

```bash
bun install
mkdir -p db

bun cli.ts providers login --provider openai --api_key <your-api-key>
bun cli.ts providers set --provider openai
bun cli.ts models list
bun cli.ts models set --model <model-name>

bun cli.ts agent --prompt "Inspect this project"
```

Manage conversations with:

```bash
bun cli.ts chats list
bun cli.ts chats resume --id <chat-id>
bun cli.ts chats current
bun cli.ts chats new
```

> **Note:** Pie is under active development. More features, including support for additional providers, will be added soon. You may encounter bugs; if you do, you are welcome to raise an issue.
