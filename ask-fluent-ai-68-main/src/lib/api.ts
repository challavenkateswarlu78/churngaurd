const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${KEY}`,
};

export async function fetchData(table: string, params?: Record<string, any>) {
  const res = await fetch(`${BASE}/data-proxy`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "list", table, params }),
  });
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
}

export async function fetchOne(table: string, id: string, select?: string) {
  const res = await fetch(`${BASE}/data-proxy`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "get", table, id, params: { select } }),
  });
  if (!res.ok) throw new Error("Failed to fetch record");
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${BASE}/data-proxy`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "stats" }),
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function askQuestion(question: string) {
  const res = await fetch(`${BASE}/nl-query`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question }),
  });
  if (res.status === 429) throw new Error("Rate limited. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted.");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}
