import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/lib/api";
import { motion } from "framer-motion";
import { ScrollText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 25;

export default function AuditLogs() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const filters: Record<string, string> = {};
  if (statusFilter !== "all") filters.action_status = `eq.${statusFilter}`;
  if (riskFilter !== "all") filters.churn_risk_label = `eq.${riskFilter}`;

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, statusFilter, riskFilter],
    queryFn: () =>
      fetchData("agent_action_log", {
        select: "log_id,triggered_at,account_id,churn_probability,churn_risk_label,LLM_churn_reason,LLM_suggested_action,action_type,action_status,outcome,customer_responded",
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        order: "triggered_at.desc",
        filters,
      }),
    staleTime: 30_000,
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-accent" /> Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">{total.toLocaleString()} agent action records</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40 bg-secondary/50 border-border/60 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36 bg-secondary/50 border-border/60 text-sm">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <Card className="bg-card border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Account</th>
                  <th className="text-left py-3 px-4">Risk</th>
                  <th className="text-right py-3 px-4">Churn %</th>
                  <th className="text-left py-3 px-4">Reason</th>
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Responded</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, i: number) => (
                  <motion.tr
                    key={log.log_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.triggered_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-primary">{log.account_id}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        log.churn_risk_label === "HIGH" ? "bg-destructive/15 text-destructive" :
                        log.churn_risk_label === "MEDIUM" ? "bg-yellow-500/15 text-yellow-400" :
                        "bg-primary/15 text-primary"
                      }`}>{log.churn_risk_label}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-xs">
                      {(parseFloat(log.churn_probability) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground max-w-[200px] truncate" title={log.LLM_churn_reason}>
                      {log.LLM_churn_reason}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground max-w-[200px] truncate" title={log.LLM_suggested_action}>
                      {log.LLM_suggested_action}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-secondary-foreground">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        log.action_status === "completed" ? "bg-primary/15 text-primary" :
                        log.action_status === "failed" ? "bg-destructive/15 text-destructive" :
                        "bg-yellow-500/15 text-yellow-400"
                      }`}>{log.action_status}</span>
                    </td>
                    <td className="py-2.5 px-4 text-xs">
                      {log.customer_responded ? "✓" : "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
