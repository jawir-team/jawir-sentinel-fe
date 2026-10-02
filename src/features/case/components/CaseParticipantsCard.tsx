import * as React from "react";
import { CaseParticipant } from "@/types/case";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Users, CheckCircle2 } from "lucide-react";

export function CaseParticipantsCard({
  participants,
}: {
  participants: CaseParticipant[];
}) {
  const roleBadgeVariants = {
    MAKER: "default" as const,
    CHECKER: "warning" as const,
    SIGNER: "success" as const,
    EXECUTER: "secondary" as const,
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <CardTitle className="text-base font-semibold">
            Workflow Participants ({participants.length})
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{p.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={roleBadgeVariants[p.role] || "default"}>
                    {p.role}
                  </Badge>
                  {p.required && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      (Required)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className={`h-4 w-4 ${
                    p.status === "ACTIVE" ? "text-emerald-500" : "text-slate-300"
                  }`}
                  aria-hidden="true"
                />
                <span className="text-xs text-slate-500">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
