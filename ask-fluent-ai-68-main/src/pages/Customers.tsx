import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchData, fetchOne } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InteractiveCard } from "@/components/InteractiveCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 25;

export default function Customers() {
  const [page, setPage] = useState(0);
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters: Record<string, string> = {};
  if (riskFilter !== "all") filters.churn_risk_label = `eq.${riskFilter}`;
  if (planFilter !== "all") filters.plan_type = `eq.${planFilter}`;
  if (search.trim()) filters.account_id = `ilike.*${search.trim()}*`;

  const { data, isLoading } = useQuery({
    queryKey: ["customers", page, riskFilter, planFilter, search],
    queryFn: () =>
      fetchData("telecomm_main", {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        order: "mrr_usd.desc.nullslast",
        filters,
      }),
    staleTime: 30_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["customer-detail", selectedId],
    queryFn: () => fetchOne("customer_details", selectedId!),
    enabled: !!selectedId,
  });

  const customers = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const detailData = detail?.data?.[0];

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 space-y-5 relative">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Customers
        </h1>
        <p className="text-sm text-muted-foreground">{total.toLocaleString()} total customers</p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 items-center"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search account ID…"
            className="pl-9 w-56 bg-secondary/50 border-border/60 text-sm"
          />
        </div>
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
        <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36 bg-secondary/50 border-border/60 text-sm">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="Starter">Starter</SelectItem>
            <SelectItem value="Pro">Pro</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table Section */}
      <div className="bg-transparent">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-card/40 backdrop-blur-sm rounded-3xl border border-border/20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-transparent">
                  <th className="hud-header text-left">Account ID</th>
                  <th className="hud-header text-left">Email</th>
                  <th className="hud-header text-left">Plan</th>
                  <th className="hud-header text-left">Tier</th>
                  <th className="hud-header text-left">Billing</th>
                  <th className="hud-header text-right">MRR</th>
                  <th className="hud-header text-right">Churn Prob</th>
                  <th className="hud-header text-left">Risk</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any, i: number) => (
                  <motion.tr
                    key={c.account_id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015 }}
                    onClick={() => setSelectedId(c.account_id)}
                    className="table-row-glass cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-mono text-[11px] text-primary/80">{c.account_id}</td>
                    <td className="py-4 px-6 text-xs text-muted-foreground truncate max-w-[180px] font-medium">{c.email}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] bg-foreground/5 text-foreground/70 border border-white/5 font-bold uppercase tracking-wider">{c.plan_type}</span>
                    </td>
                    <td className="py-4 px-6 text-[11px] font-bold text-foreground/60">{c.enterprise_tier}</td>
                    <td className="py-4 px-6 text-[10px] text-muted-foreground/50 uppercase font-bold tracking-tighter">{c.billing_cycle}</td>
                    <td className="py-4 px-6 text-right font-mono text-xs font-bold text-foreground/90">${parseFloat(c.mrr_usd).toFixed(0)}</td>
                    <td className="py-4 px-6 text-right font-mono text-xs text-primary/70 font-bold">{(parseFloat(c.churn_probability) * 100).toFixed(1)}%</td>
                    <td className="py-4 px-6">
                      <span className={`indicator-pill ${
                        c.churn_risk_label === "HIGH" ? "bg-destructive/10 border-destructive/20 text-destructive shadow-[0_0_12px_rgba(239,68,68,0.1)]" :
                        c.churn_risk_label === "MEDIUM" ? "bg-amber/10 border-amber/20 text-amber" :
                        "bg-primary/10 border-primary/20 text-primary"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          c.churn_risk_label === "HIGH" ? "bg-destructive animate-pulse-glow" :
                          c.churn_risk_label === "MEDIUM" ? "bg-amber" :
                          "bg-primary"
                        }`} />
                        {c.churn_risk_label}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* Detail Drawer - Upgraded to Premium Intelligence Card */}
      <AnimatePresence>
        {selectedId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/40 backdrop-blur-md z-40 transition-all duration-500"
              onClick={() => setSelectedId(null)}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.5 }}
              transition={{ type: "spring", damping: 35, stiffness: 350 }}
              className="fixed right-4 top-4 bottom-4 w-full max-w-xl glass-premium z-50 overflow-hidden flex flex-col rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/10"
            >
              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {/* Header Gradient Accent */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                
                <div className="p-8 space-y-8 relative">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Intelligence Report</span>
                      </div>
                      <h2 className="text-3xl font-display text-gradient">
                        {detailData?.account_id || "Customer Intelligence"}
                      </h2>
                      <p className="text-sm text-muted-foreground font-body">
                        Detailed churn analysis and profile metrics
                      </p>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setSelectedId(null)}
                      className="rounded-full hover:bg-foreground/5"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {detailLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                      <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Compiling Data...</p>
                    </div>
                  ) : detailData ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-10"
                    >
                      {/* Section: Financial Intelligence */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                          <div className="w-4 h-4 rounded-md bg-foreground/5 flex items-center justify-center">
                            <span className="text-[8px] text-foreground">$</span>
                          </div>
                          Financial Overview
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <IntelligenceCard 
                            label="MRR" 
                            value={`$${parseFloat(detailData.mrr_usd).toLocaleString()}`} 
                            accent="primary"
                          />
                          <IntelligenceCard 
                            label="LTV" 
                            value={`$${parseFloat(detailData.ltv_usd).toLocaleString()}`} 
                          />
                          <IntelligenceCard 
                            label="Monthly Rev" 
                            value={`$${parseFloat(detailData.avg_monthly_revenue).toFixed(0)}`}
                          />
                        </div>
                      </section>

                      {/* Section: Performance & Engagement */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                          <div className="w-4 h-4 rounded-md bg-foreground/5 flex items-center justify-center">
                            <span className="text-[8px] text-foreground">A</span>
                          </div>
                          Engagement Matrix
                        </div>
                        <InteractiveCard accent="cyan">
                          <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-6 border border-white/5 space-y-6 h-full">
                            <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-2">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Risk Score</span>
                                <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                                    style={{ width: `${Math.min(parseFloat(detailData.churn_risk_score) * 10, 100)}%` }}
                                  />
                                </div>
                                <p className="text-xl font-display">{parseFloat(detailData.churn_risk_score).toFixed(2)}</p>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Engagement Level</span>
                                <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
                                    style={{ width: `${Math.min(parseFloat(detailData.engagement_score) * 10, 100)}%` }}
                                  />
                                </div>
                                <p className="text-xl font-display">{parseFloat(detailData.engagement_score).toFixed(2)}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                              <div className="text-center space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-tighter">Plan</p>
                                <p className="font-medium text-sm text-cyan">{detailData.plan_type}</p>
                              </div>
                              <div className="text-center space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-tighter">Cycle</p>
                                <p className="font-medium text-sm">{detailData.billing_cycle}</p>
                              </div>
                              <div className="text-center space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-tighter">Months</p>
                                <p className="font-medium text-sm">{detailData.subscription_months}</p>
                              </div>
                            </div>
                          </div>
                        </InteractiveCard>
                      </section>

                      {/* Section: Intelligence Flags */}
                      <section className="space-y-6">
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block">Ecosystem & Add-ons</span>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: "SSO", val: detailData.sso_enabled },
                              { label: "Auto Backup", val: detailData.auto_backup_enabled },
                              { label: "Security", val: detailData.endpoint_security_enabled },
                              { label: "Priority", val: detailData.priority_support_enabled },
                              { label: "Collab", val: detailData.live_collab_enabled },
                              { label: "Vault", val: detailData.media_vault_enabled },
                            ].map((f) => (
                              <div
                                key={f.label}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                                  f.val === "Yes" 
                                  ? "bg-primary/5 border-primary/20 text-primary shadow-[0_0_10px_rgba(79,70,229,0.1)]" 
                                  : "bg-foreground/[0.02] border-white/5 text-muted-foreground opacity-60"
                                }`}
                              >
                                {f.label}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block">Intelligence Alerts</span>
                          <div className="space-y-2">
                            {[
                              { label: "Churn Event Detected", val: detailData.churned, desc: "Account has officially terminated services." },
                              { label: "Billing Shift", val: detailData.charge_increase_flag, desc: "Significant charge increase detected." },
                              { label: "High Cost Acquisition", val: detailData.high_cost_new_account, desc: "Initial setup costs above threshold." },
                              { label: "Strategic Monthly Risk", val: detailData.pro_monthly_risk, desc: "Short-term plan with high volatility." },
                            ].filter(f => f.val).map((f) => (
                              <div
                                key={f.label}
                                className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 flex gap-4 items-start"
                              >
                                <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 animate-pulse-glow" />
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-destructive uppercase tracking-wide">{f.label}</p>
                                  <p className="text-xs text-muted-foreground/80 leading-relaxed font-body">{f.desc}</p>
                                </div>
                              </div>
                            ))}
                            {[
                              { label: "Churn Event Detected", val: detailData.churned },
                              { label: "Billing Shift", val: detailData.charge_increase_flag },
                              { label: "High Cost Acquisition", val: detailData.high_cost_new_account },
                              { label: "Strategic Monthly Risk", val: detailData.pro_monthly_risk },
                            ].filter(f => !f.val).length === 4 && (
                              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-center">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">All System Checks Optimal</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    </motion.div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-20">Analytic profiles unavailable.</p>
                  )}
                </div>
              </div>
              
              {/* Footer Perspective */}
              <div className="p-6 bg-foreground/[0.02] border-t border-white/5">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 glow-primary border-bezel h-12 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Download Report
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function IntelligenceCard({ label, value, accent }: { label: string; value: any; accent?: string }) {
  return (
    <InteractiveCard accent={accent === "primary" ? "primary" : "cyan"} className="h-full">
      <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 transition-all h-full">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{label}</span>
        <p className={`text-xl font-display mt-1 ${accent === "primary" ? "text-gradient" : ""}`}>{value}</p>
      </div>
    </InteractiveCard>
  );
}
