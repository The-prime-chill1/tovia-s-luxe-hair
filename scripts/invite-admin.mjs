import { createClient } from "@supabase/supabase-js";

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_EMAILS", "ADMIN_REDIRECT_URL"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) throw new Error(`Missing required variables: ${missing.join(", ")}`);

const supabase = createClient(process.env.SUPABASE_URL.replace(/\/$/, ""), process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const emails = process.env.ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);

for (const email of emails) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo: process.env.ADMIN_REDIRECT_URL });
  if (error) throw new Error(`Could not invite ${email}: ${error.message}`);
  const { error: roleError } = await supabase.auth.admin.updateUserById(data.user.id, {
    app_metadata: { ...data.user.app_metadata, role: "admin" },
  });
  if (roleError) throw new Error(`Invitation sent to ${email}, but the admin role could not be assigned: ${roleError.message}`);
  console.log(`Admin invitation sent to ${data.user.email}.`);
}
