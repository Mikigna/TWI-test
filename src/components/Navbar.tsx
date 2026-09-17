import React from "react";
import {
  LayoutDashboard,
  Grid3X3,
  FileSpreadsheet,
  Lightbulb,
  BookOpen,
  History,
  ShieldCheck,
  UserCheck,
  LogOut,
  SlidersHorizontal,
} from "lucide-react";
import { User, UserRole } from "../types";

export type NavTab = "dashboard" | "matrix" | "jib" | "jm" | "library" | "audit";

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User | null;
  onLogout: () => void;
  onSwitchUser: (role: UserRole) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  onSwitchUser,
  onOpenLogin,
}) => {
  const role = currentUser?.role || "VIEWER";

  // Permission checks by role
  const canAccessTab = (tab: NavTab): boolean => {
    if (!currentUser) return false;
    switch (tab) {
      case "dashboard":
        return true;
      case "matrix":
        return true; // All can view; Viewer only views
      case "jib":
        return true; // All can view/participate
      case "jm":
        return true; // All can view & submit ideas
      case "library":
        return role === "ADMIN" || role === "MANAGER" || role === "TRAINER";
      case "audit":
        return role === "ADMIN";
      default:
        return false;
    }
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "dashboard", label: "Обзор и риски", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "matrix", label: "Матрица компетенций", icon: <Grid3X3 className="w-4 h-4" /> },
    { id: "jib", label: "Инструктаж JIB", icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: "jm", label: "JM-предложения (ECRS)", icon: <Lightbulb className="w-4 h-4" /> },
    { id: "library", label: "Библиотека компетенций", icon: <BookOpen className="w-4 h-4" /> },
    { id: "audit", label: "Журнал аудита", icon: <History className="w-4 h-4" /> },
  ];

  const roleLabels: Record<UserRole, { label: string; color: string; desc: string }> = {
    ADMIN: { label: "Admin", color: "bg-purple-100 text-purple-800 border-purple-200", desc: "Полный доступ" },
    MANAGER: { label: "Manager", color: "bg-blue-100 text-blue-800 border-blue-200", desc: "Управление и утверждение" },
    TRAINER: { label: "Trainer", color: "bg-emerald-100 text-emerald-800 border-emerald-200", desc: "Создание JIB и оценка" },
    VIEWER: { label: "Viewer", color: "bg-slate-100 text-slate-700 border-slate-200", desc: "Только просмотр и идеи" },
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-xs font-bold text-lg tracking-wider">
              TWI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 tracking-tight">TWI Навигатор</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  AI Edition
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Job Instruction • Job Methods • Матрица компетенций
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const allowed = canAccessTab(item.id);
              if (!allowed) return null;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Role Switcher & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* Role Switcher Pill */}
                <div className="relative group">
                  <button
                    id="role-indicator-button"
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border ${
                      roleLabels[currentUser.role].color
                    }`}
                    title="Нажмите, чтобы сменить роль"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{roleLabels[currentUser.role].label}</span>
                    <SlidersHorizontal className="w-3 h-3 ml-0.5 opacity-60" />
                  </button>

                  {/* Dropdown for role switching */}
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 hidden group-hover:block z-50">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Быстрое переключение роли
                    </div>
                    {(["ADMIN", "MANAGER", "TRAINER", "VIEWER"] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => onSwitchUser(r)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                          currentUser.role === r ? "font-bold text-indigo-700 bg-indigo-50/50" : "text-slate-700"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{roleLabels[r].label}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{roleLabels[r].desc}</span>
                        </div>
                        {currentUser.role === r && <UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* User info */}
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">{currentUser.name}</span>
                  <span className="text-[11px] text-slate-500 leading-tight">{currentUser.department}</span>
                </div>

                {/* Logout Button */}
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login-open"
                onClick={onOpenLogin}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                Войти
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs Bar */}
        <div className="lg:hidden flex overflow-x-auto py-2 gap-1 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const allowed = canAccessTab(item.id);
            if (!allowed) return null;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
