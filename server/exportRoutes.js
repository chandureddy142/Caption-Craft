const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { supabaseAdmin } = require("./supabaseAdmin");

const EXPORT_SECRET = process.env.EXPORT_TOKEN_SECRET || "cc-export-secret-key-prod";
const PAID_PLANS = ["creator_lite", "creator_pro", "weekly_pro", "studio_max"];

router.post("/api/export/authorize", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(200).json({ allowWatermarkFree: false, plan: "starter" });
    }

    const token = authHeader.split(" ")[1];
    if (!supabaseAdmin) {
      return res.status(200).json({ allowWatermarkFree: false, plan: "starter" });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(200).json({ allowWatermarkFree: false, plan: "starter" });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    const currentPlan = profile?.plan || "starter";
    const isActive = profile?.subscription_status === "active";
    const isPaid = isActive && PAID_PLANS.includes(currentPlan);

    const timestamp = Date.now();
    const payload = `${user.id}:${currentPlan}:${timestamp}`;
    const signature = crypto.createHmac("sha256", EXPORT_SECRET).update(payload).digest("hex");

    return res.status(200).json({
      allowWatermarkFree: isPaid,
      plan: currentPlan,
      timestamp,
      signature
    });
  } catch (err) {
    console.error("Export authorization error:", err);
    return res.status(200).json({ allowWatermarkFree: false, plan: "starter" });
  }
});

module.exports = router;
