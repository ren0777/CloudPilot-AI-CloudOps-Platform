# CloudPilot — AI-assisted Cloud Operations Platform

Author: Mohammad Faizan. B.Tech CSE, Cloud Computing and Virtualization.

## Abstract
CloudPilot combines infrastructure telemetry, deterministic alerting, incident management, cost review and contextual troubleshooting in a single operations workspace. A simulated lab enables repeatable incident and recovery demonstrations without paid infrastructure. A separate authenticated telemetry endpoint accepts real host readings. An optional language model explains evidence; deterministic runbooks provide an explicit fallback when no model is configured.

## Implemented architecture
React/TypeScript dashboard → server API → D1 SQL database.
Python host collector → bearer-authenticated /api/ingest → validated metrics → threshold detection → incidents.
Incident evidence + latest resource metrics → /api/analyze → built-in runbook or optional OpenAI model.
Demo scenario/recovery → SQL transaction → resource sample + incident state + audit trail.

The hosted app uses Vinext and Cloudflare Workers. It is not deployed in the user's AWS account. EC2, EKS and RDS names in demo records are illustrative labels. The Python collector can run on an actual EC2 Linux host after a reachable authenticated ingestion path is configured.

## API
- GET /api/ops: resource snapshot, latest 100 incidents, latest 100 audit events, latest 400 samples.
- POST /api/ops: same-origin demo seed, simulate, acknowledge and simulated recovery.
- POST /api/ingest: requires INGEST_TOKEN bearer token; validates ID and bounded numerical readings. Rejects demo-prefixed IDs. Keeps most recent 5000 samples globally.
- POST /api/analyze: same-origin contextual analysis; no command execution.

The private hosted preview is protected by platform owner sign-in. Do not expose these UI APIs on a public host without adding application authentication, authorization and rate limits. The collector token does not bypass the hosting platform's access gate.

## Local setup (WSL Ubuntu)
1. Install Node.js 22.13 or newer and the pnpm version in package.json.
2. Run `pnpm install --frozen-lockfile` in this project.
3. Copy `.env.example` to `.env`. Configure a long random INGEST_TOKEN. AI_API_KEY and AI_MODEL are optional; never commit secret values.
4. Run `pnpm build`.
5. Apply each SQL migration in order with `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/<migration-file>.sql`.
6. Run `pnpm start`; use the local address printed by Wrangler. Local D1 data is under .wrangler/state.
7. Open Overview and click Load demo.

These commands are for the supplied Worker-based application. A regular Node.js server cannot replace its D1 runtime binding unchanged. Keep the runtime helper scripts included in the source.

## Real host collector
Run directly on the Linux host to obtain host CPU and memory (psutil in a container can report misleading host/cgroup values).

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r collector/requirements.txt
export CLOUDPILOT_URL=http://127.0.0.1:8787
export INGEST_TOKEN='<same-server-token>'
export HEALTH_URL=http://127.0.0.1:8080/health
export RESOURCE_ID=local-webserver
export RESOURCE_NAME=local-webserver
python collector/agent.py
```
Use the actual server port printed by Wrangler, not necessarily 8787. Set HEALTH_URL to your service's existing health endpoint. Failed health probes report latency 10000 ms. MONTHLY_COST_USD is a manually provided estimate, never an automatically discovered bill. No AWS credentials are needed for basic Linux host metrics.

The private preview cannot be used directly by an unattended collector. Use the local lab or provision a separately authenticated ingestion deployment before attempting an external connection. Never disable the preview access gate merely to connect a collector.

## Docker / Kubernetes lab
`docker build -t cloudpilot-collector:local collector` builds the collector image. For Docker Desktop Kubernetes, create a local Secret named cloudpilot-collector-config containing CLOUDPILOT_URL, INGEST_TOKEN and HEALTH_URL using your actual reachable lab addresses, then apply deploy/collector.yaml. Minikube needs its own image load. This manifest deploys a single probe, not an entire monitoring cluster. It uses no cloud credentials, host mounts, or Kubernetes API permissions. Container CPU/memory is not production-quality per-pod monitoring; node-exporter and metrics-server are future integrations.

## AI setup
Without a key, the UI explicitly says Built-in runbook — no AI model connected. Set AI_API_KEY and AI_MODEL as server secrets to enable the OpenAI Chat Completions adapter. The model must support max_completion_tokens and the Chat Completions API. Hosting environment secrets must be configured separately from local .env. Obtain keys through the OpenAI Developers connection or the provider dashboard, never by pasting them into project source.

The model receives the question, selected incident and up to 50 resource records. Review telemetry sensitivity before enabling it. AI findings are hypotheses and cannot execute shell commands or mutate cloud resources. Provider failures appear as errors rather than fake generated answers. The provider path requires credentials and has not been live-tested in this delivery.

## 5-minute presentation
1. Problem: metrics, incidents and recovery context are scattered across tools.
2. Load six simulated resources and explain the dashboard.
3. Run CPU spike: show CPU at 96%, degraded resource and open incident.
4. Start investigation, analyze evidence, and explain why high CPU does not prove root cause.
5. Simulate recovery: metrics become healthy, incident resolves, event persists.
6. Refresh the page and show the incident and audit record remain.
7. Show the low-CPU staging resource and discuss cost review without claiming guaranteed savings.
8. Export the operations report and describe the real collector path.

## Viva questions
- Is this machine-learning anomaly detection? No. Thresholds detect incidents. An optional LLM provides contextual explanations.
- Why a SQL database? Incidents and audit history must survive refreshes and support consistent state transitions.
- What are the thresholds? CPU >=85%, memory >=90%, latency >=1000 ms.
- Does it automatically fix EC2? No. Recovery is simulated; real changes need a separately authorized execution integration.
- How do real incidents close? A newly ingested sample must be under all configured thresholds.
- What is the AI risk? Hallucinated root causes. Ground answers in readings, label hypotheses and require verification.
- What is the cost model? Sum of manually provided monthly USD estimates, not AWS Cost Explorer data.
- How are tokens protected? Server environment only; collector sends its token in an authorization header.
- Can users share a workspace? This deliverable is an owner-private single workspace, not a multi-tenant service.
- What remains? Production authentication for alternate hosting, sustained-window alerting, hysteresis, resource-specific retention, real AWS inventory/billing, Prometheus ingestion, approved execution, and evaluation datasets.

## Evaluation plan
Use labelled healthy, CPU saturation, memory pressure and slow-response workloads. Record detection delay, false positives, false negatives, correct suggested checks, and recovery time. Compare manual triage with assisted triage. Report sample size and uncertainty; do not invent benchmark improvements. Stale metrics are labelled after five minutes but do not independently open an incident. Recovery currently uses one healthy sample, so production use needs hysteresis.
