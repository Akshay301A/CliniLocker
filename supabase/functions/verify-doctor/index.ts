// @ts-ignore Supabase Edge Functions support npm: imports at runtime.
import { createClient } from "npm:@supabase/supabase-js@2";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

declare const document: {
  querySelectorAll: (selector: string) => ArrayLike<any>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

const IMR_URL = "https://www.nmc.org.in/information-desk/indian-medical-register/";
const DEFAULT_BROWSERLESS_ENDPOINT = "wss://production-sfo.browserless.io";

type VerificationRequest = {
  registration_number?: string;
  state_council?: string;
  doctor_name?: string;
  year_of_registration?: string;
  registrationNumber?: string;
  stateCouncil?: string;
  doctorName?: string;
  yearOfRegistration?: string;
  medicalCouncil?: string;
  fullName?: string;
};

type ScrapedDoctorRecord = {
  doctorName: string;
  qualification: string | null;
  university: string | null;
  registrationNumber: string | null;
  stateCouncil: string | null;
  yearOfRegistration: string | null;
};

type Page = any;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeJwtPayload(token: string): { sub?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as { sub?: string; role?: string; exp?: number };
  } catch {
    return null;
  }
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeName(value: string) {
  return normalizeWhitespace(
    value
      .toLowerCase()
      .replace(/\b(dr|doctor)\.?\b/g, "")
      .replace(/[^a-z\s]/g, " ")
  );
}

function levenshteinDistance(a: string, b: string) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

function nameSimilarity(left: string, right: string) {
  const a = normalizeName(left);
  const b = normalizeName(right);
  if (!a || !b) return 0;
  if (a === b) return 1;

  const distance = levenshteinDistance(a, b);
  const editScore = 1 - distance / Math.max(a.length, b.length, 1);

  const leftTokens = a.split(" ").filter(Boolean);
  const rightTokens = b.split(" ").filter(Boolean);
  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  const overlap = [...leftSet].filter((token) => rightSet.has(token)).length;
  const tokenScore = (2 * overlap) / Math.max(leftSet.size + rightSet.size, 1);

  return Math.max(editScore, tokenScore);
}

function buildBrowserlessEndpoint() {
  const token = Deno.env.get("BROWSERLESS_TOKEN")?.trim();
  const rawEndpoint = Deno.env.get("BROWSERLESS_WS_ENDPOINT")?.trim() || DEFAULT_BROWSERLESS_ENDPOINT;

  if (!token) {
    throw new Error("Missing BROWSERLESS_TOKEN secret");
  }

  if (rawEndpoint.includes("token=")) {
    return rawEndpoint;
  }

  const separator = rawEndpoint.includes("?") ? "&" : "?";
  return `${rawEndpoint}${separator}token=${encodeURIComponent(token)}`;
}

async function clickFirstAvailable(actions: Array<() => Promise<void>>) {
  for (const action of actions) {
    try {
      await action();
      return;
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error("Unable to open the Registration Number search tab on the IMR page.");
}

async function fillFirstMatchingInput(page: Page, selectors: string[], value: string) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    try {
      if (await locator.isVisible({ timeout: 1500 })) {
        await locator.fill(value);
        return;
      }
    } catch {
      // Keep trying the next selector.
    }
  }
  throw new Error(`Unable to find the matching input field for "${value}".`);
}

async function selectCouncil(page: Page, stateCouncil: string) {
  const selectCandidates = [
    page.getByLabel(/state medical council|registered council/i).first(),
    page.locator("select[name*='council' i]").first(),
    page.locator("select[id*='council' i]").first(),
    page.locator("select").first(),
  ];

  for (const locator of selectCandidates) {
    try {
      if (!(await locator.isVisible({ timeout: 1500 }))) continue;
      await locator.evaluate((node: unknown, label: string) => {
        const select = node as {
          value: string;
          options: ArrayLike<{ value: string; textContent?: string | null }>;
          dispatchEvent: (event: Event) => void;
        };
        const normalize = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();
        const target = normalize(label);
        const option = Array.from(select.options).find((entry) => normalize(entry.textContent || "") === target);
        if (!option) {
          throw new Error(`Council option not found: ${label}`);
        }
        select.value = option.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }, stateCouncil);
      return;
    } catch {
      // Keep trying the next selector.
    }
  }

  throw new Error(`Unable to find State Medical Council dropdown option for "${stateCouncil}".`);
}

async function waitForSearchResults(page: Page) {
  const resultsTable = page.locator("table tbody tr").first();
  const noResults = page.getByText(/no matching|no records|not found|no data/i).first();

  try {
    await Promise.race([
      resultsTable.waitFor({ state: "visible", timeout: 20000 }),
      noResults.waitFor({ state: "visible", timeout: 20000 }),
    ]);
  } catch {
    throw new Error("IMR search did not finish in time.");
  }

  if (await noResults.isVisible().catch(() => false)) {
    throw new Error("No IMR record matched the submitted registration details.");
  }
}

async function extractResultRow(page: Page): Promise<ScrapedDoctorRecord> {
  const record = await page.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || "").replace(/\s+/g, " ").trim();
    const tables: any[] = Array.from(document.querySelectorAll("table"));
    const targetTable = tables.find((table: any) => /registration/i.test(table?.textContent || "") && /\bname\b/i.test(table?.textContent || ""));
    if (!targetTable) return null;

    const headerCells = Array.from(targetTable.querySelectorAll("thead th, tr th")).map((cell: any) => normalize(cell?.textContent));
    const firstRow = targetTable.querySelector("tbody tr");
    if (!firstRow) return null;
    const rowCells = Array.from(firstRow.querySelectorAll("td")).map((cell: any) => normalize(cell?.textContent));
    const rowMap = headerCells.reduce((acc: Record<string, string>, header: string, index: number) => {
      acc[header.toLowerCase()] = rowCells[index] || "";
      return acc;
    }, {} as Record<string, string>);

    return {
      doctorName: rowMap["name"] || rowMap["doctor name"] || "",
      qualification: rowMap["qualification"] || null,
      university: rowMap["university"] || rowMap["university name"] || null,
      registrationNumber: rowMap["registration number"] || rowMap["registration no"] || null,
      stateCouncil: rowMap["state medical councils"] || rowMap["registered council"] || null,
      yearOfRegistration: rowMap["year of registration"] || rowMap["year of info"] || null,
    };
  });

  if (!record?.doctorName) {
    throw new Error("Unable to read the doctor name from the IMR search results.");
  }

  return record;
}

