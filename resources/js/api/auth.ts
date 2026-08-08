import client from "./client";

export interface UserPayload {
  id: number;
  name: string;
  nip: string;
  email: string;
  rank: string | null;
  position: string | null;
  phone: string | null;
  signature_path: string | null;
  signature_url: string | null;
  must_change_password: boolean;
  is_active: boolean;
  roles: string[];
  permissions: string[];
  team?: {
    id: number;
    name: string;
    leader?: { id: number; name: string };
    field?: { id: number; name: string };
  } | null;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: UserPayload;
  };
}

interface MeResponse {
  success: boolean;
  data: UserPayload;
}

export async function login(email: string, password: string): Promise<LoginResponse["data"]> {
  const res = await client.post<LoginResponse>("/auth/login", { email, password });
  return res.data.data;
}

export async function fetchMe(): Promise<UserPayload> {
  const res = await client.get<MeResponse>("/auth/me");
  return res.data.data;
}

export async function logout(): Promise<void> {
  await client.post("/auth/logout");
}

export async function forgotPassword(email: string): Promise<string> {
  const res = await client.post<{ success: boolean; message: string }>(
    "/auth/forgot-password",
    { email }
  );
  return res.data.message;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  newPasswordConfirmation: string
): Promise<void> {
  await client.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
    new_password_confirmation: newPasswordConfirmation,
  });
}
