import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { FileText, Download, Eye, Search, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { PatientLayout } from "@/components/PatientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
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

const COMMON_CATEGORIES = [
  "Blood",
  "Hormone",
  "Imaging",
  "Cardiac",
  "Urine",
  "Liver",
  "Kidney",
  "Thyroid",
  "Diabetes",
  "CBC",
  "Lipid",
  "Vitamin",
  "Allergy",
] as const;

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    getPatientReports().then((data) => {
      if (mounted) setReports(data);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const categoryOptions = useMemo(() => {
    const extras = new Set<string>();
    for (const r of reports) {
      if (!r.test_name) continue;
      const trimmed = r.test_name.trim();
      if (!trimmed) continue;
      if (!COMMON_CATEGORIES.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        extras.add(trimmed);
      }
    }
    return ["All", ...COMMON_CATEGORIES, ...Array.from(extras).sort((a, b) => a.localeCompare(b))];
  }, [reports]);

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.test_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.labs?.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "All" ||
      (r.test_name?.toLowerCase() === selectedCategory.toLowerCase());

    const dateValue = r.test_date ?? r.uploaded_at;
    const reportDate = dateValue ? new Date(dateValue) : null;
    const fromOk = !dateFrom || (reportDate && reportDate >= new Date(dateFrom));
    const toLimit = dateTo ? new Date(dateTo) : null;
    if (toLimit) toLimit.setHours(23, 59, 59, 999);
    const toOk = !toLimit || (reportDate && reportDate <= toLimit);

    return matchSearch && matchCategory && fromOk && toOk;
  });

  const sorted = useMemo(() => sortReports(filtered, sortOption), [filtered, sortOption]);

  const handleDownload = (r: ReportWithLab) => {
    if (r.file_url) window.open(r.file_url, "_blank");
  };

  const handleClearFilters = () => {
    setSelectedCategory("All");
    setDateFrom("");
    setDateTo("");
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
            <Button
              variant="outline"
              className="h-9 rounded-xl px-3 text-xs sm:text-sm"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {t("All")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 rounded-xl px-3 text-xs sm:text-sm" aria-label={t("Sort reports")}>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  {t("Sort")}
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
          <Preloader />
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
      <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DrawerContent className="mx-auto h-[85vh] max-w-4xl rounded-t-2xl">
          <DrawerHeader className="border-b border-border/60 pb-3 pt-2">
            <DrawerTitle className="text-base font-semibold text-foreground">{t("Filters")}</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-5 overflow-y-auto px-4 pb-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{t("Categories")}</p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={selectedCategory === c ? "default" : "outline"}
                    className="h-9 rounded-full px-4 text-xs"
                    onClick={() => setSelectedCategory(c)}
                  >
                    {t(c)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">{t("Date range")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("From")}</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    aria-label={t("From date")}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t("To")}</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    aria-label={t("To date")}
                  />
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter className="flex-row gap-3 border-t border-border/60 px-4 pb-4 pt-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClearFilters}>
              {t("Clear filters")}
            </Button>
            <DrawerClose asChild>
              <Button className="flex-1 rounded-xl">{t("Apply filters")}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PatientLayout>
  );
};

export default PatientMyReports;
