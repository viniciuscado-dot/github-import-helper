import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function cors(res: Response) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  h.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
  return new Response(res.body, { status: res.status, headers: h });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return cors(new Response(null, { status: 204 }));
  }

  try {
    // Verify caller is authenticated and is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return cors(new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 }));
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return cors(new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 }));
    }

    // Check caller role via profiles table
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!callerProfile || !['admin', 'workspace_admin'].includes(callerProfile.role)) {
      return cors(new Response(JSON.stringify({ error: "Acesso negado - apenas admins podem criar usuários" }), { status: 403 }));
    }
    
    let body;
    try {
      body = await req.json();
    } catch {
      return cors(new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 }));
    }
    
    const { email, password, profile } = body;
    
    if (!email || !password) {
      return cors(new Response(JSON.stringify({ error: "email e password são obrigatórios" }), { status: 400 }));
    }

    // Create the auth user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) {
      const msg = (createErr.message || "").toLowerCase();
      if (msg.includes("already exist") || msg.includes("user already exists") || (createErr as any).status === 422) {
        return cors(new Response(JSON.stringify({ 
          error: "EMAIL_ALREADY_EXISTS", 
          message: "Este email já está cadastrado no sistema" 
        }), { status: 400 }));
      }
      return cors(new Response(JSON.stringify({ error: createErr.message }), { status: 400 }));
    }

    const userId = created?.user?.id;

    // Update the profile (auto-created by trigger) with additional fields
    if (userId && profile) {
      const profileUpdates: Record<string, unknown> = {};
      if (profile.name) profileUpdates.name = profile.name;
      if (profile.role) profileUpdates.role = profile.role;
      if (profile.department) profileUpdates.department = profile.department;
      if (profile.phone) profileUpdates.phone = profile.phone;
      if (profile.group_name) profileUpdates.group_name = profile.group_name;

      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId);

      if (updateErr) {
        console.error("profiles update error:", updateErr);
      }
    }

    return cors(
      new Response(
        JSON.stringify({ ok: true, user_id: userId, message: "Usuário criado com sucesso" }),
        { status: 200 },
      ),
    );
  } catch (e) {
    console.error("create-user exception:", e);
    return cors(new Response(JSON.stringify({ error: "internal_error", details: String(e) }), { status: 500 }));
  }
});
