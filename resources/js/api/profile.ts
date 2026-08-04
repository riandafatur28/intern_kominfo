import client from "./client";
import type { UserPayload } from "./auth";

interface ProfileResponse {
  success: boolean;
  message?: string;
  data: UserPayload;
}

interface SignatureResponse {
  success: boolean;
  message: string;
  data: {
    signature_path: string;
    signature_url: string;
  };
}

export async function fetchProfile(): Promise<UserPayload> {
  const res = await client.get<ProfileResponse>("/profile");
  return res.data.data;
}

export async function updateProfile(data: {
  phone?: string;
  position?: string;
  rank?: string;
}): Promise<UserPayload> {
  const res = await client.put<ProfileResponse>("/profile", data);
  return res.data.data;
}

export async function uploadSignature(file: File): Promise<SignatureResponse["data"]> {
  const form = new FormData();
  form.append("signature", file);
  const res = await client.post<SignatureResponse>("/profile/signature", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function deleteSignature(): Promise<SignatureResponse["data"]> {
  const res = await client.delete<SignatureResponse>("/profile/signature");
  return res.data.data;
}
