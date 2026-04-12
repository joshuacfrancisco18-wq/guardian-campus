import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { descriptor } = await req.json();

    if (!descriptor || !Array.isArray(descriptor)) {
      return new Response(
        JSON.stringify({ success: false, error: "Face descriptor is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all face embeddings
    const { data: embeddings, error: fetchError } = await supabase
      .from("face_embeddings")
      .select("user_id, embedding");

    if (fetchError) throw fetchError;

    if (!embeddings || embeddings.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No registered faces found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find best match
    let bestMatch: { user_id: string; distance: number } | null = null;
    const THRESHOLD = 0.6;

    for (const emb of embeddings) {
      const stored = emb.embedding as number[];
      const distance = euclideanDistance(descriptor, stored);
      if (distance < THRESHOLD && (!bestMatch || distance < bestMatch.distance)) {
        bestMatch = { user_id: emb.user_id, distance };
      }
    }

    if (!bestMatch) {
      return new Response(
        JSON.stringify({ success: false, error: "Face not recognized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, status")
      .eq("user_id", bestMatch.user_id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ success: false, error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.status !== "active") {
      return new Response(
        JSON.stringify({ success: false, error: `Account is ${profile.status}` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magic link for direct login (bypassing password + OTP)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: profile.email,
    });

    if (linkError) throw linkError;

    // Prefer the hashed token returned by generateLink since verifyOtp expects token_hash
    const hashedToken = linkData?.properties?.hashed_token;
    const actionLink = linkData?.properties?.action_link;
    const parsedTokenHash = actionLink
      ? (() => {
          const url = new URL(actionLink);
          return url.searchParams.get("token_hash") || url.hash?.match(/token_hash=([^&]+)/)?.[1] || null;
        })()
      : null;
    const tokenHash = hashedToken || parsedTokenHash;

    if (!tokenHash) {
      throw new Error("Failed to generate login token");
    }

    const confidence = Math.max(0, Math.min(1, 1 - bestMatch.distance / THRESHOLD));

    // Log successful recognition
    await supabase.from("face_recognition_logs").insert({
      user_id: bestMatch.user_id,
      success: true,
      confidence,
      liveness_passed: true,
      anti_spoof_passed: true,
      metadata: { distance: bestMatch.distance, login_method: "face_direct" },
    });

    return new Response(
      JSON.stringify({
        success: true,
        full_name: profile.full_name,
        email: profile.email,
        token_hash: tokenHash,
        confidence,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("face-login error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
