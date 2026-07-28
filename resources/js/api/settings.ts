import client from "./client";

/**
 * Settings are returned as a flat key -> value map.
 * Values are JSON-decoded by the backend when possible (numbers, booleans, arrays).
 */
export type SettingsMap = Record<string, unknown>;

export interface UpdatedSetting {
    key: string;
    value: unknown;
}

/**
 * NOTE: the Settings endpoints do NOT wrap responses with a `success` flag
 * (unlike Users/Roles). They only return `{ data: ... }`.
 */
interface SettingsResponse {
    data: SettingsMap;
}

interface UpdateSettingResponse {
    data: UpdatedSetting;
}

/** GET /admin/settings — all settings as a { key: value } object. */
export async function getSettings(): Promise<SettingsMap> {
    const res = await client.get<SettingsResponse>("/admin/settings");
    return res.data.data;
}

/**
 * PUT /admin/settings/{key} — update a single existing setting.
 * The key must already exist, otherwise the backend responds 422.
 */
export async function updateSetting(key: string, value: unknown): Promise<UpdatedSetting> {
    const res = await client.put<UpdateSettingResponse>(
        `/admin/settings/${encodeURIComponent(key)}`,
        { value }
    );
    return res.data.data;
}
