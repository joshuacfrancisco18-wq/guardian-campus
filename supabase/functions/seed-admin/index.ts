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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "admin@system.local")
      .single();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ success: false, message: "Default admin already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@system.local",
      password: "Admin@SecureClass2024",
      email_confirm: true,
      user_metadata: { full_name: "System Administrator" },
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // Update profile
    await supabase.from("profiles").update({
      full_name: "System Administrator",
      status: "active",
      force_password_change: true,
      otp_enabled: false,
    }).eq("user_id", userId);

    // Assign admin role
    await supabase.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Default admin created",
        credentials: {
          email: "admin@system.local",
          password: "Admin@SecureClass2024",
          note: "Must change password on first login",
        },
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
