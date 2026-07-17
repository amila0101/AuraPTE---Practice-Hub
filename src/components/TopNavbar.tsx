import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Mic,
  PenLine,
  BookOpenCheck,
  Headphones,
  BarChart3,
  ClipboardList,
  BookMarked,
  Download,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Trophy,
  Shield,
  Settings,
  MessageSquare,
  Target,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const practiceItems = [
  { label: "Speaking", icon: Mic, to: "/practice-list?type=speaking", color: "hsl(var(--speaking))" },
  { label: "Writing", icon: PenLine, to: "/practice-list?type=writing", color: "hsl(var(--info))" },
  { label: "Reading", icon: BookOpenCheck, to: "/practice-list?type=reading", color: "hsl(var(--warning))" },
  { label: "Listening", icon: Headphones, to: "/practice-list?type=listening", color: "hsl(var(--destructive))" },
  { label: "Predictions", icon: Target, to: "/predictions", color: "hsl(var(--primary))" },
];

const toolItems = [
  { label: "Vocab Book", icon: BookMarked, to: "/vocab" },
  { label: "Shadowing", icon: Mic, to: "/shadowing" },
  { label: "Study Materials", icon: Download, to: "/materials" },
  { label: "Courses", icon: BookOpen, to: "/courses" },
  { label: "Guides & Tips", icon: Target, to: "/guides" },
];

const Dropdown = ({
  label,
  items,
  isOpen,
  onToggle,
  onClose,
}: {
  label: string;
  items: { label: string; icon: any; to: string; color?: string }[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const isActive = items.some((item) => {
    if (item.to.includes("?")) return location.pathname + location.search === item.to;
    return location.pathname === item.to;
  });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`nav-link gap-1.5 ${isActive ? "nav-link-active" : ""}`}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl border-2 bg-card p-2 z-50" style={{ boxShadow: "var(--shadow-elevated)" }}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:bg-muted transition-colors"
            >
              <div
                className="flex items-center justify-center h-8 w-8 rounded-lg"
                style={{ background: item.color ? `${item.color}20` : "hsl(var(--muted))" }}
              >
                <item.icon className="h-4 w-4" style={{ color: item.color || "hsl(var(--foreground))" }} />
              </div>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const TopNavbar = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { data: isAdmin } = useIsAdmin();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const email = user?.email || "";
  const initials = email.substring(0, 2).toUpperCase();

  const isActive = (path: string) => {
    if (path.includes("?")) return location.pathname + location.search === path;
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-6 h-20 sm:h-24">
        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center">
          <img src="/assets/logo-aurapte.png" alt="AuraPTE Logo" className="h-16 sm:h-20 w-auto object-contain drop-shadow-md" />
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavLink to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "nav-link-active" : ""}`}>
            <LayoutDashboard className="h-4 w-4" />
            {t("dashboard")}
          </NavLink>
          <Dropdown
            label={t("practice")}
            items={practiceItems}
            isOpen={openDropdown === "practice"}
            onToggle={() => setOpenDropdown(openDropdown === "practice" ? null : "practice")}
            onClose={() => setOpenDropdown(null)}
          />
          <NavLink to="/mock-test" className={`nav-link ${isActive("/mock-test") ? "nav-link-active" : ""}`}>
            <ClipboardList className="h-4 w-4" />
            {t("mockTests")}
          </NavLink>
          <Dropdown
            label={t("tools")}
            items={toolItems}
            isOpen={openDropdown === "tools"}
            onToggle={() => setOpenDropdown(openDropdown === "tools" ? null : "tools")}
            onClose={() => setOpenDropdown(null)}
          />
          <NavLink to="/analytics" className={`nav-link ${isActive("/analytics") ? "nav-link-active" : ""}`}>
            <BarChart3 className="h-4 w-4" />
            {t("analytics")}
          </NavLink>
          <NavLink to="/leaderboard" className={`nav-link ${isActive("/leaderboard") ? "nav-link-active" : ""}`}>
            <Trophy className="h-4 w-4" />
            {t("leaderboard")}
          </NavLink>
          <NavLink to="/forum" className={`nav-link ${isActive("/forum") ? "nav-link-active" : ""}`}>
            <MessageSquare className="h-4 w-4" />
            Forum
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={`nav-link ${isActive("/admin") ? "nav-link-active" : ""}`}>
              <Shield className="h-4 w-4" />
              {t("admin")}
            </NavLink>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
            </button>
            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-2xl border-2 bg-card p-2 z-50" style={{ boxShadow: "var(--shadow-elevated)" }}>
                <div className="px-3 py-2 border-b mb-1">
                  <p className="text-xs font-bold text-foreground truncate">{email}</p>
                </div>
                <NavLink
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-foreground/80 hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  {t("settings")}
                </NavLink>
                <button
                  onClick={() => { signOut(); setProfileOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t("signOut")}
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-xl hover:bg-muted">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t-2 bg-card p-4 space-y-1">
          <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={`nav-link ${isActive("/dashboard") ? "nav-link-active" : ""}`}>
            <LayoutDashboard className="h-4 w-4" /> {t("dashboard")}
          </NavLink>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-1">{t("practice")}</p>
          {practiceItems.map((i) => (
            <NavLink key={i.to} to={i.to} onClick={() => setMobileOpen(false)} className={`nav-link ${isActive(i.to) ? "nav-link-active" : ""}`}>
              <i.icon className="h-4 w-4" /> {i.label}
            </NavLink>
          ))}
          <NavLink to="/mock-test" onClick={() => setMobileOpen(false)} className={`nav-link ${isActive("/mock-test") ? "nav-link-active" : ""}`}>
            <ClipboardList className="h-4 w-4" /> {t("mockTests")}
          </NavLink>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-wider px-3 pt-3 pb-1">{t("tools")}</p>
          {toolItems.map((i) => (
            <NavLink key={i.to} to={i.to} onClick={() => setMobileOpen(false)} className={`nav-link ${isActive(i.to) ? "nav-link-active" : ""}`}>
              <i.icon className="h-4 w-4" /> {i.label}
            </NavLink>
          ))}
          <NavLink to="/analytics" onClick={() => setMobileOpen(false)} className={`nav-link ${isActive("/analytics") ? "nav-link-active" : ""}`}>
            <BarChart3 className="h-4 w-4" /> {t("analytics")}
          </NavLink>
          <NavLink to="/leaderboard" onClick={() => setMobileOpen(false)} className={`nav-link ${isActive("/leaderboard") ? "nav-link-active" : ""}`}>
            <Trophy className="h-4 w-4" /> {t("leaderboard")}
          </NavLink>
          <NavLink to="/forum" onClick={() => setMobileOpen(false)} className={`nav-link ${isActive("/forum") ? "nav-link-active" : ""}`}>
            <MessageSquare className="h-4 w-4" /> Forum
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setMobileOpen(false)} className={`nav-link ${isActive("/admin") ? "nav-link-active" : ""}`}>
              <Shield className="h-4 w-4" /> {t("admin")}
            </NavLink>
          )}
          <NavLink to="/settings" onClick={() => setMobileOpen(false)} className={`nav-link ${isActive("/settings") ? "nav-link-active" : ""}`}>
            <Settings className="h-4 w-4" /> {t("settings")}
          </NavLink>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;
