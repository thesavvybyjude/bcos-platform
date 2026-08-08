# BCOS Platform — n8n Automation Workflow Integration

This directory contains a pre-built n8n workflow for receiving real-time BCOS platform webhooks and relaying alerts to Slack/Teams/Notion.

---

## ⚡ Setup Instructions

1. **Import Workflow into n8n**:
   - Open your n8n dashboard (`http://localhost:5678`).
   - Click **Workflows** -> **Import from File**.
   - Select `examples/n8n/bcos-webhook-workflow.json`.

2. **Register Webhook in BCOS Admin**:
   - Open your BCOS Admin Panel (`/admin` or API `POST /api/webhooks/register`).
   - Set URL to your n8n webhook URL (e.g., `http://n8n:5678/webhook/bcos-context-compiled`).
   - Select event `CONTEXT_COMPILED`.
   - Copy the generated `secret` into the n8n HMAC function node.

3. **Test Webhook**:
   - Use `POST /api/webhooks/{id}/test` in BCOS Admin to verify signature match and delivery!
