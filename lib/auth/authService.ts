import { createClient } from "../../utils/supabase/server";
import {
  hasPermission,
  type Permission,
  type UserRole,
} from "./permissions";

export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, nama, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return profile;
}

export async function requirePermission(permission: Permission) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return null;
  }

  const role = profile.role as UserRole;

  if (!hasPermission(role, permission)) {
    return null;
  }

  return profile;
}