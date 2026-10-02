"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { CaseStatusBadge, UrgencyBadge } from "@/features/case/components/StatusBadges";
import { getCases } from "@/services/api/cases";
import { getCaseTypes } from "@/services/api/caseTypes";
import { queryKeys } from "@/constants/queryKeys";
import { Plus, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";

export default function CasesPage() {
  const router = useRouter();

  // Filters
  const [status, setStatus] = React.useState<string>("");
  const [urgency, setUrgency] = React.useState<string>("");
  const [caseTypeId, setCaseTypeId] = React.useState<string>("");
  const [assignedToMe, setAssignedToMe] = React.useState<boolean>(false);
  const [page, setPage] = React.useState<number>(1);
  const limit = 10;

  const { data: caseTypes } = useQuery({
    queryKey: queryKeys.caseTypes(),
    queryFn: getCaseTypes,
  });

  const filterParams = React.useMemo(
    () => ({
      status: status || undefined,
      urgency: urgency || undefined,
      case_type_id: caseTypeId || undefined,
      assigned_to_me: assignedToMe ? true : undefined,
      page,
      limit,
    }),
    [status, urgency, caseTypeId, assignedToMe, page, limit]
  );

  const {
    data: caseResult,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.cases(filterParams),
    queryFn: () => getCases(filterParams),
  });

  const cases = caseResult?.data || [];
  const total = caseResult?.pagination?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleRowClick = (caseId: string) => {
    router.push(`/cases/${caseId}`);
  };

  const resetFilters = () => {
    setStatus("");
    setUrgency("");
    setCaseTypeId("");
    setAssignedToMe(false);
    setPage(1);
  };

  return (
    <ContentContainer>
      <PageHeader
        title="Cases"
        description="Monitor and manage all case workflows under Sentinel governance."
        action={
          <Link href="/cases/new">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Create New Case
            </Button>
          </Link>
        }
      />

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-40">
          <label htmlFor="filter-status" className="block text-xs font-semibold text-slate-500 mb-1">
            Workflow Status
          </label>
          <Select
            id="filter-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="AI_ANALYSIS">AI_ANALYSIS</option>
            <option value="CHECKING">CHECKING</option>
            <option value="SIGNING">SIGNING</option>
            <option value="EXECUTION">EXECUTION</option>
            <option value="DONE">DONE</option>
            <option value="CLOSED">CLOSED</option>
            <option value="ESCALATION_REQUIRED">ESCALATION_REQUIRED</option>
          </Select>
        </div>

        <div className="w-36">
          <label htmlFor="filter-urgency" className="block text-xs font-semibold text-slate-500 mb-1">
            Urgency
          </label>
          <Select
            id="filter-urgency"
            value={urgency}
            onChange={(e) => {
              setUrgency(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Urgencies</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </Select>
        </div>

        <div className="w-48">
          <label htmlFor="filter-casetype" className="block text-xs font-semibold text-slate-500 mb-1">
            Case Type
          </label>
          <Select
            id="filter-casetype"
            value={caseTypeId}
            onChange={(e) => {
              setCaseTypeId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            {caseTypes?.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-5">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={assignedToMe}
              onChange={(e) => {
                setAssignedToMe(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Assigned to Me
          </label>
        </div>

        {(status || urgency || caseTypeId || assignedToMe) && (
          <div className="flex items-center pt-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingState label="Loading cases..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : cases.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-8 w-8 text-slate-400" />}
          title="No Cases Found"
          description="No cases match your filters or no cases have been created yet."
          action={
            <Link href="/cases/new">
              <Button variant="primary">Create First Case</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Case Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-44">Case Type</TableHead>
                <TableHead className="w-28">Urgency</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-36">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => handleRowClick(c.id)}
                  className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleRowClick(c.id);
                    }
                  }}
                  role="button"
                  aria-label={`Open details for case ${c.case_number}: ${c.title}`}
                >
                  <TableCell className="font-mono font-semibold text-blue-600">
                    {c.case_number}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {c.title}
                  </TableCell>
                  <TableCell className="text-slate-600 text-xs">
                    {c.case_type?.name || "-"}
                  </TableCell>
                  <TableCell>
                    <UrgencyBadge urgency={c.urgency} />
                  </TableCell>
                  <TableCell>
                    <CaseStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {new Date(c.created_at).toLocaleString("en-US", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 text-sm text-slate-600">
            <div>
              Showing {cases.length} of {total} total cases
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Previous
              </Button>
              <span className="text-xs font-medium px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </ContentContainer>
  );
}
