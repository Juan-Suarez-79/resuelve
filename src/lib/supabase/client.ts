import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        console.error("❌ Supabase URL or Anon Key is missing! Make sure to add them to .env.local and RESTART the server.")
        // Return a dummy client or throw to prevent 'undefined' crash deep in the library
        // For now, let's try to return a client with empty strings to avoid immediate crash, 
        // but it will fail on requests.
        return createBrowserClient(url || "", key || "")
    }

    return createBrowserClient(url, key)
}

