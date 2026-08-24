import { createClient } from "@supabase/supabase-js";
const key = process.env.SB_KEY;
for (const ref of ["tgnxixkmwgifqrksejgg", "euzcgwrljxpijrimauzv"]) {
  const url = `https://${ref}.supabase.co`;
  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await sb.storage.listBuckets();
    console.log(ref, "=>", error ? `ERR: ${error.message}` : `OK buckets=${JSON.stringify((data || []).map((b) => b.name))}`);
  } catch (e) {
    console.log(ref, "=> THREW", e.message);
  }
}
