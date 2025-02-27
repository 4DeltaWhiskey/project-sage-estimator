
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, pat } = await req.json();

    if (!userId || !pat) {
      return new Response(
        JSON.stringify({ error: "UserId and PAT are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user exists
    const { data: userExists, error: userError } = await supabase
      .from("user_azure_settings")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (userError) {
      return new Response(
        JSON.stringify({ error: "Error checking user: " + userError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Encrypt PAT using a simple encryption method
    // In a production environment, use a more secure encryption method
    const encryptedPat = btoa(pat); // Base64 encoding for simplicity

    // Store the encrypted PAT
    if (userExists) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("user_azure_settings")
        .update({ encrypted_pat: encryptedPat })
        .eq("user_id", userId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Error updating PAT: " + updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("user_azure_settings")
        .insert({ user_id: userId, encrypted_pat: encryptedPat });

      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Error storing PAT: " + insertError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal error: " + error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
