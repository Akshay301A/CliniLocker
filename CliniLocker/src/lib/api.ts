import { supabase } from "./supabase";
import type { Profile, Report, FamilyMember, Lab } from "./supabase";

export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data as Profile | null;
}

/** Coerce empty strings to null for optional profile fields to avoid DB/trigger issues. */
function sanitizeProfileUpdates(updates: Partial<Profile>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const optionalNullables = ["full_name", "phone", "email", "date_of_birth", "gender", "blood_group", "address", "emergency_contact_name", "emergency_contact_relation", "emergency_contact_phone", "avatar_url", "blood_pressure"];
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined) continue;
    if (k === "weight") {
      if (v === "" || v === null) out[k] = null;
      else out[k] = typeof v === "number" ? v : Number(v) || null;
      continue;
    }
    if (optionalNullables.includes(k) && v === "") out[k] = null;
    else out[k] = v;
  }
  return out;
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile | null | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const payload = sanitizeProfileUpdates(updates);
  if (Object.keys(payload).length === 0) return null;
  const { data, error } = await supabase.from("profiles").update(payload).eq("id", user.id).select().single();
  if (error) return { error: error.message };
  return data as Profile | null;
}

/**
 * Change or set password.
 * - Email/password users: pass currentPassword to re-authenticate, then new password is set.
 * - Google or phone (OTP) users: pass currentPassword as null/empty; we set the new password on their account
 *   so they can also sign in with email+password later.
 */
export async function updatePassword(
  currentPassword: string | null,
  newPassword: string
): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  if (!newPassword || newPassword.length < 6) return { error: "New password must be at least 6 characters" };
  const email = user.email;
  if (email && currentPassword && currentPassword.trim()) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signInError) return { error: "Current password is incorrect" };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return {};
}

// --- Profile avatar (avatars bucket, public) ---
const AVATAR_MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Normalize MIME for upload (bucket allows image/jpeg, not image/jpg). */
function avatarContentType(file: File): string {
  const t = file.type?.toLowerCase();
  if (t === "image/jpg") return "image/jpeg";
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(t)) return t;
  return "image/jpeg";
}

/** Upload a profile image to the avatars bucket; returns the public URL or error. */
export async function uploadAvatar(file: File): Promise<{ url: string } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const ext = AVATAR_MIME_EXT[file.type?.toLowerCase()] || "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: avatarContentType(file),
    upsert: true,
  });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { url: data.publicUrl };
}

// --- Lab ---
export async function getLabUser(userId: string): Promise<{ lab_id: string; lab: Lab } | null> {
  const { data: labUsers } = await supabase
    .from("lab_users")
    .select("lab_id")
    .eq("user_id", userId)
    .limit(1);
  if (!labUsers?.length) return null;
  const labId = labUsers[0].lab_id;
  const { data: lab } = await supabase.from("labs").select("id, name, email, phone").eq("id", labId).single();
  if (!lab) return null;
  return { lab_id: labId, lab: lab as Lab };
}

export async function getLab(labId: string): Promise<Lab | null> {
  const { data, error } = await supabase.from("labs").select("id, name, email, phone, address, license_number").eq("id", labId).single();
  if (error || !data) return null;
  return data as Lab;
}

export async function updateLab(labId: string, updates: Partial<Pick<Lab, "name" | "email" | "phone" | "address" | "license_number">>): Promise<Lab | null> {
  const { data, error } = await supabase.from("labs").update(updates).eq("id", labId).select().single();
  if (error || !data) return null;
  return data as Lab;
}

export async function createLabAndJoin(labName: string, phone: string): Promise<{ labId: string } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: lab, error: labErr } = await supabase
    .from("labs")
    .insert({ name: labName, phone: phone || null })
    .select("id")
    .single();
  if (labErr || !lab) return { error: labErr?.message ?? "Failed to create lab" };
  const { error: joinErr } = await supabase
    .from("lab_users")
    .insert({ user_id: user.id, lab_id: lab.id, role: "admin" });
  if (joinErr) return { error: joinErr.message };
  return { labId: lab.id };
}

// --- Patient reports (from DB; RLS returns only their reports) ---
export type ReportWithLab = Report & { labs?: { name: string } | null };

export async function getPatientReports(): Promise<ReportWithLab[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*, labs(name)")
    .order("uploaded_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ReportWithLab[];
}

export type LinkedLab = {
  lab_id: string;
  lab_name: string;
  reports_count: number;
  first_report_at: string | null;
  last_report_at: string | null;
};

/** Get labs linked to the current patient (through lab_patient_links). */
export async function getLinkedLabs(): Promise<LinkedLab[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data, error } = await supabase
    .from("lab_patient_links")
    .select("lab_id, reports_count, first_report_at, last_report_at, labs(name)")
    .eq("patient_id", user.id)
    .order("last_report_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((link: any) => ({
    lab_id: link.lab_id,
    lab_name: link.labs?.name || "Unknown Lab",
    reports_count: link.reports_count || 0,
    first_report_at: link.first_report_at,
    last_report_at: link.last_report_at,
  }));
}

