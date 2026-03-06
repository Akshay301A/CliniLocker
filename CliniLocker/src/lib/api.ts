import { supabase } from "./supabase";
import type { Profile, Report, FamilyMember, Lab } from "./supabase";

async function getFunctionInvokeErrorMessage(error: unknown): Promise<string> {
  const e = error as { message?: string; context?: { json?: () => Promise<unknown>; text?: () => Promise<string> } };
  let msg = e?.message || "Edge Function request failed";
  try {
    const json = await e?.context?.json?.();
    const parsed = json as { error?: unknown; status?: unknown } | null;
    if (parsed?.error) msg = `${msg}: ${String(parsed.error)}`;
    if (parsed?.status) msg = `${msg} (status ${String(parsed.status)})`;
    return msg;
  } catch {
    // ignore JSON parsing fallback
  }
  try {
    const text = await e?.context?.text?.();
    if (text) msg = `${msg}: ${text.slice(0, 300)}`;
  } catch {
    // ignore text parsing fallback
  }
  return msg;
}

export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) return null;
  return data as Profile | null;
}

/** Ensure a profile row exists for the current user (e.g. trigger missed). Uses RPC to avoid conflicts. */
export async function ensureProfileExists(): Promise<void> {
  await supabase.rpc("ensure_profile_exists");
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
 * - Google OAuth users: pass currentPassword as null/empty; we set the new password on their account
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

type LabPatientLinkRow = {
  lab_id: string;
  reports_count: number | null;
  first_report_at: string | null;
  last_report_at: string | null;
  labs?: { name?: string | null } | null;
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
  return ((data ?? []) as LabPatientLinkRow[]).map((link) => ({
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
  email?: string | null;
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendFamilyInviteEmail(params: {
  email: string;
  inviteLink: string;
  memberName: string;
}): Promise<{ error?: string }> {
  const email = params.email.trim().toLowerCase();
  if (!email || !isValidEmail(email)) return { error: "Invalid email address" };
  if (!params.inviteLink) return { error: "Missing invite link" };

  const subject = encodeURIComponent("Your CliniLocker Family Invite");
  const body = encodeURIComponent(
    `Hi ${params.memberName || "there"},\n\n` +
    `You have been invited to join a family in CliniLocker.\n\n` +
    `Open this link to accept the invite and create/login to your account:\n` +
    `${params.inviteLink}\n\n` +
    `This link expires in 7 days.\n\n` +
    `- CliniLocker`
  );

  if (typeof window !== "undefined") {
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    return {};
  }
  return { error: "Email app not available on this device." };
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
  const pdf = await loadPdfFromUrl(pdfUrl);
  return extractTextFromPdfDoc(pdf);
}

export type ReportAnalysis = {
  summary: string;
  findings: { text: string; type: "normal" | "attention" }[];
  actions: string[];
};

function hasAnalysisContent(analysis: ReportAnalysis): boolean {
  return (
    analysis.summary.trim().length > 0 ||
    analysis.findings.some((f) => f.text.trim().length > 0) ||
    analysis.actions.some((a) => a.trim().length > 0)
  );
}

function normalizeReportAnalysis(data: unknown): ReportAnalysis | { error: string } {
  const parsed = data as { error?: unknown; summary?: unknown; findings?: unknown; actions?: unknown } | null;
  if (parsed?.error) return { error: String(parsed.error) };
  if (!parsed || typeof parsed.summary !== "string") return { error: "Invalid response" };
  const findings = Array.isArray(parsed.findings)
    ? parsed.findings.map((f: { text?: string; type?: string }) => ({
        text: typeof f.text === "string" ? f.text : "",
        type: (f.type === "attention" ? "attention" : "normal") as "normal" | "attention",
      }))
    : [];
  const analysis = {
    summary: parsed.summary,
    findings,
    actions: Array.isArray(parsed.actions) ? (parsed.actions as string[]) : [],
  };
  if (!hasAnalysisContent(analysis)) {
    return { error: "Could not extract enough readable content from this report." };
  }
  return analysis;
}

async function loadPdfFromUrl(pdfUrl: string) {
  const res = await fetch(pdfUrl);
  if (!res.ok) throw new Error("Failed to fetch PDF");
  const arrayBuffer = await res.arrayBuffer();
  const pdfjsLib = await import("pdfjs-dist");
  const { PDF_WORKER_SRC } = await import("./pdfWorker");
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  return pdfjsLib.getDocument({ data: arrayBuffer }).promise;
}

async function extractTextFromPdfDoc(pdf: { numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: { str?: string }[] }> }> }): Promise<string> {
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: { str?: string }) => item.str ?? "").filter(Boolean);
    text += strings.join(" ") + "\n";
  }
  return text.trim();
}

