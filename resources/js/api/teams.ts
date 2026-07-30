import client from "./client";

/** Flat team record used for dropdown options (TeamResource). */
export interface Team {
    id: number;
    name: string;
    leader_id: number | null;
    field_id: number | null;
}

interface ListResponse {
    success: boolean;
    data: Team[];
}

/**
 * GET /teams — list teams for dropdown options.
 * Optionally filter by field via `fieldId`.
 */
export async function listTeams(fieldId?: number): Promise<Team[]> {
    const res = await client.get<ListResponse>("/teams", {
        params: fieldId != null ? { field_id: fieldId } : undefined,
    });
    return res.data.data;
}
