const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("./supabaseAdmin");

async function getUserFromHeader(req) {
  if (!supabaseAdmin) return null;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch (e) {
    return null;
  }
}

router.post("/api/usage/record", async (req, res) => {
  try {
    const user = await getUserFromHeader(req);
    const { email, minutesToAdd } = req.body || {};

    const targetEmail = (user?.email || email || "").trim().toLowerCase();
    const minutes = parseFloat(minutesToAdd);

    if (!targetEmail || isNaN(minutes) || minutes <= 0) {
      return res.status(400).json({ error: "Valid email and positive minutesToAdd are required" });
    }

    if (!supabaseAdmin) {
      return res.status(200).json({ success: true, warning: "Admin DB not connected" });
    }

    const { data: existing } = await supabaseAdmin
      .from("account_usage_audit")
      .select("minutes_used")
      .eq("email", targetEmail)
      .maybeSingle();

    const currentMinutes = existing?.minutes_used || 0;
    const updatedMinutes = Math.round((currentMinutes + minutes) * 10) / 10;

    await supabaseAdmin
      .from("account_usage_audit")
      .upsert({
        email: targetEmail,
        minutes_used: updatedMinutes,
        updated_at: new Date().toISOString()
      }, { onConflict: "email" });

    return res.status(200).json({ success: true, minutes_used: updatedMinutes });
  } catch (err) {
    console.error("Usage record error:", err);
    return res.status(500).json({ error: "Failed to record usage" });
  }
});

module.exports = router;
