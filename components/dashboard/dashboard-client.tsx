"use client";

import { useState } from "react";
import { ProspectsTable } from "@/components/dashboard/prospects-table";
import { DashboardKPISection } from "@/components/dashboard/dashboard-kpi-section";
import type { DashboardKPIs } from "@/actions/dashboard";
import type { Prospect } from "@/types/prospect";

interface DashboardClientProps {
  kpis: DashboardKPIs | null;
  initialProspects: Prospect[];
}

export function DashboardClient({
  kpis,
  initialProspects,
}: DashboardClientProps) {
  const [selectedFilter, setSelectedFilter] = useState<
    "hot" | "warm" | "all" | null
  >(null);

  // 필터링된 고객사 목록
  const filteredProspects =
    selectedFilter === "hot"
      ? initialProspects.filter((p) => p.crm_status === "hot")
      : selectedFilter === "warm"
        ? initialProspects.filter(
            (p) => p.crm_status === "warm" || p.crm_status === "hot",
          )
        : initialProspects;

  return (
    <>
      <DashboardKPISection
        kpis={kpis}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      <ProspectsTable
        prospects={filteredProspects}
        filterStatus={selectedFilter || undefined}
        limit={selectedFilter ? undefined : 5}
        showViewAll={true}
      />
    </>
  );
}

