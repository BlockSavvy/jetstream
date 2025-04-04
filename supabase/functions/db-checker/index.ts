// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// This is a Supabase Edge Function
// https://supabase.com/docs/guides/functions

// @deno-types tells TypeScript that Deno exists in this file
// @ts-ignore
// @deno-types="https://deno.land/x/types/index.d.ts"

// Import the serve function from Deno std library
// @ts-ignore: Import is resolved by Deno
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

console.log("Hello from Functions!")

// Use serve from Deno's standard library
serve(async (req: Request) => {
  try {
    const { name } = await req.json();
    const data = {
      message: `Hello ${name}!`,
    };

    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/db-checker' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
