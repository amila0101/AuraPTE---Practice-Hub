import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Mic,
  PenLine,
  BookOpenCheck,
  Headphones,
  BarChart3,
  Settings,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  BookMarked,
  Download,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Mock Tests", icon: ClipboardList, to: "/mock-test" },
];

const practiceCategories = [
  { label: "Speaking Practice", icon: Mic, to: "/practice-list?type=speaking" },
  { label: "Writing Practice", icon: PenLine, to: "/practice-list?type=writing" },
  { label: "Reading Practice", icon: BookOpenCheck, to: "/practice-list?type=reading" },
  { label: "Listening Practice", icon: Headphones, to: "/practice-list?type=listening" },
];

const tools = [
  { label: "Vocab Book", icon: BookMarked, to: "/vocab" },
  { label: "Shadowing", icon: Mic, to: "/shadowing" },
  { label: "Study Materials", icon: Download, to: "/materials" },
];

const bottomNav = [
  { label: "Analytics", icon: BarChart3, to: "/analytics" },
  { label: "Settings", icon: Settings, to: "/settings" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(true);
  const location = useLocation();
  const isPracticeActive = location.pathname === "/practice-list";

  const isActive = (path: string) => {
    if (path.includes("?")) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <span className={`text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted px-3 mb-2 block ${collapsed ? "sr-only" : ""}`}>
      {label}
    </span>
  );

  return (
    <aside
      className={`flex flex-col bg-secondary text-secondary-foreground transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      } min-h-screen`}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-5 border-b border-sidebar-border min-h-[80px] sm:min-h-[96px]">
        <img src="/assets/logo-aurapte.png" alt="AuraPTE Logo" className={`${collapsed ? 'h-10' : 'h-16 sm:h-20'} w-auto object-contain drop-shadow-md transition-all duration-300`} />
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <SectionLabel label="Menu" />
        {mainNav.map((item) => (
          <NavLink key={item.to} to={item.to} className={`nav-item ${isActive(item.to) ? "nav-item-active" : ""}`}>
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        <div className="pt-4">
          <SectionLabel label="Practice" />
          <button
            onClick={() => setPracticeOpen(!practiceOpen)}
            className={`nav-item w-full justify-between ${isPracticeActive ? "nav-item-active" : ""}`}
          >
            <span className="flex items-center gap-3">
              <BookOpen className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>Practice</span>}
            </span>
            {!collapsed && (
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${practiceOpen ? "rotate-180" : ""}`} />
            )}
          </button>
          {(practiceOpen || collapsed) && (
            <div className={collapsed ? "" : "ml-4 mt-1 space-y-0.5"}>
              {practiceCategories.map((item) => (
                <NavLink key={item.to} to={item.to} className={`nav-item ${isActive(item.to) ? "nav-item-active" : ""}`}>
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4">
          <SectionLabel label="Study Tools" />
          {tools.map((item) => (
            <NavLink key={item.to} to={item.to} className={`nav-item ${isActive(item.to) ? "nav-item-active" : ""}`}>
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-sidebar-border pt-3">
        {bottomNav.map((item) => (
          <NavLink key={item.to} to={item.to} className={`nav-item ${isActive(item.to) ? "nav-item-active" : ""}`}>
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
        <button onClick={() => setCollapsed(!collapsed)} className="nav-item w-full">
          {collapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
