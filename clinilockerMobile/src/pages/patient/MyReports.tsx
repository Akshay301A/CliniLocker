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
import { Preloader } from "@/components/Preloader";
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
      <div className="animate-fade-in space-y-3 md:space-y-4 pb-4">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-semibold text-foreground">{t("My Reports")}</h1>
          <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">{t("Browse, search, and download all your health reports.")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input placeholder={t("Search reports...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11 min-h-[44px] w-full text-sm md:text-base rounded-lg border" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 min-w-0">
              <TabsList className="w-full md:w-auto justify-start h-10 bg-muted/50 rounded-xl p-1">
                {CATEGORY_KEYS.map((c) => (
                  <TabsTrigger key={c} value={c} className="min-h-[36px] shrink-0 text-xs md:text-sm px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">{t(c)}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl" aria-label={t("Sort reports")}>
                  <ArrowUpDown className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuRadioGroup value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                  {SORT_OPTION_VALUES.map((value) => (
                    <DropdownMenuRadioItem key={value} value={value} className="rounded-lg">
                      {t(SORT_OPTION_LABELS[value])}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {loading ? (
          <Preloader />
        ) : (
          <>
            <div className="grid gap-3 grid-cols-1">
              {sorted.map((r) => (
                <div key={r.id} className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-r from-card to-muted/30 p-3 md:p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                        <FileText className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm md:text-base text-foreground truncate">{r.test_name}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{r.labs?.name ?? "—"}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] md:text-xs text-muted-foreground">{formatDate(r.uploaded_at)}</span>
                          <Badge variant="outline" className="text-[10px]">{r.patient_name ?? t("Self")}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="default" className="min-h-[40px] flex-1 rounded-lg text-xs md:text-sm" asChild>
                      <Link to={`/patient/report/${r.id}`}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> {t("View")}
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="min-h-[40px] flex-1 rounded-lg text-xs md:text-sm" onClick={() => handleDownload(r)}>
                      <Download className="mr-1.5 h-3.5 w-3.5" /> {t("Download")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {sorted.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 py-16 text-center">
                <FileText className="mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                <p className="text-base text-muted-foreground font-medium">{t("No reports found.")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </PatientLayout>
  );
};

export default PatientMyReports;
