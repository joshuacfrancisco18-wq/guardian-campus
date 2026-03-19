import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, purpose = "login" } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Generate 6-digit OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString(); // 60 seconds

    // Get user_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .single();

    // Store OTP in otp_logs
    await supabase.from("otp_logs").insert({
      email,
      otp_code: otpCode,
      expires_at: expiresAt,
      purpose,
      user_id: profile?.user_id || null,
      verified: false,
    });

    // TODO: Send email via SMTP/email service
    // For now, log the OTP (in production, integrate email service)
    console.log(`OTP for ${email}: ${otpCode} (expires: ${expiresAt})`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent successfully",
        expires_in: 60,
        // Remove in production - only for development:
        dev_otp: otpCode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