export async function getReportById(id: string): Promise<(Report & { labs?: { name: string } | null }) | null> {
  const { data, error } = await supabase.from("reports").select("*, labs(name)").eq("id", id).single();
  if (error || !data) return null;
  return data as Report & { labs?: { name: string } | null };
}

/** Get report by share token (when opening shared link in another account). Grants report_access to current user. */
export async function getReportByIdWithShareToken(
  reportId: string,
  shareToken: string
): Promise<(Report & { labs?: { name: string } | null }) | null> {
  const { data, error } = await supabase.rpc("get_report_by_share_token", {
    p_report_id: reportId,
    p_token: shareToken,
  });
  if (error || data == null) return null;
  return data as Report & { labs?: { name: string } | null };
}

/** Create or get existing share token for report (for "Copy link"). Only report owner. */
export async function createReportShareToken(reportId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("create_or_get_report_share_token", {
    p_report_id: reportId,
  });
  if (error || data == null) return null;
  return data as string;
}

/** Get a signed URL for viewing a report file. Pass the path segment (e.g. from file_url). */
export async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("reports").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

// --- Patient upload (self-upload) ---
export async function getSelfUploadLabId(): Promise<string | null> {
  const { data } = await supabase.from("labs").select("id").eq("name", "Self Upload").limit(1).single();
  return data?.id ?? null;
}

export async function uploadReportFile(
  path: string,
  file: File
): Promise<{ path: string } | { error: string }> {
  const { error } = await supabase.storage.from("reports").upload(path, file, {
    contentType: "application/pdf",
  });
  if (error) return { error: error.message };
  return { path };
}

export async function insertReport(row: {
  lab_id: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string;
  test_name: string;
  file_url: string;
  test_date?: string | null;
  status?: string;
}): Promise<{ id: string } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("reports")
    .insert({
      ...row,
      status: row.status ?? "delivered",
      uploaded_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: data.id };
}

// --- Family members ---
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as FamilyMember[];
}

export async function insertFamilyMember(member: {
  name: string;
  relation: string;
  phone?: string | null;
  date_of_birth?: string | null;
}): Promise<{ id: string } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data, error } = await supabase
    .from("family_members")
    .insert({ user_id: user.id, ...member })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: data.id };
}

export async function deleteFamilyMember(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("family_members").delete().eq("id", id);
  return { error: error?.message };
}

/** Reports shared with the current user (via report_access). For "Family Reports" page. */
export async function getReportsSharedWithMe(): Promise<ReportWithLab[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: accessList } = await supabase
    .from("report_access")
    .select("report_id")
    .eq("user_id", user.id);
  if (!accessList?.length) return [];
  const ids = accessList.map((a) => a.report_id);
  const { data: reports, error } = await supabase
    .from("reports")
    .select("*, labs(name)")
    .in("id", ids)
    .order("uploaded_at", { ascending: false });
  if (error) return [];
  return (reports ?? []) as ReportWithLab[];
}

/** Grant a user (e.g. family member) access to a report. Caller must own the report. */
export async function grantReportAccessToUser(
  reportId: string,
  sharedWithUserId: string
): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("report_access").insert({
    report_id: reportId,
    user_id: sharedWithUserId,
    granted_by: user.id,
  });
  if (error) {
    if (error.code === "23505") return {}; // unique violation = already shared
    return { error: error.message };
  }
  return {};
}

