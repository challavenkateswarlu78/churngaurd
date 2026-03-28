import { LayoutDashboard, Users, ScrollText, Sparkles, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

import { ThemeToggle } from "./ThemeToggle";

import { GlobalEffects } from "./GlobalEffects";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/audit-logs", icon: ScrollText, label: "Audit Logs" },
  { to: "/ai-assistant", icon: Sparkles, label: "AI Assistant" },
];

export default function AppLayout() {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem("churnguard_auth");
    navigate("/login", { replace: true });
  };
  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <GlobalEffects />
      
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-64 border-r border-border/50 glass-premium flex flex-col shrink-0 z-10"
      >
        <div className="px-6 py-8 border-b border-border/10">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-display tracking-tight"
          >
            <span className="text-gradient">ChurnGuard</span>
          </motion.h1>
          <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.4 }}
             className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1 font-bold"
          >
            NexaCloud Intelligence
          </motion.p>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {links.map((link, idx) => (
            <motion.div
              key={link.to}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * idx + 0.4 }}
            >
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-primary/10 text-primary glow-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]"
                  }`
                }
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="px-6 py-4 border-t border-border/10 flex flex-col gap-4"
        >
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Optimal</span>
            </div>
            <ThemeToggle />
          </div>
        </motion.div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 relative z-0 flex flex-col h-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 h-full w-full relative"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
