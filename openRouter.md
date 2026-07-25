# Node AI Gateway

A production-ready Express API gateway for accessing LLMs through [OpenRouter](https://openrouter.ai/). Supports 400+ models with a simple chat-completion interface.

## Setup

```bash
npm install
cp .env.example .env  # then edit your API key
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key |
| `PORT` | No | Server port (default: 4000) |
| `NODE_ENV` | No | `development` or `production` |

## API

### `POST /api/v1/openrouter`

Send a chat message and get an AI response.

#### Headers

| Header | Description |
|---|---|
| `Content-Type` | `application/json` |
| `x-api-key` | OpenRouter API key (alternative to `body.apiKey`) |

#### Body

```json
{
  "message": "What is quantum computing?",
  "model": "openai/gpt-4o",
  "apiKey": "sk-or-v1-...",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ],
  "system_prompt": "You are a helpful assistant."
}
```

| Field | Required | Description |
|---|---|---|
| `message` | Yes | The user's message (max 1000 chars) |
| `model` | Yes | OpenRouter model slug (e.g. `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`) |
| `apiKey` | Yes* | OpenRouter API key (or use `x-api-key` header) |
| `history` | No | Previous messages for conversation context (max 50 messages) |
| `system_prompt` | No | Custom system prompt (defaults to none) |

#### Success Response

```json
{
  "success": true,
  "response": "Quantum computing uses qubits...",
  "usage": {
    "promptTokens": 45,
    "completionTokens": 120,
    "totalTokens": 165
  }
}
```

`usage` is only included when token information is available from the model.

#### Error Responses

| Status | Meaning |
|---|---|
| `400` | Missing or invalid input (message, apiKey, model) |
| `429` | OpenRouter rate limit exceeded |
| `504` | Model timed out (no response within 120s) |
| `502` | Model unavailable or upstream error |

Error body:
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

In development mode (`NODE_ENV=development`), `502` responses include a `debug` field with internal error details.

### `GET /api/v1/health`

Server health check.

```json
{
  "success": true,
  "status": "healthy",
  "providers": { "openrouter": true, "gemini": false, "openai": false },
  "uptime": "2h 15m 30s",
  "memory": { "rss": "45.23 MB", ... }
}
```

### `GET /`

Root health check.

```json
{ "success": true, "message": "API is running." }
```

## Client Example

### React / TypeScript

```tsx
const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
const [input, setInput] = useState("");

async function sendMessage() {
  const history = messages.map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch("http://localhost:4000/api/v1/openrouter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: input,
      model: "openai/gpt-4o",
      apiKey: "sk-or-v1-...",
      history,
    }),
  });

  const data = await res.json();

  setMessages((prev) => [
    ...prev,
    { role: "user", content: input },
    { role: "assistant", content: data.response },
  ]);
}
```

### cURL

```bash
curl -X POST http://localhost:4000/api/v1/openrouter \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-or-v1-..." \
  -d '{
    "message": "Hello!",
    "model": "openai/gpt-4o"
  }'
```

### Python

```python
import requests

res = requests.post("http://localhost:4000/api/v1/openrouter", json={
    "message": "Hello!",
    "model": "openai/gpt-4o",
    "apiKey": "sk-or-v1-...",
    "history": []
})
data = res.json()
print(data["response"])
```

## Models

Browse available models on [OpenRouter Models](https://openrouter.ai/models). Use the model slug as the `model` parameter (e.g. `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`, `google/gemini-2.0-flash-001`).

## Tips

- **Conversation history**: The server is stateless. Send the full message history with each request using the `history` array. Build it by pushing each `{ role, content }` on the client side.
- **API key**: Pass it in the `x-api-key` header or the `apiKey` body field. The header takes precedence.
- **Rate limits**: OpenRouter rate limits vary by model and tier. Handle `429` responses with exponential backoff.
- **Free models**: Many OpenRouter models have free tiers — use `:free` suffix (e.g. `nvidia/nemotron-3-super-120b-a12b:free`).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with hot-reload (nodemon) |
| `npm start` | Start in production mode |
