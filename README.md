# RailGuard AI — 100 km Triage Engine

Backend MVP for the AI & Algorithms Lead: deterministic shared-track conflict detection with real-time Socket.IO updates and optional Gemini operator triage.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Endpoints: `GET /api/sector`, `GET /api/conflicts`, `GET /api/dispatch-comparison`, `POST /api/triage`, and `POST /api/trains/:id/delay` with `{ "delayMinutes": 12 }`.

`GET /api/dispatch-comparison` gives the frontend a deterministic Legacy Manual vs AI-Optimized scenario: `57` cumulative legacy delay minutes, `41` minutes saved, and a `72%` efficiency gain. It is a transparent hackathon simulation, not movement authority.

`POST /api/triage` is deliberately non-authoritative. It sends the fixed JSON state and deterministic conflict results to Gemini with a JSON schema, and falls back to deterministic advice if an API key is not configured or Gemini is unavailable. Connected dashboards receive `sector:update` after a delay change.
