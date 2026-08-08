# BCOS Platform — MCP Integration Guide

This guide documents connecting the **BCOS Model Context Protocol (MCP) Server** to **Claude Desktop**, **Cursor IDE**, **Windsurf**, **n8n**, and custom AI agent SDKs.

---

## 🛠️ MCP Tools Overview (All 9 Tools)

| Tool Name | Parameters | Description |
|-----------|------------|-------------|
| `route_bcos_query` | `query` (str), `max_modules` (int) | Routes natural language query to primary + secondary BCOS modules |
| `get_bcos_module` | `module_slug` (str), `include_principles` (bool), `include_rules` (bool) | Fetches complete module markdown content, purpose, principles, & rules |
| `compile_bcos_context` | `query` (str), `module_slugs` (list), `format` ("markdown"/"json") | Compiles unified, prompt-optimized context package for LLM prompts |
| `search_bcos_knowledge` | `query` (str), `limit` (int) | Semantic keyword & concept search across knowledge embeddings |
| `list_bcos_departments` | None | Lists all 64+ departments with module counts |
| `get_bcos_decision_tree` | `module_slug` (str), `tree_name` (str) | Fetches IF / THEN / OTHERWISE decision framework trees |
| `get_bcos_principles` | `module_slug` (str), `limit` (int) | Extracts business principles with optional filters |
| `get_bcos_rules` | `module_slug` (str), `rule_type` (str) | Fetches color-coded rules (`Always`, `Never`, `Avoid`, `Prefer`) |
| `get_bcos_statistics` | None | Returns total system counts for modules, principles, rules, and trees |

---

## 📦 MCP Resource

- **URI:** `bcos://knowledge`
- **MIME Type:** `application/json`
- **Description:** Complete structured knowledge base catalog stream.

---

## 💻 Integration Setup Guides

### 1. Claude Desktop Setup

Open your Claude Desktop config file:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the following:

```json
{
  "mcpServers": {
    "bcos": {
      "command": "python",
      "args": [
        "C:/Users/thesa/OneDrive/Documents/ideation_files, pre_builds/BCOS/mcp/server.py"
      ],
      "env": {
        "PYTHONPATH": "C:/Users/thesa/OneDrive/Documents/ideation_files, pre_builds/BCOS/backend"
      }
    }
  }
}
```

### 2. Cursor IDE Integration

Navigate to **Cursor Settings** -> **Features** -> **MCP Servers** -> **Add New MCP Server**:
- **Name:** `bcos`
- **Type:** `command`
- **Command:** `python C:/Users/thesa/OneDrive/Documents/ideation_files, pre_builds/BCOS/mcp/server.py`

---

## 🧪 Verification & Health Check

Test stdio initialization:

```bash
python mcp/server.py --test
```
