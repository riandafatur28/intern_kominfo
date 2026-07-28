import client from "./client";

/** A role with its currently assigned permissions (RoleResource). */
export interface Role {
    id: number;
    name: string;
    /** Permission names assigned to this role. */
    permissions: string[];
}

interface ListResponse {
    success: boolean;
    data: Role[];
}

interface SingleResponse {
    success: boolean;
    message?: string;
    data: Role;
}

/** GET /admin/roles — all roles with their permissions. */
export async function listRoles(): Promise<Role[]> {
    const res = await client.get<ListResponse>("/admin/roles");
    return res.data.data;
}

/**
 * PUT /admin/roles/{id}/permissions — replace the full permission set for a role.
 * Send ALL permission names that should remain checked (sync/overwrite, not append).
 *
 * Backend guard: role "admin" cannot lose the critical permissions
 * role.manage, permission.manage, user.manage → responds 422 if attempted.
 */
export async function updateRolePermissions(id: number, permissions: string[]): Promise<Role> {
    const res = await client.put<SingleResponse>(`/admin/roles/${id}/permissions`, {
        permissions,
    });
    return res.data.data;
}
