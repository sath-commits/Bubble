"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/sign-in?status=missing-env");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (!user?.email || !admins.includes(user.email.toLowerCase())) {
    redirect("/account");
  }
  return supabase;
}

export async function upsertManualMetricValue(formData: FormData) {
  const supabase = await requireAdmin();
  const metricId = String(formData.get("metric_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const value = Number(formData.get("value") ?? "");

  if (!metricId || !date || !Number.isFinite(value)) {
    redirect("/admin?status=bad-value");
  }

  const { error } = await supabase.from("metric_values").upsert(
    {
      metric_id: metricId,
      date,
      value,
      is_estimate: false,
      source_details: { source: "admin-manual-entry" },
    },
    { onConflict: "metric_id,date" },
  );

  if (error) {
    redirect("/admin?status=error");
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createManualMetric(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const category = String(formData.get("category") ?? "Sentiment & Leverage").trim();

  if (!id || !name || !slug) {
    redirect("/admin?status=bad-metric");
  }

  const { error } = await supabase.from("metrics").upsert(
    {
      id,
      slug,
      name,
      category,
      unit: String(formData.get("unit") ?? ""),
      orientation_higher_is_frothier: formData.get("orientation") !== "lower",
      description_short: String(formData.get("description_short") ?? ""),
      description_long: String(formData.get("description_long") ?? ""),
      why_it_matters: String(formData.get("why_it_matters") ?? ""),
      source_name: String(formData.get("source_name") ?? "Manual / curated"),
      source_url: String(formData.get("source_url") ?? ""),
      source_tier: 3,
      update_frequency: String(formData.get("update_frequency") ?? "Manual"),
      caveats: String(formData.get("caveats") ?? "Manually updated. Cadence depends on source availability."),
      included_in_composite: formData.get("included_in_composite") === "on",
      manual_entry: true,
      active: true,
    },
    { onConflict: "id" },
  );

  if (error) {
    redirect("/admin?status=error");
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateSubmissionStatus(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("submission_id") ?? "");
  const status = String(formData.get("status") ?? "pending");
  if (!id || !["pending", "approved", "rejected"].includes(status)) {
    return;
  }
  await supabase.from("metric_submissions").update({ status }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/ideas");
}
