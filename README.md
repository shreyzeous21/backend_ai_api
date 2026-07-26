# Node AI Gateway

A production-ready Express API gateway for accessing LLMs through **OpenRouter** (400+ models) and **Google Gemini**. Chat with history support, rate limiting, and streaming-ready responses.

## Setup

```bash
npm install
cp .env.example .env  # then edit your variables
npm run dev
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `4000` | Server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origin |

## API

### `POST /api/v1/gemini`

Send a chat message to a **Google Gemini** model.

#### Headers

| Header | Description |
|---|---|
| `Content-Type` | `application/json` |
| `x-api-key` | Gemini API key (alternative to `body.apiKey`) |

#### Body

```json
{
  "message": "What is quantum computing?",
  "model": "gemini-2.0-flash-001",
  "apiKey": "AIza...",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "model", "content": "Hi! How can I help?" }
  ],
  "system_prompt": "You are a helpful assistant."
}
```

| Field | Required | Description |
|---|---|---|
| `message` | Yes | The user's message (max 1000 chars) |
| `model` | Yes | Gemini model slug (e.g. `gemini-2.0-flash-001`, `gemini-3.6-flash`) |
| `apiKey` | Yes* | Gemini API key (or use `x-api-key` header) |
| `history` | No | Previous messages for conversation context (max 50 turns) |
| `system_prompt` | No | Custom system prompt |

#### Success Response

```json
{
  "success": true,
  "data": "Quantum computing uses qubits..."
}
```

#### Error Responses

| Status | Meaning |
|---|---|
| `400` | Missing or invalid input (message, apiKey, model) |
| `401` | Invalid or unauthorized API key |
| `429` | Rate limit exceeded |
| `504` | Model timed out (60s timeout) |
| `502` | Model unavailable or empty response |

---

### `POST /api/v1/openrouter`

Send a chat message to any **OpenRouter** model (400+ models).

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
| `system_prompt` | No | Custom system prompt |

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
| `504` | Model timed out (120s timeout) |
| `502` | Model unavailable or upstream error |

In development mode (`NODE_ENV=development`), `502` responses include a `debug` field with internal error details.

---

### `GET /api/v1/health`

Server health check.

```json
{
  "success": true,
  "status": "healthy",
  "providers": { "openrouter": true, "gemini": false, "openai": false },
  "uptime": "2h 15m 30s",
  "memory": { "rss": "45.23 MB" }
}
```

### `GET /`

Root health check.

```json
{ "success": true, "message": "API is running." }
```

## Client Examples

### React / TypeScript

```tsx
const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
const [input, setInput] = useState("");

async function sendMessage() {
  const history = messages.map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch("http://localhost:4000/api/v1/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: input,
      model: "gemini-2.0-flash-001",
      apiKey: "AIza...",
      history,
      system_prompt: "You are a helpful assistant.",
    }),
  });

  const data = await res.json();

  setMessages((prev) => [
    ...prev,
    { role: "user", content: input },
    { role: "model", content: data.data },
  ]);
}
```

### cURL

```bash
curl -X POST http://localhost:4000/api/v1/gemini \
  -H "Content-Type: application/json" \
  -H "x-api-key: AIza..." \
  -d '{
    "message": "Hello!",
    "model": "gemini-2.0-flash-001",
    "system_prompt": "You are a helpful assistant."
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

- **OpenRouter**: Browse available models at [openrouter.ai/models](https://openrouter.ai/models). Use the model slug (e.g. `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`, `google/gemini-2.0-flash-001`).
- **Gemini**: Use standard Gemini model names (e.g. `gemini-2.0-flash-001`, `gemini-3.6-flash`).

## Tips

- **Conversation history**: The server is stateless. Send the full message history with each request using the `history` array. Build it by pushing each `{ role, content }` on the client side.
- **API key**: Pass it in the `x-api-key` header or the `apiKey` body field. The header takes precedence.
- **Rate limits**: The server applies a global rate limit of 100 requests per 15 minutes per IP. Provider-level rate limits may apply separately.
- **Free models**: Many OpenRouter models have free tiers — use `:free` suffix (e.g. `nvidia/nemotron-3-super-120b-a12b:free`).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with hot-reload (nodemon) |
| `npm start` | Start in production mode |
