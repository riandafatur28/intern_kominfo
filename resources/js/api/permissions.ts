import client from "./client";

/** A single permission (PermissionResource). */
export interface Permission {
    id: number;
    name: string;
}

interface ListResponse {
    success: boolean;
    data: Permission[];
}

/** GET /admin/permissions — master list of all available permissions. */
export async function listPermissions(): Promise<Permission[]> {
    const res = await client.get<ListResponse>("/admin/permissions");
    return res.data.data;
}
