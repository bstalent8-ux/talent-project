import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      return [key, value];
    }),
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const rows = [
  {
    id: "0c0d4f81-3df4-41e9-bd5b-1a7d72db8b01",
    name: "Nile Studios",
    logo_url: null,
    website_url: null,
    display_order: 10,
    is_active: true,
  },
  {
    id: "184fa820-cba3-4c4f-8e19-9ab7124a6e52",
    name: "Lotus Media",
    logo_url: null,
    website_url: null,
    display_order: 20,
    is_active: true,
  },
  {
    id: "27c1af56-0f80-4669-93f9-398808cb8f12",
    name: "Cairo Collective",
    logo_url: null,
    website_url: null,
    display_order: 30,
    is_active: true,
  },
  {
    id: "3cb8cbd0-c60c-4652-b889-a5da6f78602c",
    name: "Sahara Beauty",
    logo_url: null,
    website_url: null,
    display_order: 40,
    is_active: true,
  },
  {
    id: "4ed0d8e8-1455-4452-9172-696f17ea06d4",
    name: "Delta Films",
    logo_url: null,
    website_url: null,
    display_order: 50,
    is_active: true,
  },
];

const { error } = await supabase
  .from("trusted_brands")
  .upsert(rows, { onConflict: "id", ignoreDuplicates: true });

if (error) {
  if (error.message.includes("trusted_brands")) {
    console.error("trusted_brands table is missing. Apply supabase/migrations/20260730_trusted_brands.sql first.");
    process.exit(1);
  }

  console.error(error.message);
  process.exit(1);
}

const { data, error: readError } = await supabase
  .from("trusted_brands")
  .select("name, display_order, is_active")
  .eq("is_active", true)
  .order("display_order", { ascending: true });

if (readError) {
  console.error(readError.message);
  process.exit(1);
}

console.log(JSON.stringify({
  seeded: rows.length,
  activeCount: data.length,
  names: data.map((brand) => brand.name),
}));
