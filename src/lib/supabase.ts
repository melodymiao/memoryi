import { createClient } from "@supabase/supabase-js"

// Values come from .env (see .env.example); Vite only exposes vars
// prefixed VITE_ to client code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars are missing — copy .env.example to .env and fill in your project's URL/anon key.",
  )
}

// No `Database` generic here on purpose — see src/types/database.ts for why
// (no CLI-generated types yet). Query functions in src/data/ type their own
// results instead.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
