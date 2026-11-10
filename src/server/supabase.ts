import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env, persistenceEnabled } from "./env";

/**
 * Cliente de Supabase con la sesión del usuario (cookies). Usa la anon key:
 * los permisos los decide RLS. La service_role key NO se usa en la app.
 */
export async function getSupabase() {
  if (!persistenceEnabled) return null;
  const store = await cookies();
  return createServerClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // En Server Components no se pueden escribir cookies; lo resuelve proxy.ts.
        }
      },
    },
  });
}
