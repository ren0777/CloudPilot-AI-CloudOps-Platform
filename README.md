# CloudPilot

AI-assisted cloud operations final-year project by Mohammad Faizan.

Start with [the full project guide](docs/PROJECT_GUIDE.md). It includes architecture, local setup, collector configuration, a presentation script, viva answers and honest limitations.

## Included
- Responsive React + TypeScript operations dashboard
- Worker server API and durable SQL database
- Simulated incidents, investigation and recovery audit history
- Validated bearer-authenticated telemetry endpoint
- Optional OpenAI analysis with explicit deterministic runbook fallback
- Cost review from configured estimates
- Python Linux collector, Dockerfile and Kubernetes lab deployment

## Quick start
Read docs/PROJECT_GUIDE.md before starting. Install the package manager version declared in package.json, run `pnpm install --frozen-lockfile`, copy `.env.example` to `.env`, run `pnpm build`, apply generated SQL migrations using the guide, and run `pnpm start`.

This is an owner-private capstone lab, not a production multi-tenant monitoring service. Real cloud accounts and a live AI provider are not connected by default.
