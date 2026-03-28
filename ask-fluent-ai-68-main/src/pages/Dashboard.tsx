import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchData } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Users, TrendingUp, AlertTriangle, DollarSign, Shield,
  ArrowUpRight, Activity, PieChart
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  PieChart as RPieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Sector
} from "recharts";
import { InteractiveCard } from "@/components/InteractiveCard";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const COLORS = {
  primary: "hsl(231 85% 60%)",
  accent: "hsl(262 90% 50%)",
  destructive: "hsl(336 94% 56%)",
  warning: "hsl(30 93% 55%)",
  muted: "hsl(228 33% 57%)",
};

export default function Dashboard() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
    staleTime: 60_000,
  });

  const { data: riskData, isLoading: riskLoading } = useQuery({
    queryKey: ["high-risk-customers"],
    queryFn: () => fetchData("telecomm_main", { limit: 10, order: "churn_probability.desc.nullslast" }),
    staleTime: 60_000,
  });

  const isLoading = statsLoading || riskLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-primary animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const kpiCards = [
    { label: "Total Customers", value: stats.totalCustomers?.toLocaleString(), icon: Users, color: "text-primary" },
    { label: "Total MRR", value: `$${(stats.totalMRR || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-primary" },
    { label: "High Risk", value: stats.highRisk?.toLocaleString(), icon: AlertTriangle, color: "text-destructive" },
    { label: "Avg MRR", value: `$${(stats.avgMRR || 0).toFixed(2)}`, icon: TrendingUp, color: "text-accent" },
  ];

  const riskPie = [
    { name: "Low", value: stats.lowRisk || 0, color: COLORS.primary },
    { name: "Medium", value: stats.mediumRisk || 0, color: COLORS.warning },
    { name: "High", value: stats.highRisk || 0, color: COLORS.destructive },
  ];

  const planBar = [
    { name: "Starter", value: stats.plan_starter || 0 },
    { name: "Pro", value: stats.plan_pro || 0 },
    { name: "Enterprise", value: stats.plan_enterprise || 0 },
  ];

  const tierBar = [
    { name: "SMB", value: stats.tier_smb || 0 },
    { name: "Mid-Market", value: stats.tier_mid_market || 0 },
    { name: "Enterprise", value: stats.tier_enterprise || 0 },
  ];

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time overview of your customer base</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
            <InteractiveCard accent={kpi.color.includes("primary") ? "primary" : kpi.color.includes("destructive") ? "accent" : "cyan"}>
              <Card className="p-5 bg-card/40 border-border/20 backdrop-blur-sm h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{kpi.label}</span>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className="text-3xl font-display tracking-tight text-gradient">{kpi.value}</p>
              </Card>
            </InteractiveCard>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Churn Risk Pie */}
        <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}>
          <InteractiveCard accent="primary" className="h-full">
            <Card className="p-5 bg-card/40 border-border/20 backdrop-blur-sm h-full">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium">Churn Risk Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <RPieChart>
                <Pie 
                  data={riskPie} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={50} 
                  outerRadius={80} 
                  dataKey="value" 
                  stroke="none"
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={(props: any) => {
                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                    return (
                      <g>
                        <Sector
                          cx={cx}
                          cy={cy}
                          innerRadius={innerRadius}
                          outerRadius={outerRadius + 4}
                          startAngle={startAngle}
                          endAngle={endAngle}
                          fill={fill}
                          style={{ filter: `drop-shadow(0 0 8px ${fill}88)` }}
                        />
                        <Sector
                          cx={cx}
                          cy={cy}
                          innerRadius={outerRadius + 6}
                          outerRadius={outerRadius + 8}
                          startAngle={startAngle}
                          endAngle={endAngle}
                          fill={fill}
                          opacity={0.3}
                        />
                      </g>
                    );
                  }}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {riskPie.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ background: "hsl(230 22% 10%)", border: "1px solid hsl(230 16% 18%)", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "hsl(220 20% 92%)" }}
                />
              </RPieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {riskPie.map((r) => (
                <div key={r.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                  {r.name} ({r.value})
                </div>
              ))}
            </div>
          </Card>
        </InteractiveCard>
      </motion.div>

        {/* Plan Distribution */}
        <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}>
          <InteractiveCard accent="cyan" className="h-full">
            <Card className="p-5 bg-card/40 border-border/20 backdrop-blur-sm h-full">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium">Plan Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={planBar} layout="vertical">
                <XAxis type="number" tick={{ fill: "hsl(220 12% 55%)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fill: "hsl(220 12% 55%)", fontSize: 11 }} />
                <Tooltip 
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ background: "hsl(230 22% 10%)", border: "1px solid hsl(230 16% 18%)", borderRadius: "8px", fontSize: "12px" }} 
                />
                <Bar 
                  dataKey="value" 
                  fill={COLORS.primary} 
                  radius={[0, 6, 6, 0]} 
                  activeBar={{ 
                    fill: "hsl(231 85% 70%)",
                    filter: "drop-shadow(0 0 8px hsl(231 85% 60% / 0.5))"
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </InteractiveCard>
      </motion.div>

        {/* Tier Distribution */}
        <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp}>
          <InteractiveCard accent="accent" className="h-full">
            <Card className="p-5 bg-card/40 border-border/20 backdrop-blur-sm h-full">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium">Enterprise Tier</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tierBar} layout="vertical">
                <XAxis type="number" tick={{ fill: "hsl(220 12% 55%)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fill: "hsl(220 12% 55%)", fontSize: 11 }} />
                <Tooltip 
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ background: "hsl(230 22% 10%)", border: "1px solid hsl(230 16% 18%)", borderRadius: "8px", fontSize: "12px" }} 
                />
                <Bar 
                  dataKey="value" 
                  fill={COLORS.accent} 
                  radius={[0, 6, 6, 0]} 
                  activeBar={{ 
                    fill: "hsl(262 90% 65%)",
                    filter: "drop-shadow(0 0 8px hsl(262 90% 50% / 0.5))"
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </InteractiveCard>
      </motion.div>
      </div>

      {/* Top Customers */}
      <motion.div custom={7} initial="hidden" animate="visible" variants={fadeUp}>
        <div className="bg-transparent space-y-4">
          <div className="flex items-center gap-2 px-2">
            <AlertTriangle className="w-4 h-4 text-destructive animate-pulse-glow" />
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground/80">Top High-Risk Customers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-transparent">
                  <th className="hud-header text-left">Account</th>
                  <th className="hud-header text-left">Email</th>
                  <th className="hud-header text-left">Plan</th>
                  <th className="hud-header text-left">Tier</th>
                  <th className="hud-header text-right">MRR</th>
                  <th className="hud-header text-right">Churn Prob</th>
                  <th className="hud-header text-left">Risk Status</th>
                </tr>
              </thead>
              <tbody>
                {riskData?.data?.map((c: any, i: number) => (
                    <motion.tr
                      key={c.account_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="table-row-glass group"
                  >
                    <td className="py-4 px-6 font-mono text-[11px] text-primary/80">{c.account_id}</td>
                    <td className="py-4 px-6 text-muted-foreground text-xs font-medium">{c.email}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] bg-foreground/5 text-foreground/70 border border-white/5 font-bold uppercase tracking-wider">{c.plan_type}</span>
                    </td>
                    <td className="py-4 px-6 text-[11px] font-bold text-foreground/60">{c.enterprise_tier}</td>
                    <td className="py-4 px-6 text-right font-mono text-xs font-bold text-foreground/90">${parseFloat(c.mrr_usd).toFixed(0)}</td>
                    <td className="py-4 px-6 text-right font-mono text-xs font-bold text-primary/80">{(parseFloat(c.churn_probability) * 100).toFixed(1)}%</td>
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
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div custom={8} initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="p-5 bg-card border-border/50">
            <span className="text-xs text-muted-foreground">Monthly Billing</span>
            <p className="text-xl font-bold mt-1">{stats.monthlyBilling?.toLocaleString()}</p>
          </Card>
        </motion.div>
        <motion.div custom={9} initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="p-5 bg-card border-border/50">
            <span className="text-xs text-muted-foreground">Annual Billing</span>
            <p className="text-xl font-bold mt-1">{stats.annualBilling?.toLocaleString()}</p>
          </Card>
        </motion.div>
        <motion.div custom={10} initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="p-5 bg-card border-border/50">
            <span className="text-xs text-muted-foreground">Total Audit Actions</span>
            <p className="text-xl font-bold mt-1">{stats.totalAuditLogs?.toLocaleString()}</p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
