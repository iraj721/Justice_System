import type { UserRole } from "../../app/roleConfig";
import { apiRequest } from "./apiClient";

const TOKEN_KEY = "justice_token";
const ROLE_KEY = "justice_role";
const USER_KEY = "justice_user";

export type AuthPayload = {
  access_token: string;
  token_type: string;
  role: UserRole;
  full_name: string;
  email: string;
};

export type RegisterInput = {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  onboarding_code?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  district?: string;
};

export async function register(input: RegisterInput): Promise<AuthPayload> {
  const data = await apiRequest<AuthPayload>("/auth/register", {
    method: "POST",
    body: input,
  });
  saveSession(data);
  return data;
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  const data = await apiRequest<AuthPayload>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  saveSession(data);
  return data;
}

export function saveSession(data: AuthPayload): void {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(ROLE_KEY, data.role);
  localStorage.setItem(USER_KEY, JSON.stringify({ full_name: data.full_name, email: data.email }));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): UserRole | null {
  return localStorage.getItem(ROLE_KEY) as UserRole | null;
}

export function getUser(): { full_name: string; email: string } | null {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}