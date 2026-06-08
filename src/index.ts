interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * VALORANT reference data MCP (valorant-api.com).
 *
 * Static game reference data — agents, weapons, maps. Keyless.
 * NOT player stats; this is game catalog/reference data.
 */


const BASE = 'https://valorant-api.com/v1';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'list_agents',
    description:
      'VALORANT reference data (valorant-api.com) — list playable agents with their roles and abilities. Static game data, keyless. Optionally filter by role.',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'Optional role filter (case-insensitive), e.g. "Duelist", "Controller", "Initiator", "Sentinel".',
        },
      },
    },
  },
  {
    name: 'get_agent',
    description:
      'VALORANT reference data (valorant-api.com) — full details for one agent by uuid: description, role, role description, and all abilities. Static game data, keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        uuid: { type: 'string', description: 'Agent uuid (from list_agents).' },
      },
      required: ['uuid'],
    },
  },
  {
    name: 'list_weapons',
    description:
      'VALORANT reference data (valorant-api.com) — list weapons with category, cost, fire-rate, and magazine size. Static game data, keyless.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_maps',
    description:
      'VALORANT reference data (valorant-api.com) — list maps with tactical description and icon. Static game data, keyless.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

interface Ability {
  slot?: string | null;
  displayName?: string | null;
  description?: string | null;
}

interface Role {
  uuid?: string | null;
  displayName?: string | null;
  description?: string | null;
}

interface Agent {
  uuid?: string | null;
  displayName?: string | null;
  description?: string | null;
  role?: Role | null;
  abilities?: Ability[] | null;
  displayIcon?: string | null;
  fullPortrait?: string | null;
}

interface Weapon {
  uuid?: string | null;
  displayName?: string | null;
  category?: string | null;
  shopData?: { cost?: number | null } | null;
  weaponStats?: { fireRate?: number | null; magazineSize?: number | null } | null;
}

interface ValMap {
  uuid?: string | null;
  displayName?: string | null;
  tacticalDescription?: string | null;
  displayIcon?: string | null;
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'list_agents':
        return await listAgents(args);
      case 'get_agent':
        return await getAgent(args);
      case 'list_weapons':
        return await listWeapons();
      case 'list_maps':
        return await listMaps();
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

async function listAgents(args: Record<string, unknown>): Promise<unknown> {
  const data = (await valGet('/agents?isPlayableCharacter=true')) as Agent[];
  const list = Array.isArray(data) ? data : [];
  const roleFilter = typeof args.role === 'string' ? args.role.trim().toLowerCase() : '';
  const filtered = roleFilter
    ? list.filter((a) => (a?.role?.displayName ?? '').toLowerCase() === roleFilter)
    : list;
  const agents = filtered.map((a) => ({
    uuid: a?.uuid ?? null,
    name: a?.displayName ?? null,
    role: a?.role?.displayName ?? null,
    abilities: (Array.isArray(a?.abilities) ? a!.abilities! : []).map((ab) => ({
      slot: ab?.slot ?? null,
      name: ab?.displayName ?? null,
    })),
    icon: a?.displayIcon ?? null,
  }));
  return { count: agents.length, agents };
}

async function getAgent(args: Record<string, unknown>): Promise<unknown> {
  const uuid = typeof args.uuid === 'string' ? args.uuid.trim() : '';
  if (!uuid) return { error: 'Required argument "uuid" is missing.', uuid };
  try {
    const a = (await valGet(`/agents/${encodeURIComponent(uuid)}`)) as Agent;
    if (!a || typeof a !== 'object') return { error: 'agent not found', uuid };
    return {
      uuid: a.uuid ?? uuid,
      name: a.displayName ?? null,
      description: a.description ?? null,
      role: a.role?.displayName ?? null,
      role_description: a.role?.description ?? null,
      abilities: (Array.isArray(a.abilities) ? a.abilities : []).map((ab) => ({
        slot: ab?.slot ?? null,
        name: ab?.displayName ?? null,
        description: ab?.description ?? null,
      })),
      portrait: a.fullPortrait ?? null,
    };
  } catch {
    return { error: 'agent not found', uuid };
  }
}

async function listWeapons(): Promise<unknown> {
  const data = (await valGet('/weapons')) as Weapon[];
  const list = Array.isArray(data) ? data : [];
  const weapons = list.map((w) => ({
    uuid: w?.uuid ?? null,
    name: w?.displayName ?? null,
    category: (w?.category ?? '').replace(/^EEquippableCategory::/, '') || null,
    cost: w?.shopData?.cost ?? null,
    fire_rate: w?.weaponStats?.fireRate ?? null,
    magazine: w?.weaponStats?.magazineSize ?? null,
  }));
  return { count: weapons.length, weapons };
}

async function listMaps(): Promise<unknown> {
  const data = (await valGet('/maps')) as ValMap[];
  const list = Array.isArray(data) ? data : [];
  const maps = list
    .filter((m) => m && m.displayName != null && m.displayName !== '')
    .map((m) => ({
      uuid: m.uuid ?? null,
      name: m.displayName ?? null,
      description: m.tacticalDescription ?? null,
      icon: m.displayIcon ?? null,
    }));
  return { count: maps.length, maps };
}

async function valGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) {
    const body = await res.text().then((t) => t.slice(0, 200)).catch(() => '');
    throw new Error(`valorant-api: ${res.status} ${body}`);
  }
  const json = (await res.json()) as { status?: number; data?: unknown };
  return json?.data;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
