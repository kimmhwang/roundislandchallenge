const SB_URL = "https://vekkkydzxeatywjbylhf.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZla2treWR6eGVhdHl3amJ5bGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODkyODgsImV4cCI6MjA4OTg2NTI4OH0.LFqL9rJ8Iwp_oZ3RNqxC43pwXVbVB8amw_FHj_iimHo";

const sbHeaders = {
  apikey: SB_ANON,
  Authorization: `Bearer ${SB_ANON}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

export const sb = {
  async get(table, query = "") {
    const res = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders });
    if (!res.ok) return null;
    return res.json();
  },

  async upsert(table, data) {
    const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async insert(table, data) {
    const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: sbHeaders,
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async del(table, query) {
    const res = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
      method: "DELETE",
      headers: sbHeaders,
    });
    return res.ok;
  },
};
