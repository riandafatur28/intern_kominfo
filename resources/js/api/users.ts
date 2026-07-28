import client from "./client";

/**
 * Nested team info as returned inside a UserResource.
 * NOTE: backend UserResource only includes id, name, and (optionally) field.
 * `leader` is not returned by the user endpoints — kept optional for safety.
 */
export interface UserTeam {
    id: number;
    name: string;
    leader?: { id: number; name: string };
    field?: { id: number; name: string };
}

/** Shape of a user as returned by /admin/users endpoints (UserResource). */
export interface UserResource {
    id: number;
    name: string;
    nip: string;
    email: string;
    rank: string | null;
    position: string | null;
    phone: string | null;
    is_active: boolean;
    signature_path: string | null;
    roles: string[];
    /** Only present on detail/create/update responses, not on the list. */
    direct_permissions?: string[];
    created_at: string | null;
    team?: UserTeam | null;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    total: number;
}

export interface UserListResult {
    data: UserResource[];
    meta: PaginationMeta;
}

/** Payload for creating a user. `roles` MUST be an array (not `role`). */
export interface CreateUserPayload {
    name: string;
    nip: string;
    email: string;
    roles: string[];
    team_id?: number | null;
    rank?: string | null;
    position?: string | null;
    phone?: string | null;
    /** Optional. If omitted, backend injects a default password from Settings. */
    password?: string;
    /** Optional direct permissions (overrides role defaults). */
    permissions?: string[];
}

/** Payload for updating a user. All fields optional (partial update). */
export interface UpdateUserPayload {
    name?: string;
    nip?: string;
    email?: string;
    roles?: string[];
    team_id?: number | null;
    rank?: string | null;
    position?: string | null;
    phone?: string | null;
    permissions?: string[];
    is_active?: boolean;
}

/** One row of the import result. */
/**
 * Summary returned by the import endpoint.
 * Mirrors the backend UserImport::$results shape (not the OpenAPI example).
 */
export interface ImportSummary {
    imported: number;
    skipped: number;
    errors: string[];
}

interface ListResponse {
    success: boolean;
    data: UserResource[];
    meta: PaginationMeta;
}

interface SingleResponse {
    success: boolean;
    message?: string;
    data: UserResource;
}

interface ImportResponse {
    success: boolean;
    message: string;
    data: ImportSummary;
}

/** GET /admin/users — paginated list. `page` selects the page (Laravel reads it from the query). */
export async function listUsers(page = 1, perPage = 15): Promise<UserListResult> {
    const res = await client.get<ListResponse>("/admin/users", {
        params: { page, per_page: perPage },
    });
    return { data: res.data.data, meta: res.data.meta };
}

/** GET /admin/users/{id} — single user detail. */
export async function getUser(id: number): Promise<UserResource> {
    const res = await client.get<SingleResponse>(`/admin/users/${id}`);
    return res.data.data;
}

/** POST /admin/users — create a user. */
export async function createUser(payload: CreateUserPayload): Promise<UserResource> {
    const res = await client.post<SingleResponse>("/admin/users", payload);
    return res.data.data;
}

/** PUT /admin/users/{id} — update a user. */
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<UserResource> {
    const res = await client.put<SingleResponse>(`/admin/users/${id}`, payload);
    return res.data.data;
}

/** DELETE /admin/users/{id} — delete a user. */
export async function deleteUser(id: number): Promise<void> {
    await client.delete(`/admin/users/${id}`);
}

/** POST /admin/users/import — import users from an Excel/CSV file. */
export async function importUsers(file: File): Promise<ImportSummary> {
    const form = new FormData();
    form.append("file", file);
    const res = await client.post<ImportResponse>("/admin/users/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
}
