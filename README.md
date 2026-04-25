# CopilotLive — Interview Assistant

A real-time interview assistant that listens to questions, generates tailored answers using Claude AI, and streams them to your screen instantly.

## Features

- **Live mic capture** — records the interviewer's question via the Web Speech API (Chrome/Edge)
- **Streaming answers** — responses stream token-by-token from Claude Sonnet so you see the answer as it's written
- **Tailored context** — upload your resume, job description, and personal notes (PDF, DOCX, TXT) for answers specific to your background and the role
- **Interview history** — every completed answer is saved automatically; download the full session as Markdown, plain text, or JSON
- **Mobile responsive** — works on phone and tablet with a tabbed layout and safe-area support

## Tech Stack

| Layer | Tech |
|---|---|
| Server | Node.js, Express 4, TypeScript, `tsx watch` |
| AI | Anthropic Claude Sonnet 4.6 via `@anthropic-ai/sdk` |
| Streaming | Server-Sent Events (SSE) with prompt caching |
| Client | React 18, Vite, Tailwind CSS |
| Speech | Web Speech API (`SpeechRecognition`) |
| File parsing | `pdf-parse`, `mammoth` (DOCX), plain text |

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- Chrome or Edge (for microphone / speech recognition)

## Getting Started

### 1. Clone

```bash
git clone https://github.com/walearo/CopilotLive.git
cd CopilotLive
```

### 2. Configure the API key

```bash
copy .env.example server\.env
```

Open `server/.env` and set your key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Start (Windows)

Double-click **`start.bat`** or run it from a terminal:

```bat
start.bat
```

This will:
- Install dependencies if `node_modules` is missing
- Kill anything already on ports 3001 / 5173
- Open the API server and Vite dev server in separate windows
- Open [http://localhost:5173](http://localhost:5173) in your browser

To stop the app, run **`stop.bat`**.

### Manual start (any OS)

```bash
# Install dependencies
npm install

# Terminal 1 — API server (port 3001)
cd server && npm run dev

# Terminal 2 — Vite client (port 5173)
cd client && npm run dev
```

## Usage

1. **Setup tab** — add your resume, job description, and any talking points. Supports file upload or paste.
2. **Interview tab** — tap the mic button (or press `Space`) to start listening, then hit **Get Answer** (or `⌘↵ / Ctrl↵`) when the question is captured. The answer streams in real time.
3. After each answer, click **Copy** to copy to clipboard. All completed answers are saved to the history panel automatically.
4. Use the **Download** button in the history panel to export the session.

## Project Structure

```
CopilotLive/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/      # AnswerDisplay, ContextPanel, HistorySection, InterviewPanel
│       ├── hooks/           # useSpeechRecognition, useStreamingAnswer
│       └── utils/           # downloadHistory (MD / TXT / JSON)
├── server/                  # Express API
│   └── src/
│       ├── routes/          # /api/answer (SSE), /api/upload
│       └── services/        # claudeService, documentParser
├── start.bat                # Windows one-click launcher
├── stop.bat                 # Windows process killer
└── .env.example             # Environment variable template
```

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (`sk-ant-...`) |
| `PORT` | API server port (default: `3001`) |
| `NODE_ENV` | `development` or `production` |

## Production Build

```bash
cd client && npm run build   # outputs to client/dist/
cd ../server && npm start    # Express serves both API and static files
```

In production, the single Express process serves the compiled React app from `client/dist/` alongside the API.

## License

MIT
