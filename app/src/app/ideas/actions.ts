"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitMetricIdea(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/ideas?status=missing-env");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row = {
    user_id: user?.id ?? null,
    email: String(formData.get("email") ?? "").trim() || null,
    proposed_name: String(formData.get("proposed_name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    proposed_source_url: String(formData.get("proposed_source_url") ?? "").trim(),
    rationale: String(formData.get("rationale") ?? "").trim(),
  };

  if (!row.proposed_name || !row.description || !row.proposed_source_url || !row.rationale) {
    redirect("/ideas?status=missing-fields");
  }

  const { error } = await supabase.from("metric_submissions").insert(row);
  if (error) {
    redirect("/ideas?status=error");
  }

  revalidatePath("/ideas");
  redirect("/ideas?status=submitted");
}

export async function upvoteIdea(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/ideas?status=missing-env");
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const submissionId = String(formData.get("submission_id") ?? "");
  if (!submissionId) {
    return;
  }

  const { error: voteError } = await supabase
    .from("metric_submission_votes")
    .insert({ submission_id: submissionId, user_id: user.id });
  if (voteError) {
    redirect("/ideas?status=already-voted");
  }

  const { data } = await supabase.from("metric_submissions").select("votes").eq("id", submissionId).maybeSingle();
  const votes = Number(data?.votes ?? 0) + 1;
  await supabase.from("metric_submissions").update({ votes }).eq("id", submissionId);
  revalidatePath("/ideas");
}
