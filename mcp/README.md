# BCOS Platform — Model Context Protocol (MCP) Server

The **BCOS MCP Server** connects the Business Context Operating System directly to AI Agents and IDEs including **Claude Desktop**, **Cursor**, **Windsurf**, and custom LLM agents via standard stdio transport.

---

## 🛠️ Complete MCP Tool Set (9 Tools)

1. **`route_bcos_query(query, max_modules=5)`**
   - Routes natural language business queries to primary and supporting BCOS modules with relevance scoring.

2. **`get_bcos_module(module_slug, include_principles=True, include_rules=True)`**
   - Retrieves full content, purpose, principles, rules, decision trees, and cross-references for a module.

3. **`compile_bcos_context(query, module_slugs=[], format="markdown")`**
   - Compiles unified, prompt-optimized Markdown or JSON context packages for LLM consumption.

4. **`search_bcos_knowledge(query, limit=5)`**
   - Semantic keyword and concept search across all knowledge modules.

5. **`list_bcos_departments()`**
   - Lists all 64+ business departments with module counts.

6. **`get_bcos_decision_tree(module_slug, tree_name=None)`**
   - Retrieves IF / THEN / OTHERWISE decision frameworks.

7. **`get_bcos_principles(module_slug=None, limit=10)`**
   - Retrieves key business principles.

8. **`get_bcos_rules(module_slug=None, rule_type=None)`**
   - Retrieves color-coded rules (`Always`, `Never`, `Avoid`, `Prefer`).

9. **`get_bcos_statistics()`**
   - Returns metrics on total modules, principles, rules, decision trees, and cross-references.

---

## 📦 MCP Resource

- **`bcos://knowledge`**
  - Full knowledge base JSON catalog containing details for all 249+ modules and 64+ departments.

---

## 🚀 Claude Desktop Configuration Setup

Add the following to your Claude Desktop configuration file (`claude_desktop_config.json`):

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bcos-platform": {
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

---

## 🧪 Testing the Server

Run standalone test mode:

```bash
python mcp/server.py --test
```
