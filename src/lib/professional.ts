import { supabase } from "./supabase";

export async function getCurrentProfessionalId(): Promise<string | number | null> {
  const { data: authData } = await supabase.auth.getUser();
  const email = authData.user?.email;
  if (!email) return null;

  const { data, error } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}
