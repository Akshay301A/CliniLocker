import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { FileText, Download, Eye, Search, ArrowUpDown } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPatientReports } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ReportWithLab } from "@/lib/api";

const CATEGORY_KEYS = ["All", "Blood", "Hormone", "Imaging", "Cardiac", "Urine"] as const;

type SortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc" | "lab-asc" | "lab-desc";

const SORT_OPTION_VALUES: SortOption[] = ["date-desc", "date-asc", "name-asc", "name-desc", "lab-asc", "lab-desc"];
const SORT_OPTION_LABELS: Record<SortOption, string> = {
  "date-desc": "Date (newest first)",
  "date-asc": "Date (oldest first)",
  "name-asc": "Report name (A–Z)",
  "name-desc": "Report name (Z–A)",
  "lab-asc": "Lab name (A–Z)",
  "lab-desc": "Lab name (Z–A)",
};

function sortReports(reports: ReportWithLab[], sortBy: SortOption): ReportWithLab[] {
  const arr = [...reports];
  switch (sortBy) {
    case "date-desc":
      return arr.sort((a, b) => (new Date(b.uploaded_at ?? 0).getTime() - new Date(a.uploaded_at ?? 0).getTime()));
    case "date-asc":
      return arr.sort((a, b) => (new Date(a.uploaded_at ?? 0).getTime() - new Date(b.uploaded_at ?? 0).getTime()));
    case "name-asc":
      return arr.sort((a, b) => (a.test_name ?? "").localeCompare(b.test_name ?? "", undefined, { sensitivity: "base" }));
    case "name-desc":
      return arr.sort((a, b) => (b.test_name ?? "").localeCompare(a.test_name ?? "", undefined, { sensitivity: "base" }));
    case "lab-asc":
      return arr.sort((a, b) => (a.labs?.name ?? "").localeCompare(b.labs?.name ?? "", undefined, { sensitivity: "base" }));
    case "lab-desc":
      return arr.sort((a, b) => (b.labs?.name ?? "").localeCompare(a.labs?.name ?? "", undefined, { sensitivity: "base" }));
    default:
      return arr;
  }
}

function formatDate(s: string | undefined) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

const PatientMyReports = () => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<ReportWithLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");

  useEffect(() => {
    let mounted = true;
    getPatientReports().then((data) => {
      if (mounted) setReports(data);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.test_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.labs?.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "All" || (r.test_name?.toLowerCase().includes(selectedCategory.toLowerCase()));
    return matchSearch && matchCategory;
  });

  const sorted = useMemo(() => sortReports(filtered, sortOption), [filtered, sortOption]);

  const handleDownload = (r: ReportWithLab) => {
    if (r.file_url) window.open(r.file_url, "_blank");
  };

  return (
    <PatientLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t("My Reports")}</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">{t("Browse, search, and download all your health reports.")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input placeholder={t("Search reports...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 min-h-[44px] w-full" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 min-w-0">
              <TabsList className="w-full sm:w-auto justify-start sm:justify-center h-9">
                {CATEGORY_KEYS.map((c) => (
                  <TabsTrigger key={c} value={c} className="min-h-[36px] shrink-0 text-xs sm:text-sm">{t(c)}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label={t("Sort reports")}>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuRadioGroup value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                  {SORT_OPTION_VALUES.map((value) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      {t(SORT_OPTION_LABELS[value])}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {sorted.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card transition-all hover:shadow-hover">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground truncate">{r.test_name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{r.labs?.name ?? "—"}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-muted-foreground block">{formatDate(r.uploaded_at)}</span>
                      <Badge variant="outline" className="mt-1 text-xs">{r.patient_name ?? t("Self")}</Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="min-h-[40px]" asChild>
                      <Link to={`/patient/report/${r.id}`}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> {t("View")}
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" className="min-h-[40px]" onClick={() => handleDownload(r)}>
                      <Download className="mr-1 h-3.5 w-3.5" /> {t("Download")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {sorted.length === 0 && (
              <div className="rounded-xl border border-dashed border-border py-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">{t("No reports found.")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </PatientLayout>
  );
};

export default PatientMyReports;
