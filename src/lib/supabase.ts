import { createClient } from "@supabase/supabase-js"

// Schema isn't defined yet (that's step 2) — this just wires up the client
// so it's ready to use once tables exist. Values come from .env.local
// (see .env.example); Vite only exposes vars prefixed VITE_ to client code.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars are missing — copy .env.example to .env.local and fill in your project's URL/anon key.",
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
