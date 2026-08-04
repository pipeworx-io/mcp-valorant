# mcp-valorant

VALORANT reference data MCP (valorant-api.com).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `list_agents` | VALORANT reference data (valorant-api.com) — list playable agents with their roles and abilities. Static game data, keyless. Optionally filter by role. |
| `get_agent` | VALORANT reference data (valorant-api.com) — full details for one agent by uuid: description, role, role description, and all abilities. Static game data, keyless. |
| `list_weapons` | VALORANT reference data (valorant-api.com) — list weapons with category, cost, fire-rate, and magazine size. Static game data, keyless. |
| `list_maps` | VALORANT reference data (valorant-api.com) — list maps with tactical description and icon. Static game data, keyless. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "valorant": {
      "url": "https://gateway.pipeworx.io/valorant/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Valorant data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