/** Create invite for a family member; returns invite link. Family member must create account via this link. */
export async function createFamilyInvite(familyMemberId: string): Promise<{ link: string } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const token = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const { data: invite, error: insertError } = await supabase
    .from("family_invites")
    .insert({ family_member_id: familyMemberId, token, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return { link: `${origin}/patient/accept-invite?token=${encodeURIComponent(token)}` };
}

/** Accept family invite (call after signup). Links current user to the family_member. */
export async function acceptFamilyInvite(token: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("accept_family_invite", { p_token: token });
  if (error) return { ok: false, error: error.message };
  const result = data as { ok?: boolean; error?: string } | null;
  if (!result?.ok) return { ok: false, error: result?.error ?? "Invalid or expired invite" };
  return { ok: true };
}

export type PendingInviteReceived = {
  token: string;
  inviter_name: string;
  member_label: string;
  expires_at: string;
};

/** Pending family invites for the current user (matched by profile phone). For "Invites you received" section. */
export async function getPendingInvitesReceived(): Promise<PendingInviteReceived[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.rpc("get_pending_invites_received");
  if (error) return [];
  return (data ?? []) as PendingInviteReceived[];
}

// --- Lab: reports, patients (lab_patient_links) ---
export async function getLabReports(labId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("lab_id", labId)
    .order("uploaded_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Report[];
}

/** Lab patients list; name/phone are masked when patient has profile_visible_to_labs = false. */
export async function getLabPatients(labId: string): Promise<
  { patient_name: string; patient_phone: string; reports_count: number; last_report_at: string | null }[]
> {
  const { data, error } = await supabase.rpc("get_lab_patients_visible", { p_lab_id: labId });
  if (error) return [];
  return (data ?? []) as { patient_name: string; patient_phone: string; reports_count: number; last_report_at: string | null }[];
}

export async function getLabStats(labId: string): Promise<{
  totalReports: number;
  reportsThisMonth: number;
  totalPatients: number;
}> {
  const [reportsRes, patientsRes] = await Promise.all([
    supabase.from("reports").select("id, uploaded_at", { count: "exact", head: true }).eq("lab_id", labId),
    supabase.from("lab_patient_links").select("id", { count: "exact", head: true }).eq("lab_id", labId),
  ]);
  const totalReports = reportsRes.count ?? 0;
  const totalPatients = patientsRes.count ?? 0;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count: reportsThisMonth } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("lab_id", labId)
    .gte("uploaded_at", startOfMonth.toISOString());
  return {
    totalReports,
    reportsThisMonth: reportsThisMonth ?? 0,
    totalPatients,
  };
}

// --- AI report analysis (no data stored) ---

/** Extract plain text from a PDF URL for AI analysis. Fetches PDF in memory only; nothing stored. */
export async function extractTextFromPdfUrl(pdfUrl: string): Promise<string> {
  const res = await fetch(pdfUrl);
  if (!res.ok) throw new Error("Failed to fetch PDF");
  const arrayBuffer = await res.arrayBuffer();
  const pdfjsLib = await import("pdfjs-dist");
  const { PDF_WORKER_SRC } = await import("./pdfWorker");
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let text = "";
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: { str?: string }) => item.str ?? "").filter(Boolean);
    text += strings.join(" ") + "\n";
  }
  return text.trim();
}

export type ReportAnalysis = {
  summary: string;
  findings: { text: string; type: "normal" | "attention" }[];
  actions: string[];
};

/** Call Edge Function to analyze report text with OpenAI. No report data is stored anywhere. */
export async function analyzeReportText(text: string): Promise<ReportAnalysis | { error: string }> {
  const { data, error } = await supabase.functions.invoke("analyze-report", {
    body: { text: text.slice(0, 12000) },
  });
  if (error) return { error: error.message };
  if (data?.error) return { error: String(data.error) };
  if (!data || typeof data.summary !== "string") return { error: "Invalid response" };
  const findings = Array.isArray(data.findings)
    ? data.findings.map((f: { text?: string; type?: string }) => ({
        text: typeof f.text === "string" ? f.text : "",
        type: (f.type === "attention" ? "attention" : "normal") as "normal" | "attention",
      }))
    : [];
  return {
    summary: data.summary,
    findings,
    actions: Array.isArray(data.actions) ? data.actions : [],
  };
}

/** Remote flag: show ads section (set to true in Supabase app_config after AdSense verification). */
export async function getShowAds(): Promise<boolean> {
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "show_ads")
    .maybeSingle();
  if (error || !data?.value) return false;
  return data.value === true || data.value === "true";
}

/** Check if a phone number already has a patient account (profile). Used to show Login vs Create account. */
export async function checkPatientPhoneExists(phone: string): Promise<boolean> {
  const normalized = phone.replace(/\s/g, "").replace(/^0/, "");
  const fullPhone = normalized.startsWith("+") ? normalized : `+91${normalized}`;
  const { data, error } = await supabase.rpc("patient_phone_exists", { phone_input: fullPhone });
  if (error) return false;
  return data === true;
}

/** Check if phone is linked to any account. Returns: 'auth' = log in with OTP, 'profile_only' = use Google, 'none' = create account. */
export async function getPatientPhoneStatus(phone: string): Promise<"auth" | "profile_only" | "none"> {
  const normalized = phone.replace(/\s/g, "").replace(/^0/, "");
  const fullPhone = normalized.startsWith("+") ? normalized : `+91${normalized}`;
  const { data, error } = await supabase.rpc("patient_phone_status", { phone_input: fullPhone });
  if (error || data == null) return "none";
  if (data === "auth" || data === "profile_only") return data;
  return "none";
}

/** Check if email is linked to any account. Returns: 'auth' = log in with magic link, 'profile_only' = use phone/Google, 'none' = create account. */
export async function getPatientEmailStatus(email: string): Promise<"auth" | "profile_only" | "none"> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return "none";
  const { data, error } = await supabase.rpc("patient_email_status", { email_input: trimmed });
  if (error || data == null) return "none";
  if (data === "auth" || data === "profile_only") return data;
  return "none";
}

/** True if this email is in profiles for a different user (same person, other auth). Used after Google sign-in to avoid duplicate account. */
export async function checkPatientEmailOwnedByOtherUser(email: string, currentUserId: string): Promise<boolean> {
  const trimmed = email?.trim()?.toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return false;
  const { data, error } = await supabase.rpc("patient_email_owned_by_other_user", {
    email_input: trimmed,
    current_uid: currentUserId,
  });
  return !error && data === true;
}
