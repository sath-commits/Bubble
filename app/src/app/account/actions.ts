"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/public";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/sign-in?status=missing-env");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  return { supabase, user };
}

export async function createAlert(formData: FormData) {
  const { supabase, user } = await requireUser();
  const targetType = String(formData.get("target_type") ?? "composite");
  const rawMetricId = String(formData.get("metric_id") ?? "");
  const metricId = rawMetricId === "composite" || rawMetricId === "" ? null : rawMetricId;
  const operator = String(formData.get("operator") ?? ">=");
  const threshold = Number(formData.get("threshold") ?? "0");

  if (!Number.isFinite(threshold)) {
    redirect("/account?status=bad-alert");
  }

  const { error } = await supabase.from("user_alerts").insert({
    user_id: user.id,
    target_type: targetType,
    metric_id: metricId,
    operator,
    threshold,
    active: true,
  });
  if (error) {
    redirect("/account?status=bad-alert");
  }

  revalidatePath("/account");
}

export async function toggleWatchlist(formData: FormData) {
  const { supabase, user } = await requireUser();
  const metricId = String(formData.get("metric_id") ?? "");
  const action = String(formData.get("watch_action") ?? "add");
  if (!metricId) {
    return;
  }

  if (action === "remove") {
    await supabase.from("user_watchlist").delete().eq("user_id", user.id).eq("metric_id", metricId);
  } else {
    await supabase.from("user_watchlist").upsert({ user_id: user.id, metric_id: metricId }, { onConflict: "user_id,metric_id" });
  }
  revalidatePath("/account");
  revalidatePath("/");
}

export async function markNotificationsRead() {
  const { supabase, user } = await requireUser();
  await supabase.from("user_notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  revalidatePath("/account");
}

export async function deleteAccount() {
  const { supabase, user } = await requireUser();
  const service = createServiceSupabaseClient();
  if (!service) {
    redirect("/account?status=missing-service-role");
  }

  await service.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();
  redirect("/");
}
