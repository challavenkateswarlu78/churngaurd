import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCHEMA_CONTEXT = `
You have access to a PostgreSQL database via PostgREST API. You must output a JSON object describing the query.

TABLES AND COLUMNS:

TABLE: customer_details
- account_id (text, PK)
- subscription_months (text)
- voice_calling_addon (text) — "Yes"/"No"
- multi_workspace_addon (text) — "Yes"/"No"/"Not Applicable"
- plan_type (text) — "Starter", "Pro", "Enterprise", etc.
- sso_enabled (text) — "Yes"/"No"
- auto_backup_enabled (text) — "Yes"/"No"
- endpoint_security_enabled (text) — "Yes"/"No"
- priority_support_enabled (text) — "Yes"/"No"
- live_collab_enabled (text) — "Yes"/"No"
- media_vault_enabled (text) — "Yes"/"No"
- billing_cycle (text) — "Monthly"/"Annual"
- e_invoicing_enabled (text) — "Yes"/"No"
- payment_method (text)
- mrr_usd (numeric) — monthly recurring revenue
- ltv_usd (numeric) — lifetime value
- churned (boolean)
- subscription_group (text)
- is_first_year (boolean)
- is_very_new (boolean)
- is_long_term (boolean)
- is_contract_end (boolean)
- avg_monthly_revenue (numeric)
- mrr_to_ltv_ratio (numeric)
- charge_increase_flag (boolean)
- ltv_projection (numeric)
- price_to_tenure_ratio (numeric)
- billing_efficiency (numeric)
- mrr_tier (text)
- num_addons (integer)
- addon_adoption_rate (numeric)
- has_security_bundle (boolean)
- has_collab_bundle (boolean)
- has_backup_support (boolean)
- is_pro_plan (boolean)
- is_free_plan (boolean)
- is_starter_plan (boolean)
- has_crm_or_sub (boolean)
- billing_risk (integer)
- is_monthly_billing (boolean)
- payment_risk_score (integer)
- is_electronic_check (boolean)
- is_enterprise (boolean)
- high_cost_new_account (boolean)
- pro_monthly_risk (boolean)
- longterm_no_security (boolean)
- engagement_score (numeric)
- churn_risk_score (numeric)

TABLE: telecomm_main
- account_id (text)
- email (text)
- enterprise_tier (text) — "SMB", "Enterprise", "Mid-Market"
- has_crm_integration (text) — "Yes"/"No"
- has_sub_accounts (text) — "Yes"/"No"
- subscription_months (integer)
- voice_calling_addon (text) — "Yes"/"No"
- multi_workspace_addon (text) — "Yes"/"No"
- plan_type (text)
- sso_enabled (text)
- auto_backup_enabled (text)
- endpoint_security_enabled (text)
- priority_support_enabled (text)
- live_collab_enabled (text)
- media_vault_enabled (text)
- billing_cycle (text)
- e_invoicing_enabled (text)
- payment_method (text)
- mrr_usd (numeric) — monthly recurring revenue
- ltv_usd (numeric) — lifetime value
- churn_probability (numeric) — 0 to 1
- churn_risk_label (text) — "LOW", "MEDIUM", "HIGH"
- model_threshold (numeric)
- is_processed (boolean)

OUTPUT FORMAT — Return ONLY a JSON object with this structure:
{
  "table": "customer_details" or "telecomm_main",
  "select": "col1,col2" or "*",
  "filters": [
    {"column": "col_name", "operator": "eq|neq|gt|gte|lt|lte|like|ilike|is|in", "value": "..."}
  ],
  "order": {"column": "col_name", "ascending": true/false} (optional),
  "limit": number (optional, default 100)
}

OPERATOR REFERENCE:
- eq: equals
- neq: not equals  
- gt: greater than
- gte: greater than or equal
- lt: less than
- lte: less than or equal
- like: pattern match (use % wildcard)
- ilike: case-insensitive pattern match
- is: for null/boolean checks (use "true", "false", "null")
- in: for multiple values, value should be "(val1,val2,val3)"

RULES:
- Only output the JSON object, nothing else. No markdown.
- For boolean columns, use is operator with "true" or "false".
- For text comparisons use exact casing as shown in schema.
- If the question can't be answered from these tables, return: {"error": "Cannot answer this question from available data."}
- Default limit to 50 unless the user asks for a specific count or all records.
- For "top N" questions, set limit to N and appropriate order.
- For counting questions, select the relevant column and I'll count results.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    if (!question) {
      return new Response(JSON.stringify({ error: "No question provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const EXT_URL = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const EXT_KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_KEY");

    if (!LOVABLE_API_KEY || !EXT_URL || !EXT_KEY) {
      throw new Error("Missing required environment variables");
    }

    // Step 1: Generate PostgREST query spec from natural language
    const querySpecResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SCHEMA_CONTEXT },
          { role: "user", content: question },
        ],
      }),
    });

    if (!querySpecResponse.ok) {
      if (querySpecResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (querySpecResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to generate query");
    }

    const specData = await querySpecResponse.json();
    let specText = specData.choices?.[0]?.message?.content?.trim() || "";
    
    // Clean markdown formatting
    specText = specText.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
    console.log("Generated query spec:", specText);

    let querySpec: any;
    try {
      querySpec = JSON.parse(specText);
    } catch {
      throw new Error("AI generated invalid query specification");
    }

    if (querySpec.error) {
      return new Response(JSON.stringify({ answer: querySpec.error, sql: null, data: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Build PostgREST URL from spec
    const table = querySpec.table;
    const select = querySpec.select || "*";
    const limit = querySpec.limit || 100;
    
    const params = new URLSearchParams();
    params.set("select", select);
    params.set("limit", String(limit));

    if (querySpec.filters && Array.isArray(querySpec.filters)) {
      for (const f of querySpec.filters) {
        params.append(f.column, `${f.operator}.${f.value}`);
      }
    }

    if (querySpec.order) {
      params.set("order", `${querySpec.order.column}.${querySpec.order.ascending ? "asc" : "desc"}`);
    }

    const queryUrl = `${EXT_URL}/rest/v1/${table}?${params.toString()}`;
    console.log("PostgREST URL:", queryUrl);

    // Step 3: Execute query against external Supabase
    const dataResponse = await fetch(queryUrl, {
      headers: {
        apikey: EXT_KEY,
        Authorization: `Bearer ${EXT_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!dataResponse.ok) {
      const errText = await dataResponse.text();
      console.error("PostgREST error:", dataResponse.status, errText);
      throw new Error(`Database query failed: ${errText}`);
    }

    const queryResult = await dataResponse.json();

    // Step 4: Send results to LLM for plain English answer
    const answerResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a data analyst assistant for a telecom/SaaS company. The user asked a question about their customer data, a query was executed, and here are the results. 
            
Provide a clear, concise answer in plain English. Format numbers nicely (e.g., $1,234.56). If the result set is large, summarize key findings. Use bullet points for clarity. If the result is empty, explain that no matching records were found. Be conversational but informative. Don't mention SQL or PostgREST.`,
          },
          {
            role: "user",
            content: `Question: "${question}"\n\nResults (${queryResult.length} rows):\n${JSON.stringify(queryResult.slice(0, 50), null, 2)}${queryResult.length > 50 ? `\n... and ${queryResult.length - 50} more rows` : ""}`,
          },
        ],
      }),
    });

    if (!answerResponse.ok) {
      throw new Error("Failed to generate answer");
    }

    const answerData = await answerResponse.json();
    const answer = answerData.choices?.[0]?.message?.content || "I couldn't generate an answer.";

    return new Response(
      JSON.stringify({ answer, querySpec, resultCount: queryResult.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("nl-query error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