async function enrichFromDoctorDetailsPage(page: Page, fallback: ScrapedDoctorRecord) {
  const firstRow = page.locator("table tbody tr").first();
  const detailLink = firstRow.locator("a").first();

  if (!(await detailLink.count())) {
    return fallback;
  }

  try {
    const href = await detailLink.getAttribute("href");
    if (href) {
      const detailUrl = new URL(href, IMR_URL).toString();
      await page.goto(detailUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    } else {
      await detailLink.click({ timeout: 5000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    }

    const details = await page.evaluate(() => {
      const normalize = (value: string | null | undefined) => (value || "").replace(/\s+/g, " ").trim();
      const textNodes: any[] = Array.from(document.querySelectorAll("table tr, dl div, .elementor-widget-container *"));

      const findField = (patterns: RegExp[]) => {
        for (const node of textNodes) {
          const text = normalize(node?.textContent);
          if (!text) continue;
          for (const pattern of patterns) {
            if (pattern.test(text)) {
              const cells = Array.from(node.querySelectorAll("th, td, dt, dd"))
                .map((cell: any) => normalize(cell?.textContent))
                .filter(Boolean);
              if (cells.length >= 2) return cells[cells.length - 1];
              const parts = text.split(":").map((part) => normalize(part)).filter(Boolean);
              if (parts.length >= 2) return parts[parts.length - 1];
            }
          }
        }
        return null;
      };

      return {
        qualification: findField([/qualification/i]),
        university: findField([/university/i]),
      };
    });

    return {
      ...fallback,
      qualification: details.qualification || fallback.qualification,
      university: details.university || fallback.university,
    };
  } catch {
    return fallback;
  }
}

async function lookupDoctorInImr(payload: {
  registrationNumber: string;
  stateCouncil: string;
  yearOfRegistration?: string;
}) {
  // Load Playwright lazily so CORS preflight and non-browser requests do not fail
  // during cold start if the runtime cannot initialize Playwright immediately.
  // @ts-ignore Supabase Edge Functions support npm: imports at runtime.
  const { chromium } = await import("npm:playwright-core@1.53.0");
  const browser: any = await chromium.connectOverCDP(buildBrowserlessEndpoint());

  try {
    const context: any = await browser.newContext({
      viewport: { width: 1440, height: 1600 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });
    const page: Page = await context.newPage();

    await page.goto(IMR_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    await clickFirstAvailable([
      () => page.getByRole("tab", { name: /registration number/i }).first().click({ timeout: 4000 }),
      () => page.getByRole("link", { name: /registration number/i }).first().click({ timeout: 4000 }),
      () => page.getByRole("button", { name: /registration number/i }).first().click({ timeout: 4000 }),
      () => page.getByText(/search by registration number/i).first().click({ timeout: 4000 }),
      () => page.getByText(/registration number/i).first().click({ timeout: 4000 }),
    ]);

    await fillFirstMatchingInput(page, [
      "input[placeholder*='Registration' i]",
      "input[name*='registration' i]",
      "input[id*='registration' i]",
      "input[type='text']",
    ], payload.registrationNumber);

    await selectCouncil(page, payload.stateCouncil);

    if (payload.yearOfRegistration?.trim()) {
      await fillFirstMatchingInput(page, [
        "input[placeholder*='Year' i]",
        "input[name*='year' i]",
        "input[id*='year' i]",
      ], payload.yearOfRegistration.trim());
    }

    await clickFirstAvailable([
      () => page.getByRole("button", { name: /^submit$/i }).first().click({ timeout: 4000 }),
      () => page.getByRole("button", { name: /search/i }).first().click({ timeout: 4000 }),
      () => page.getByRole("link", { name: /^submit$/i }).first().click({ timeout: 4000 }),
      () => page.getByText(/^submit$/i).first().click({ timeout: 4000 }),
    ]);

    await waitForSearchResults(page);
    const rowRecord = await extractResultRow(page);
    return await enrichFromDoctorDetailsPage(page, rowRecord);
  } finally {
    await browser.close().catch(() => {});
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing required secrets" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const payload = accessToken ? decodeJwtPayload(accessToken) : null;
  const now = Math.floor(Date.now() / 1000);
  const userId = payload?.sub && payload?.role !== "anon" && (!payload.exp || payload.exp > now)
    ? payload.sub
    : "";

  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: VerificationRequest;

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const doctorName = body.doctor_name?.trim() || body.doctorName?.trim() || body.fullName?.trim();
  const registrationNumber = body.registration_number?.trim() || body.registrationNumber?.trim();
  const stateCouncil = body.state_council?.trim() || body.stateCouncil?.trim() || body.medicalCouncil?.trim();
  const yearOfRegistration = body.year_of_registration?.trim() || body.yearOfRegistration?.trim() || null;

  if (!doctorName || !registrationNumber || !stateCouncil) {
    return jsonResponse({ error: "Missing required fields" }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const scraped = await lookupDoctorInImr({
      registrationNumber,
      stateCouncil,
      yearOfRegistration: yearOfRegistration || undefined,
    });

    const similarity = nameSimilarity(scraped.doctorName, doctorName);

    if (similarity < 0.9) {
      await adminClient
        .from("profiles")
        .update({
          full_name: doctorName,
          registration_number: registrationNumber,
          medical_council: stateCouncil,
          registration_year: yearOfRegistration,
          is_verified: false,
          verification_metadata: {
            source: "nmc_imr",
            matched_name: scraped.doctorName,
            similarity,
            qualification: scraped.qualification,
            university: scraped.university,
            checked_at: new Date().toISOString(),
          },
        })
        .eq("id", userId);

      return jsonResponse({
        verified: false,
        status: "mismatch",
        message: "Verification Failed: Details do not match NMC records",
        similarity,
        scraped_name: scraped.doctorName,
      }, 200);
    }

    const verificationMetadata = {
      source: "nmc_imr",
      matched_name: scraped.doctorName,
      similarity,
      qualification: scraped.qualification,
      university: scraped.university,
      registration_number: scraped.registrationNumber || registrationNumber,
      state_council: scraped.stateCouncil || stateCouncil,
      year_of_registration: scraped.yearOfRegistration || yearOfRegistration,
      checked_at: new Date().toISOString(),
    };

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        full_name: doctorName,
        registration_number: registrationNumber,
        medical_council: stateCouncil,
        registration_year: yearOfRegistration,
        role: "doctor",
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_metadata: verificationMetadata,
      })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    return jsonResponse({
      verified: true,
      status: "verified",
      details: {
        doctor_name: scraped.doctorName,
        qualification: scraped.qualification,
        university: scraped.university,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Doctor verification failed.";
    return jsonResponse({ error: message }, 500);
  }
});
