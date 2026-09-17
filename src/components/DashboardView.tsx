import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  Lightbulb,
  Grid3X3,
  Users,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Competency, Employee, AssessmentRecord, JIBDocument, JMProposal, User } from "../types";
import { calculateMatrixStats } from "../utils/twiCalculations";
import { NavTab } from "./Navbar";

interface DashboardViewProps {
  employees: Employee[];
  competencies: Competency[];
  assessments: AssessmentRecord[];
  jibs: JIBDocument[];
  jmProposals: JMProposal[];
  currentUser: User | null;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  competencies,
  assessments,
  jibs,
  jmProposals,
  currentUser,
  onNavigate,
}) => {
  const { summary, employeeStatsMap, competencyStatsMap } = calculateMatrixStats(
    employees,
    competencies,
    assessments
  );

  const atRiskEmployees = employees.filter((e) => employeeStatsMap.get(e.id)?.isAtRisk);
  const criticalUncovered = competencies.filter(
    (c) => c.isCritical && competencyStatsMap.get(c.id)?.hasNoCarrier
  );
  const systemicDeficitComps = competencies.filter(
    (c) => competencyStatsMap.get(c.id)?.hasSystemicDeficit
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Grid3X3 className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Методология Training Within Industry (TWI) & ИИ
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Оперативная сводка производственной системы
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Мониторинг зон риска квалификации, канонических карт Job Instruction (JI), оптимизаций Job Methods (JM) по принципу ECRS и общего индекса соответствия (CI).
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={() => onNavigate("matrix")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-950 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Grid3X3 className="w-4 h-4 text-indigo-600" />
              <span>Перейти в матрицу компетенций</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => onNavigate("jib")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/40 text-white border border-indigo-400/40 font-semibold text-xs hover:bg-indigo-600/60 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-300" />
              <span>Открыть JIB инструктажи</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk zone counter */}
        <div
          onClick={() => onNavigate("matrix")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            summary.employeesAtRiskCount > 0
              ? "bg-rose-50/70 border-rose-200 hover:border-rose-300 shadow-xs"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Сотрудники в зоне риска
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-950">
              {summary.employeesAtRiskCount}
            </span>
            <span className="text-xs text-rose-600 font-medium">
              из {employees.length} чел.
            </span>
          </div>
          <p className="text-xs text-rose-700/80 mt-1">
            {summary.employeesAtRiskCount > 0
              ? "Требуется приоритетное обучение по стандарту TWI"
              : "Критических дефицитов квалификации нет"}
          </p>
        </div>

        {/* Critical competencies without single carrier */}
        <div
          onClick={() => onNavigate("matrix")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            criticalUncovered.length > 0
              ? "bg-amber-50/70 border-amber-200 hover:border-amber-300 shadow-xs"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Риск единой точки отказа
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-950">
              {criticalUncovered.length}
            </span>
            <span className="text-xs text-amber-700 font-medium">
              критич. навыков без носителя
            </span>
          </div>
          <p className="text-xs text-amber-800/80 mt-1">
            {criticalUncovered.length > 0
              ? "Нет ни одного работника с уровнем ≥ целевого"
              : "Все критические навыки покрыты мастерами"}
          </p>
        </div>

        {/* Compliance Index (CI) */}
        <div
          onClick={() => onNavigate("matrix")}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Индекс соответствия (CI)
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {summary.overallComplianceIndex}%
            </span>
            <span className={`text-xs font-semibold ${summary.overallComplianceIndex >= 70 ? "text-emerald-600" : "text-rose-600"}`}>
              {summary.overallComplianceIndex >= 70 ? "В норме (≥70%)" : "Ниже порога"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Средний балл по цеху: <strong>{summary.deptAvg}</strong> из 5.0
          </p>
        </div>

        {/* Active JIBs and JM count */}
        <div
          onClick={() => onNavigate("jm")}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Активы TWI (JIB & JM)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-bold text-slate-900">{jibs.length}</span>
              <span className="text-[11px] text-slate-400 block">Карт JIB</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-2xl font-bold text-emerald-700">{jmProposals.length}</span>
              <span className="text-[11px] text-slate-400 block">JM идей ECRS</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {jmProposals.filter((p) => p.status === "APPROVED" || p.status === "IMPLEMENTED").length} внедрено в производство
          </p>
        </div>
      </div>

      {/* Two Column Layout: Risk Analysis & 3 Pillars of TWI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Risk Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Зоны риска и дефициты квалификации (ТЗ п. 2.5)
                </h3>
                <p className="text-xs text-slate-500">
                  Автоматический расчет по формулам расхождения и триггерам красной подсветки
                </p>
              </div>
              <button
                onClick={() => onNavigate("matrix")}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                В матрицу <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {atRiskEmployees.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Все сотрудники соответствуют пороговым значениям (CI ≥ 70%, критических разрывов нет).
              </div>
            ) : (
              <div className="space-y-3">
                {atRiskEmployees.map((emp) => {
                  const stat = employeeStatsMap.get(emp.id);
                  return (
                    <div
                      key={emp.id}
                      className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {emp.fullName.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{emp.fullName}</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-rose-300 text-rose-800 font-medium">
                              CI: {stat?.complianceIndex}%
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            {emp.roleTitle} • {emp.department}
                          </div>
                          {stat?.riskReasons && stat.riskReasons.length > 0 && (
                            <ul className="mt-1.5 space-y-0.5">
                              {stat.riskReasons.map((r, idx) => (
                                <li key={idx} className="text-xs text-rose-700 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-xs text-slate-500">
                          Факт: <strong>{stat?.actualAvg}</strong> / Цель: {stat?.targetAvg}
                        </span>
                        <button
                          onClick={() => onNavigate("matrix")}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                        >
                          Назначить JIB
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Critical Competencies warning if any */}
          {systemicDeficitComps.length > 0 && (
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Системный дефицит по {systemicDeficitComps.length} компетенциям
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Средний балл по цеху отстает от целевого более чем на 1 балл:{" "}
                  {systemicDeficitComps.map((c) => c.title).join(", ")}. Рекомендуется организация группового тренинга TWI.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: 3 Pillars of TWI */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Три столпа методологии TWI
            </h3>

            <div className="space-y-4">
              {/* Pillar 1 */}
              <div
                onClick={() => onNavigate("jib")}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Job Instruction (JI)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  Производственный инструктаж
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Разбивка работы на 3 колонки: «Важные шаги», «Ключевые моменты» и «Причины». Обучение за 4 шага без брака.
                </p>
              </div>

              {/* Pillar 2 */}
              <div
                onClick={() => onNavigate("jm")}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Job Methods (JM)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  Методы работы и ECRS
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Системный анализ операций по 6 вопросам (Why, What, Where, When, Who, How) и принципу ECRS для устранения потерь.
                </p>
              </div>

              {/* Pillar 3 */}
              <div
                onClick={() => onNavigate("matrix")}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Grid3X3 className="w-3.5 h-3.5" />
                    Матрица компетенций
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  Тепловая карта навыков
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Визуальный учет уровней 1–5, выявление дефицитов квалификации и автоматический расчет индекса CI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
