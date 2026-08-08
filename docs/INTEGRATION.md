# BCOS Platform — Webhooks & Systems Integration Guide

This guide documents connecting external automation platforms (n8n, Zapier, Make, Pipedream) and custom microservices to BCOS event streams using HMAC-signed HTTP webhooks.

---

## 🔒 HMAC-SHA256 Payload Signing & Verification

Every webhook POST request delivered by BCOS includes the following HTTP headers:

- `X-BCOS-Event`: Event type string (e.g. `CONTEXT_COMPILED`, `MODULE_UPDATED`)
- `X-BCOS-Signature`: HMAC-SHA256 hex digest signature computed over the JSON body using your secret key.
- `Content-Type`: `application/json`

### Signature Verification (Python Example)

```python
import hmac, hashlib, json

def verify_signature(payload_json_str: str, signature: str, secret: str) -> bool:
    payload_dict = json.loads(payload_json_str)
    expected_bytes = json.dumps(payload_dict, sort_keys=True).encode("utf-8")
    expected_sig = hmac.new(secret.encode("utf-8"), expected_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected_sig)
```

---

## ⚡ Supported Webhook Event Types

- `MODULE_CREATED` — A new business module is ingested or created.
- `MODULE_UPDATED` — Raw Markdown module content is modified.
- `MODULE_ARCHIVED` — Module status set to archived.
- `MODULE_PUBLISHED` — Module status set to active.
- `CONTEXT_COMPILED` — AI Context compiled for LLM prompts.
- `VALIDATION_COMPLETE` — Schema and cross-reference validation diagnostic complete.

---

## 📡 API Endpoints for Webhook Management

- `POST /api/webhooks` — Register a webhook endpoint.
- `GET /api/webhooks` — List active webhooks.
- `DELETE /api/webhooks/{id}` — Delete a webhook subscription.
- `POST /api/webhooks/{id}/test` — Dispatch a test payload.
- `GET /api/webhooks/deliveries` — Review delivery log history.