async function renderPdfAsImages(
  pdf: { numPages: number; getPage: (n: number) => Promise<{ getViewport: (p: { scale: number }) => { width: number; height: number }; render: (p: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } }> },
  maxPages = 3
): Promise<string[]> {
  if (typeof document === "undefined") return [];
  const images: string[] = [];
  const pageCount = Math.min(pdf.numPages, maxPages);
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const targetWidth = 800;
    const scale = Math.min(1.3, Math.max(0.9, targetWidth / Math.max(baseViewport.width, 1)));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) continue;
    await page.render({ canvasContext: context, viewport }).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.45));
  }
  return images;
}

/** Call Edge Function to analyze report text with OpenAI. No report data is stored anywhere. */
export async function analyzeReportText(text: string): Promise<ReportAnalysis | { error: string }> {
  const { data, error } = await supabase.functions.invoke("analyze-report", {
    body: { text: text.slice(0, 12000) },
  });
  if (error) return { error: await getFunctionInvokeErrorMessage(error) };
  return normalizeReportAnalysis(data);
}

/** Analyze PDF directly; falls back to vision for image-only PDFs (e.g. camera images converted to PDF). */
export async function analyzeReportFromPdfUrl(pdfUrl: string): Promise<ReportAnalysis | { error: string }> {
  try {
    const pdf = await loadPdfFromUrl(pdfUrl);
    const extractedText = await extractTextFromPdfDoc(pdf);
    if (extractedText.length >= 40) {
      return await analyzeReportText(extractedText);
    }
    const images = await renderPdfAsImages(pdf, 2);
    const trimmedImages: string[] = [];
    let totalChars = 0;
    for (const img of images) {
      totalChars += img.length;
      if (totalChars > 3_000_000) break;
      trimmedImages.push(img);
    }
    if (!images.length) {
      return extractedText ? await analyzeReportText(extractedText) : { error: "No readable content found in this PDF." };
    }
    const { data, error } = await supabase.functions.invoke("analyze-report", {
      body: {
        text: extractedText.slice(0, 4000),
        images: trimmedImages,
      },
    });
    if (error) {
      if (extractedText.trim()) return await analyzeReportText(extractedText);
      return { error: await getFunctionInvokeErrorMessage(error) };
    }
    return normalizeReportAnalysis(data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to analyze report." };
  }
}

/** Notify a patient device when a report is ready (best-effort; requires push token on patient's device). */
export async function sendReportReadyPush(params: {
  patientPhone: string;
  testName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const phone = params.patientPhone?.trim();
  const testName = params.testName?.trim();
  if (!phone || !testName) return { ok: false, error: "Missing phone or test name" };
  const { data, error } = await supabase.functions.invoke("send-push", {
    body: {
      patient_phone: phone,
      title: "Your Report Is Ready",
      body: `Good news. Your ${testName} report is now available in CliniLocker. Tap to view it.`,
      data: {
        route: "/patient/reports",
        type: "report_ready",
      },
    },
  });
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: String(data.error) };
  return { ok: true };
}

// --- Prescription Analysis & Upload ---

export type MedicationReminder = {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  start_date?: string;
  times?: string[];
  notes?: string;
};

export type PrescriptionAnalysis = {
  summary: string;
  medications: MedicationReminder[];
  doctor_name?: string;
  prescription_date?: string;
};

type PrescriptionMedicationRow = {
  medication_name?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  duration_days?: number | null;
  start_date?: string | null;
  times?: string[] | null;
  notes?: string | null;
};

function normalizePrescriptionMedication(row: PrescriptionMedicationRow): MedicationReminder | null {
  const medication_name = (row.medication_name ?? "").trim();
  const dosage = (row.dosage ?? "").trim();
  const frequency = (row.frequency ?? "").trim();
  if (!medication_name || !dosage || !frequency) return null;
  return {
    medication_name,
    dosage,
    frequency,
    duration_days: row.duration_days || undefined,
    start_date: row.start_date || undefined,
    times: Array.isArray(row.times) ? row.times.filter(Boolean) : undefined,
    notes: row.notes?.trim() || undefined,
  };
}

async function invokeAnalyzePrescription(text: string, images?: string[]): Promise<{ data?: unknown; error?: string }> {
  const { data, error } = await supabase.functions.invoke("analyze-prescription", {
    body: {
      text: text.slice(0, 12000),
      images: Array.isArray(images) ? images.slice(0, 3) : undefined,
    },
  });
  if (error) return { error: error.message };
  if ((data as { error?: unknown } | null)?.error) return { error: String((data as { error?: unknown }).error) };
  return { data };
}

/** Call Edge Function to analyze prescription text with OpenAI. */
export async function analyzePrescriptionText(text: string): Promise<PrescriptionAnalysis | { error: string }> {
  const safeText = text.slice(0, 12000);
  let lastError = "Invalid response";
  let best: PrescriptionAnalysis | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await invokeAnalyzePrescription(safeText);
    if (error) {
      lastError = error;
      continue;
    }
    if (!data || !Array.isArray(data.medications)) {
      lastError = "Invalid response";
      continue;
    }

    const medications = (data.medications as PrescriptionMedicationRow[])
      .map(normalizePrescriptionMedication)
      .filter((m): m is MedicationReminder => m !== null);

    const candidate: PrescriptionAnalysis = {
      summary: typeof data.summary === "string" ? data.summary : "",
      medications,
      doctor_name: data.doctor_name || undefined,
      prescription_date: data.prescription_date || undefined,
    };

    if (!best || candidate.medications.length > best.medications.length) {
      best = candidate;
    }
    if (candidate.medications.length > 0) break;
  }

  if (best) return best;
  return { error: lastError };
}

