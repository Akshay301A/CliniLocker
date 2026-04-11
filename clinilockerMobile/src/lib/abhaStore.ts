import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AbhaProfile = {
  name: string;
  abhaAddress: string;
  abhaNumber: string;
  qrValue: string;
};

export type ConsentRequest = {
  id: string;
  facilityName: string;
  expiry: string;
  dataTypes: string[];
};

export type FhirObservation = {
  testName: string;
  result: string;
  range: string;
  status: "Normal" | "Attention" | "Critical";
};

export type MedicalRecord = {
  id: string;
  source: "manual" | "abha";
  title: string;
  date: string;
  summary: string;
  facility?: string;
  fhir?: FhirObservation[];
};

type AbhaState = {
  isAbhaLinked: boolean;
  abhaProfile: AbhaProfile | null;
  pendingConsents: ConsentRequest[];
  medicalRecords: MedicalRecord[];
  isSyncing: boolean;
  linkAbha: (profile: AbhaProfile) => void;
  unlinkAbha: () => void;
  approveConsent: (id: string) => void;
  denyConsent: (id: string) => void;
  setMedicalRecords: (records: MedicalRecord[]) => void;
  setSyncing: (value: boolean) => void;
};

const demoRecords: MedicalRecord[] = [
  {
    id: "abdm-001",
    source: "abha",
    title: "Comprehensive Metabolic Panel",
    date: "2026-03-02",
    summary: "ABHA verified record from CityCare Diagnostics.",
    facility: "CityCare Diagnostics",
    fhir: [
      { testName: "Glucose", result: "94 mg/dL", range: "70-100", status: "Normal" },
      { testName: "Creatinine", result: "1.3 mg/dL", range: "0.7-1.2", status: "Attention" },
      { testName: "Sodium", result: "141 mmol/L", range: "135-145", status: "Normal" },
    ],
  },
  {
    id: "abdm-002",
    source: "abha",
    title: "Lipid Profile",
    date: "2026-02-18",
    summary: "ABHA verified record from Metro Hospital Lab.",
    facility: "Metro Hospital Lab",
    fhir: [
      { testName: "Total Cholesterol", result: "212 mg/dL", range: "<200", status: "Attention" },
      { testName: "HDL", result: "52 mg/dL", range: ">40", status: "Normal" },
      { testName: "LDL", result: "138 mg/dL", range: "<130", status: "Attention" },
    ],
  },
];

const demoConsents: ConsentRequest[] = [
  {
    id: "consent-1",
    facilityName: "Metro Hospital Cardiology",
    expiry: "2026-04-30",
    dataTypes: ["Prescriptions", "Lab Reports"],
  },
  {
    id: "consent-2",
    facilityName: "CityCare Diagnostics",
    expiry: "2026-05-10",
    dataTypes: ["Imaging", "Vitals"],
  },
];

export const useAbhaStore = create<AbhaState>()(
  persist(
    (set, get) => ({
      isAbhaLinked: false,
      abhaProfile: null,
      pendingConsents: demoConsents,
      medicalRecords: demoRecords,
      isSyncing: false,
      linkAbha: (profile) => set({ isAbhaLinked: true, abhaProfile: profile }),
      unlinkAbha: () => set({ isAbhaLinked: false, abhaProfile: null }),
      approveConsent: (id) =>
        set({ pendingConsents: get().pendingConsents.filter((c) => c.id !== id) }),
      denyConsent: (id) =>
        set({ pendingConsents: get().pendingConsents.filter((c) => c.id !== id) }),
      setMedicalRecords: (records) => set({ medicalRecords: records }),
      setSyncing: (value) => set({ isSyncing: value }),
    }),
    {
      name: "clinilocker_abha_state",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
