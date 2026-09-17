import React, { useState } from "react";
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight, X } from "lucide-react";
import { User, UserRole } from "../types";
import { INITIAL_USERS } from "../data/initialData";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState("admin@twinavigator.pro");
  const [password, setPassword] = useState("••••••••");
  const [selectedRole, setSelectedRole] = useState<UserRole>("ADMIN");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = INITIAL_USERS.find((u) => u.role === selectedRole) || INITIAL_USERS[0];
    onLogin(user);
    onClose();
  };

  const handleQuickSelect = (role: UserRole) => {
    setSelectedRole(role);
    const user = INITIAL_USERS.find((u) => u.role === role);
    if (user) {
      setEmail(user.email);
    }
  };

  const roleDetails: Record<UserRole, { title: string; color: string; desc: string; access: string }> = {
    ADMIN: {
      title: "Администратор (Admin)",
      color: "border-purple-300 bg-purple-50 text-purple-900",
      desc: "Полный доступ ко всей системе",
      access: "Все разделы, управление библиотекой, аудит, настройки",
    },
    MANAGER: {
      title: "Руководитель (Manager)",
      color: "border-blue-300 bg-blue-50 text-blue-900",
      desc: "Управление матрицей цеха и согласование",
      access: "Матрица, утверждение JM-предложений, библиотека (чтение/правка)",
    },
    TRAINER: {
      title: "TWI-тренер (Trainer)",
      color: "border-emerald-300 bg-emerald-50 text-emerald-900",
      desc: "Инструктаж и развитие навыков",
      access: "Создание/редактирование JIB, подача JM, оценка сотрудников",
    },
    VIEWER: {
      title: "Сотрудник / Наблюдатель (Viewer)",
      color: "border-slate-300 bg-slate-50 text-slate-800",
      desc: "Только просмотр и подача идей",
      access: "Просмотр своих компетенций и JIB, подача JM-предложений",
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Вход в TWI Навигатор
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Выберите роль доступа или введите учетные данные
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Role Selection Cards */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
              Быстрый вход под ролью:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(["ADMIN", "MANAGER", "TRAINER", "VIEWER"] as UserRole[]).map((r) => {
                const info = roleDetails[r];
                const isSelected = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleQuickSelect(r)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${info.color} ring-2 ring-indigo-600 ring-offset-1`
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{r}</span>
                      {isSelected && <UserCheck className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 font-medium leading-tight">
                      {info.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Рабочий Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Пароль
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Access Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Доступные функции: </span>
              {roleDetails[selectedRole].access}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-login-submit"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Войти как {roleDetails[selectedRole].title.split(" ")[0]}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