/** Analyze prescription PDF with text-first + image fallback for scanned/photo PDFs. */
export async function analyzePrescriptionFromPdfUrl(pdfUrl: string): Promise<PrescriptionAnalysis | { error: string }> {
  try {
    const pdf = await loadPdfFromUrl(pdfUrl);
    const extractedText = await extractTextFromPdfDoc(pdf);

    if (extractedText.length >= 40) {
      const primary = await analyzePrescriptionText(extractedText);
      if (!("error" in primary) && primary.medications.length > 0) return primary;
    }

    const images = await renderPdfAsImages(pdf, 3);
    if (!images.length) {
      return extractedText ? await analyzePrescriptionText(extractedText) : { error: "No readable content found in prescription PDF." };
    }

    const { data, error } = await invokeAnalyzePrescription(extractedText.slice(0, 4000), images);
    if (error) {
      if (extractedText.trim()) return analyzePrescriptionText(extractedText);
      return { error };
    }
    if (!data || !Array.isArray((data as { medications?: unknown }).medications)) {
      return extractedText ? await analyzePrescriptionText(extractedText) : { error: "Invalid response" };
    }

    const medications = ((data as { medications: PrescriptionMedicationRow[] }).medications ?? [])
      .map(normalizePrescriptionMedication)
      .filter((m): m is MedicationReminder => m !== null);
    return {
      summary: typeof (data as { summary?: unknown }).summary === "string" ? ((data as { summary: string }).summary) : "",
      medications,
      doctor_name: ((data as { doctor_name?: string }).doctor_name) || undefined,
      prescription_date: ((data as { prescription_date?: string }).prescription_date) || undefined,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to analyze prescription." };
  }
}

/** Upload prescription file to storage */
export async function uploadPrescriptionFile(path: string, file: File): Promise<{ error?: string }> {
  const { error } = await supabase.storage.from("prescriptions").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return { error: error.message };
  return {};
}

/** Insert prescription with reminders */
export async function insertPrescription(prescription: {
  patient_id: string;
  patient_name: string;
  file_url: string;
  doctor_name?: string | null;
  prescription_date?: string | null;
  reminders: MedicationReminder[];
}): Promise<{ id: string } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: presc, error: prescError } = await supabase
    .from("prescriptions")
    .insert({
      patient_id: user.id,
      patient_name: prescription.patient_name,
      file_url: prescription.file_url,
      doctor_name: prescription.doctor_name,
      prescription_date: prescription.prescription_date,
    })
    .select()
    .single();

  if (prescError || !presc) return { error: prescError?.message || "Failed to create prescription" };

  if (prescription.reminders.length > 0) {
    const remindersToInsert = prescription.reminders
      .filter((r) => r.medication_name?.trim() && r.dosage?.trim() && r.frequency?.trim())
      .map((r) => ({
      prescription_id: presc.id,
      patient_id: user.id,
      medication_name: r.medication_name,
      dosage: r.dosage,
      frequency: r.frequency,
      duration_days: r.duration_days || null,
      start_date: r.start_date || new Date().toISOString().split("T")[0],
      times: r.times || null,
      notes: r.notes || null,
      is_active: true,
    }));

    if (remindersToInsert.length > 0) {
      const { error: remError } = await supabase
        .from("medication_reminders")
        .insert(remindersToInsert);
      if (remError) {
        console.error("Failed to create reminders:", remError);
      }
    }
  }

  return { id: presc.id };
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

/** Check if phone is linked to any account. Returns: 'auth' = account exists in auth, 'profile_only' = only profile record exists, 'none' = create account. */
export async function getPatientPhoneStatus(phone: string): Promise<"auth" | "profile_only" | "none"> {
  const normalized = phone.replace(/\s/g, "").replace(/^0/, "");
  const fullPhone = normalized.startsWith("+") ? normalized : `+91${normalized}`;
  const { data, error } = await supabase.rpc("patient_phone_status", { phone_input: fullPhone });
  if (error || data == null) return "none";
  if (data === "auth" || data === "profile_only") return data;
  return "none";
}

/** Check if email is linked to any account. Returns: 'auth' = account exists in auth, 'profile_only' = only profile record exists, 'none' = create account. */
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

/** Whether profile has required fields filled (full_name + phone). Used to gate dashboard until user completes profile. */
export function isProfileComplete(profile: { full_name?: string | null; phone?: string | null } | null): boolean {
  if (!profile) return false;
  const name = (profile.full_name ?? "").trim();
  const ph = (profile.phone ?? "").trim();
  return name.length > 0 && ph.length > 0;
}

