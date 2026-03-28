import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EXT_URL = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const EXT_KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_KEY");

    if (!EXT_URL || !EXT_KEY) {
      throw new Error("Missing external database credentials");
    }

    const { action, table, params, id } = await req.json();

    const headers = {
      apikey: EXT_KEY,
      Authorization: `Bearer ${EXT_KEY}`,
      "Content-Type": "application/json",
      Prefer: "count=exact",
    };

    let url: string;
    const qp = new URLSearchParams();

    switch (action) {
      case "list": {
        url = `${EXT_URL}/rest/v1/${table}`;
        if (params?.select) qp.set("select", params.select);
        else qp.set("select", "*");
        if (params?.limit) qp.set("limit", String(params.limit));
        if (params?.offset) qp.set("offset", String(params.offset));
        if (params?.order) qp.set("order", params.order);
        if (params?.filters) {
          for (const [col, val] of Object.entries(params.filters)) {
            qp.set(col, val as string);
          }
        }
        break;
      }
      case "get": {
        url = `${EXT_URL}/rest/v1/${table}`;
        qp.set("select", params?.select || "*");
        qp.set("account_id", `eq.${id}`);
        qp.set("limit", "1");
        break;
      }
      case "stats": {
        // Returns aggregated stats for dashboard
        const results: Record<string, any> = {};

        // Total customers
        const totalRes = await fetch(`${EXT_URL}/rest/v1/telecomm_main?select=account_id&limit=1`, {
          headers: { ...headers, Prefer: "count=exact" },
        });
        const totalRange = totalRes.headers.get("content-range");
        results.totalCustomers = totalRange ? parseInt(totalRange.split("/")[1]) : 0;

        // Churn risk distribution
        const highRes = await fetch(`${EXT_URL}/rest/v1/telecomm_main?select=account_id&churn_risk_label=eq.HIGH&limit=1`, {
          headers: { ...headers, Prefer: "count=exact" },
        });
        results.highRisk = parseInt(highRes.headers.get("content-range")?.split("/")[1] || "0");

        const medRes = await fetch(`${EXT_URL}/rest/v1/telecomm_main?select=account_id&churn_risk_label=eq.MEDIUM&limit=1`, {
          headers: { ...headers, Prefer: "count=exact" },
        });
        results.mediumRisk = parseInt(medRes.headers.get("content-range")?.split("/")[1] || "0");

        const lowRes = await fetch(`${EXT_URL}/rest/v1/telecomm_main?select=account_id&churn_risk_label=eq.LOW&limit=1`, {
          headers: { ...headers, Prefer: "count=exact" },
        });
        results.lowRisk = parseInt(lowRes.headers.get("content-range")?.split("/")[1] || "0");

        // Plan type distribution
        for (const plan of ["Starter", "Pro", "Enterprise"]) {
          const pRes = await fetch(`${EXT_URL}/rest/v1/telecomm_main?select=account_id&plan_type=eq.${plan}&limit=1`, {
            headers: { ...headers, Prefer: "count=exact" },
          });
          results[`plan_${plan.toLowerCase()}`] = parseInt(pRes.headers.get("content-range")?.split("/")[1] || "0");
        }

        // Enterprise tier distribution
        for (const tier of ["SMB", "Mid-Market", "Enterprise"]) {
          const tRes = await fetch(`${EXT_URL}/rest/v1/telecomm_main?select=account_id&enterprise_tier=eq.${tier}&limit=1`, {
            headers: { ...headers, Prefer: "count=exact" },
          });
          results[`tier_${tier.toLowerCase().replace("-", "_")}`] = parseInt(tRes.headers.get("content-range")?.split("/")[1] || "0");
        }

        // Top 10 customers by MRR
        const topRes = await fetch(`${EXT_URL}/rest/v1/telecomm_main?select=account_id,email,mrr_usd,ltv_usd,churn_risk_label,plan_type,enterprise_tier&order=mrr_usd.desc.nullslast&limit=10`, {
          headers,
        });
        results.topCustomers = await topRes.json();

        // MRR stats
        const mrrRes = await fetch(`${EXT_URL}/rest/v1/telecomm_main?select=mrr_usd&order=mrr_usd.desc.nullslast&limit=5634`, {
          headers,
        });
        const mrrData = await mrrRes.json();
        const mrrValues = mrrData.map((r: any) => parseFloat(r.mrr_usd) || 0);
        results.totalMRR = mrrValues.reduce((a: number, b: number) => a + b, 0);
        results.avgMRR = results.totalMRR / (mrrValues.length || 1);

        // Recent audit actions count
        const auditRes = await fetch(`${EXT_URL}/rest/v1/agent_action_log?select=log_id&limit=1`, {
          headers: { ...headers, Prefer: "count=exact" },
        });
        results.totalAuditLogs = parseInt(auditRes.headers.get("content-range")?.split("/")[1] || "0");

        // Billing cycle distribution
        const monthlyRes = await fetch(`${EXT_URL}/rest/v1/telecomm_main?select=account_id&billing_cycle=eq.Monthly&limit=1`, {
          headers: { ...headers, Prefer: "count=exact" },
        });
        results.monthlyBilling = parseInt(monthlyRes.headers.get("content-range")?.split("/")[1] || "0");
        results.annualBilling = results.totalCustomers - results.monthlyBilling;

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const fullUrl = `${url}?${qp.toString()}`;
    const dataRes = await fetch(fullUrl, { headers });

    if (!dataRes.ok) {
      const err = await dataRes.text();
      throw new Error(`Query failed: ${err}`);
    }

    const data = await dataRes.json();
    const contentRange = dataRes.headers.get("content-range");
    const total = contentRange ? parseInt(contentRange.split("/")[1]) : data.length;

    return new Response(JSON.stringify({ data, total }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("data-proxy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
