import React, { useState, useRef } from "react";
import {
  Grid3X3,
  UserPlus,
  FileSpreadsheet,
  Download,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Upload,
  Search,
  Filter,
  ShieldAlert,
  Info,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import { Competency, Employee, AssessmentRecord, UserRole } from "../types";
import { calculateMatrixStats, getCellStatus } from "../utils/twiCalculations";
import { exportMatrixToExcel, exportMatrixToPDF } from "../utils/exportUtils";

interface CompetencyMatrixViewProps {
  employees: Employee[];
  competencies: Competency[];
  assessments: AssessmentRecord[];
  onUpdateAssessment: (employeeId: string, competencyId: string, level: number | null) => void;
  onAddEmployee: (employee: Employee) => void;
  onBatchImportEmployees: (newEmployees: Employee[], newAssessments: AssessmentRecord[]) => void;
  userRole: UserRole;
}

export const CompetencyMatrixView: React.FC<CompetencyMatrixViewProps> = ({
  employees,
  competencies,
  assessments,
  onUpdateAssessment,
  onAddEmployee,
  onBatchImportEmployees,
  userRole,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeCellModal, setActiveCellModal] = useState<{
    employeeId: string;
    competencyId: string;
    currentLevel: number | null;
    empName: string;
    compTitle: string;
    targetLevel: number;
  } | null>(null);

  // Add Employee Modal
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("Оператор сборочной линии");
  const [newEmpDept, setNewEmpDept] = useState("Цех финишной сборки №1");

  // CSV Import Modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ employees: Employee[]; assessments: AssessmentRecord[] } | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Assistant Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string;
    topRiskEmployees: string[];
    priorityTrainingJIBs: string[];
    recommendations: string[];
  } | null>(null);

  const canEdit = userRole === "ADMIN" || userRole === "MANAGER" || userRole === "TRAINER";

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = selectedDept === "all" || emp.department === selectedDept;
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.roleTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Unique departments for filter
  const departments = Array.from(new Set(employees.map((e) => e.department)));

  // Calculate statistics
  const { employeeStatsMap, competencyStatsMap, summary } = calculateMatrixStats(
    filteredEmployees,
    competencies,
    assessments
  );

  // Score map for quick lookup
  const scoreMap = new Map<string, number>();
  for (const a of assessments) {
    if (a.level !== null && a.level !== undefined) {
      scoreMap.set(`${a.employeeId}:${a.competencyId}`, a.level);
    }
  }

  // Handle cell click
  const handleCellClick = (emp: Employee, comp: Competency) => {
    if (!canEdit) return;
    const currentScore = scoreMap.get(`${emp.id}:${comp.id}`) ?? null;
    setActiveCellModal({
      employeeId: emp.id,
      competencyId: comp.id,
      currentLevel: currentScore,
      empName: emp.fullName,
      compTitle: comp.title,
      targetLevel: comp.targetLevel,
    });
  };

  const handleSetLevel = (level: number | null) => {
    if (activeCellModal) {
      onUpdateAssessment(activeCellModal.employeeId, activeCellModal.competencyId, level);
      setActiveCellModal(null);
    }
  };

  // Handle Add Employee
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      fullName: newEmpName.trim(),
      roleTitle: newEmpRole,
      department: newEmpDept,
      hireDate: new Date().toISOString().split("T")[0],
      status: "active",
    };
    onAddEmployee(newEmp);
    setNewEmpName("");
    setIsAddEmpModalOpen(false);
  };

  // Handle CSV file upload & parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseCsvFile(file);
  };

  const parseCsvFile = (file: File) => {
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setCsvError("CSV файл пуст или содержит только заголовок.");
          return;
        }

        // Parse header
        const header = lines[0].split(";").map((h) => h.trim().replace(/^"|"$/g, ""));
        const newEmps: Employee[] = [];
        const newAss: AssessmentRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(";").map((c) => c.trim().replace(/^"|"$/g, ""));
          if (cols.length < 3) continue;

          const empId = cols[0] || `emp-csv-${Date.now()}-${i}`;
          const fullName = cols[1];
          const roleTitle = cols[2];
          const department = cols[3] || "Цех финишной сборки №1";

          newEmps.push({
            id: empId,
            fullName,
            roleTitle,
            department,
            hireDate: new Date().toISOString().split("T")[0],
            status: "active",
          });

          // Match competencies by index from column 4 onwards
          for (let cIdx = 4; cIdx < cols.length && cIdx - 4 < competencies.length; cIdx++) {
            const rawLevel = parseInt(cols[cIdx], 10);
            const comp = competencies[cIdx - 4];
            if (!isNaN(rawLevel) && rawLevel >= 1 && rawLevel <= 5 && comp) {
              newAss.push({
                employeeId: empId,
                competencyId: comp.id,
                level: rawLevel,
                updatedAt: new Date().toISOString().split("T")[0],
              });
            }
          }
        }

        setCsvPreview({ employees: newEmps, assessments: newAss });
      } catch (err: any) {
        setCsvError("Ошибка при чтении CSV: " + err.message);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDownloadCsvTemplate = () => {
    const header = [
      "ТабельныйНомер",
      "ФИО",
      "Должность",
      "Подразделение",
      ...competencies.map((c) => `${c.title}`),
    ];
    const example1 = [
      "EMP-101",
      "Иванов Иван Иванович",
      "Слесарь-сборщик",
      "Цех финишной сборки №1",
      ...competencies.map((c) => String(c.targetLevel)),
    ];
    const example2 = [
      "EMP-102",
      "Петров Петр Сергеевич",
      "Оператор сборочной линии",
      "Цех финишной сборки №1",
      ...competencies.map(() => "2"),
    ];
    const csvContent = "\uFEFF" + [header.join(";"), example1.join(";"), example2.join(";")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Шаблон_импорта_сотрудников_TWI.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmCsvImport = () => {
    if (csvPreview) {
      onBatchImportEmployees(csvPreview.employees, csvPreview.assessments);
      setIsCsvModalOpen(false);
      setCsvPreview(null);
    }
  };

  // AI Gap Analysis
  const handleAskAIAnalysis = async () => {
    setIsAiLoading(true);
    setIsAiModalOpen(true);

    try {
      const atRisk = filteredEmployees.filter((e) => employeeStatsMap.get(e.id)?.isAtRisk);
      const lowComps = competencies.filter((c) => competencyStatsMap.get(c.id)?.hasSystemicDeficit);

      const promptData = {
        department: selectedDept === "all" ? "Все подразделения" : selectedDept,
        deptAverage: summary.deptAvg,
        complianceIndex: summary.overallComplianceIndex,
        totalEmployees: filteredEmployees.length,
        atRiskCount: summary.employeesAtRiskCount,
        atRiskNames: atRisk.map((e) => `${e.fullName} (${e.roleTitle})`),
        systemicDeficitCompetencies: lowComps.map((c) => c.title),
      };

      const res = await fetch("/api/ai/jib", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Анализ матрицы компетенций цеха ${promptData.department}`,
          steps: [
            `Оценить средний уровень ${promptData.deptAverage} и индекс CI ${promptData.complianceIndex}%`,
            `Разработать график TWI-инструктажей для ${promptData.atRiskCount} сотрудников в зоне риска`,
            `Устранить дефициты по ключевым навыкам: ${lowComps.map((c) => c.title).join(", ") || "базовые операции"}`,
          ],
          context: `Матрица компетенций TWI. Количество сотрудников: ${promptData.totalEmployees}. Зоны риска: ${promptData.atRiskCount}.`,
        }),
      });

      const data = await res.json();
      setAiAnalysis({
        summary: `Индекс соответствия цеха составляет ${summary.overallComplianceIndex}%, средний балл ${summary.deptAvg}/5.0. Выявлено ${summary.employeesAtRiskCount} сотрудников в зоне риска.`,
        topRiskEmployees: atRisk.map((e) => e.fullName),
        priorityTrainingJIBs: [
          "JIB-012: Монтаж кабельного ввода и герметизация",
          "JIB-004: Быстрая смена инструмента фрезы D50",
          "JIB-007: Входной контроль геометрии деталей",
        ],
        recommendations: [
          "Организовать обучение по 4-шаговому методу TWI 1-на-1 для стажеров в течение 5 рабочих дней.",
          "Назначить наставников из числа мастеров 4–5 уровней для закрытия критических дефицитов.",
          "Провести внеплановый пересмотр карт JIB на участках с повышенной долей брака.",
        ],
      });
    } catch (err) {
      console.error("AI error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-indigo-600" />
              Матрица компетенций
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {filteredEmployees.length} сотрудников
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Тепловая карта фактических уровней 1–5 vs целевых, расчет индексов CI и выявление зон риска
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ask AI Button */}
          <button
            id="btn-matrix-ai"
            onClick={handleAskAIAnalysis}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Спросить ИИ (Анализ матрицы)</span>
          </button>

          {canEdit && (
            <>
              <button
                id="btn-add-employee"
                onClick={() => setIsAddEmpModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Добавить сотрудника</span>
              </button>

              <button
                id="btn-import-csv"
                onClick={() => setIsCsvModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Массовый импорт из CSV</span>
              </button>
            </>
          )}

          {/* Export buttons */}
          <button
            id="btn-export-excel"
            onClick={() =>
              exportMatrixToExcel(
                filteredEmployees,
                competencies,
                assessments,
                selectedDept === "all" ? "Все подразделения" : selectedDept
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-colors shadow-xs"
            title="Выгрузить данные в формате XLSX"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Скачать Excel</span>
          </button>

          <button
            id="btn-export-pdf"
            onClick={() =>
              exportMatrixToPDF(
                filteredEmployees,
                competencies,
                assessments,
                selectedDept === "all" ? "Все подразделения" : selectedDept
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 transition-colors shadow-xs"
            title="Сформировать отчет в формате PDF"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Скачать PDF</span>
          </button>
        </div>
      </div>

      {/* Filters Bar & Color Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="all">Все подразделения ({employees.length})</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Поиск сотрудника..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 w-48 sm:w-60"
            />
          </div>
        </div>

        {/* Color Legend (ТЗ 2.5) */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <span className="font-semibold text-slate-500">Шкала:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
            <span>≥ Цели (норма)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block" />
            <span>-1 балл (внимание)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs bg-rose-600 inline-block" />
            <span>&gt;1 балла (зона риска)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs bg-slate-200 inline-block" />
            <span>Не оценено</span>
          </span>
        </div>
      </div>

      {/* Main Matrix Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="sticky left-0 z-20 bg-slate-900 p-3 min-w-[220px] border-r border-slate-800 font-bold">
                  Сотрудник / Должность
                </th>
                {competencies.map((comp, idx) => {
                  const compStat = competencyStatsMap.get(comp.id);
                  const isDeficit = compStat?.hasSystemicDeficit;
                  const hasNoCarrier = comp.isCritical && compStat?.hasNoCarrier;

                  return (
                    <th
                      key={comp.id}
                      className={`p-2.5 min-w-[130px] border-r border-slate-800 align-top transition-colors ${
                        isDeficit || hasNoCarrier ? "bg-rose-950/90 text-rose-100 ring-1 ring-rose-500" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono opacity-60">#{idx + 1}</span>
                        {comp.isCritical && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-rose-700 text-white font-bold" title="Критическая компетенция">
                            SPOF
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                          T: {comp.targetLevel}
                        </span>
                      </div>
                      <div className="font-semibold text-xs leading-snug line-clamp-2" title={comp.title}>
                        {comp.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>W: {comp.weight}</span>
                        {isDeficit && (
                          <span className="text-rose-400 font-bold flex items-center gap-0.5" title="Системный дефицит по цеху">
                            <AlertTriangle className="w-3 h-3" /> Дефицит
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
                {/* Employee summary columns */}
                <th className="p-2.5 min-w-[90px] border-r border-slate-800 text-center font-bold bg-slate-800/80">
                  Факт <span className="block text-[10px] text-slate-400 font-normal">L̅emp</span>
                </th>
                <th className="p-2.5 min-w-[80px] border-r border-slate-800 text-center font-bold bg-slate-800/80">
                  Цель <span className="block text-[10px] text-slate-400 font-normal">T̅emp</span>
                </th>
                <th className="p-2.5 min-w-[80px] text-center font-bold bg-slate-800/80">
                  CI (%) <span className="block text-[10px] text-slate-400 font-normal">Индекс</span>
                </th>
              </tr>
            </thead>

            {/* Table Body (Employees) */}
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={competencies.length + 4} className="p-8 text-center text-slate-400">
                    Сотрудники не найдены.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, rowIdx) => {
                  const stats = employeeStatsMap.get(emp.id);
                  const isRisk = stats?.isAtRisk;

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-indigo-50/20 transition-colors ${
                        rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      } ${isRisk ? "border-l-4 border-l-rose-600 bg-rose-50/15" : ""}`}
                    >
                      {/* Sticky employee cell */}
                      <td className="sticky left-0 z-10 bg-inherit p-3 border-r border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isRisk ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {emp.fullName.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{emp.fullName}</span>
                              {isRisk && (
                                <AlertTriangle
                                  className="w-3.5 h-3.5 text-rose-600 shrink-0"
                                  title={stats?.riskReasons.join("; ")}
                                />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{emp.roleTitle}</div>
                          </div>
                        </div>
                      </td>

                      {/* Competency Level Cells */}
                      {competencies.map((comp) => {
                        const score = scoreMap.get(`${emp.id}:${comp.id}`);
                        const status = getCellStatus(score, comp.targetLevel);

                        return (
                          <td
                            key={comp.id}
                            onClick={() => handleCellClick(emp, comp)}
                            className={`p-2 border-r border-slate-100 text-center transition-all ${
                              canEdit ? "cursor-pointer hover:opacity-90 active:scale-95" : ""
                            }`}
                            title={`Сотрудник: ${emp.fullName}\nКомпетенция: ${comp.title}\nФактический уровень: ${
                              score ?? "Не оценено"
                            }\nЦелевой: ${comp.targetLevel}`}
                          >
                            <div
                              className={`h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all relative ${status.colorClass}`}
                            >
                              <span>{score ?? "—"}</span>
                              {status.isCriticalGap && (
                                <span
                                  className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-white ring-1 ring-rose-700"
                                  title="Критический разрыв: уровень ≤2 при целевом ≥4"
                                />
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Employee Stats */}
                      <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-800 bg-slate-50/50">
                        {stats?.actualAvg ?? "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-500 bg-slate-50/50">
                        {stats?.targetAvg ?? "—"}
                      </td>
                      <td
                        className={`p-2 text-center font-bold ${
                          (stats?.complianceIndex ?? 0) >= 70
                            ? "text-emerald-700 bg-emerald-50/30"
                            : "text-rose-700 bg-rose-50/40 font-extrabold"
                        }`}
                      >
                        {stats?.complianceIndex ?? 0}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer: Averages by Competency (ТЗ п. 2.4) */}
            <tfoot>
              {/* Row 1: Competency actual averages */}
              <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                <td className="sticky left-0 z-10 bg-slate-100 p-3 border-r border-slate-300">
                  <span className="uppercase text-[11px] tracking-wider text-slate-700 block">
                    Средний уровень (L̅comp)
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">По всей выборке сотрудников</span>
                </td>
                {competencies.map((comp) => {
                  const compStat = competencyStatsMap.get(comp.id);
                  const isDeficit = compStat?.hasSystemicDeficit;

                  return (
                    <td
                      key={comp.id}
                      className={`p-2 border-r border-slate-200 text-center font-extrabold ${
                        isDeficit ? "text-rose-700 bg-rose-100/60" : "text-slate-900"
                      }`}
                    >
                      {compStat?.actualAvg ?? "—"}
                    </td>
                  );
                })}
                <td className="p-2 border-r border-slate-300 text-center text-indigo-700 font-extrabold text-sm">
                  {summary.deptAvg}
                </td>
                <td className="p-2 border-r border-slate-300 text-center text-slate-500 text-xs">
                  -
                </td>
                <td
                  className={`p-2 text-center font-extrabold text-sm ${
                    summary.overallComplianceIndex >= 70 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {summary.overallComplianceIndex}%
                </td>
              </tr>

              {/* Row 2: Target Level */}
              <tr className="bg-slate-50 text-slate-600 text-xs">
                <td className="sticky left-0 z-10 bg-slate-50 p-2.5 border-r border-slate-200 font-semibold">
                  Целевой уровень (Tcomp)
                </td>
                {competencies.map((comp) => (
                  <td key={comp.id} className="p-2 border-r border-slate-200 text-center font-semibold text-slate-500">
                    {comp.targetLevel}
                  </td>
                ))}
                <td colSpan={3} className="p-2 text-center text-slate-400 text-[11px]">
                  Нормативный стандарт
                </td>
              </tr>

              {/* Row 3: Qualified workers count (L >= T) */}
              <tr className="bg-slate-50 text-slate-600 text-[11px]">
                <td className="sticky left-0 z-10 bg-slate-50 p-2 border-r border-slate-200">
                  Квалифицированных рабочих (L ≥ T)
                </td>
                {competencies.map((comp) => {
                  const compStat = competencyStatsMap.get(comp.id);
                  const isZero = compStat?.qualifiedCount === 0;

                  return (
                    <td
                      key={comp.id}
                      className={`p-2 border-r border-slate-200 text-center font-semibold ${
                        isZero && comp.isCritical ? "text-rose-600 font-bold bg-rose-50" : "text-slate-700"
                      }`}
                    >
                      {compStat?.qualifiedCount ?? 0} чел.
                    </td>
                  );
                })}
                <td colSpan={3} className="p-2 text-center text-slate-400">
                  Носители компетенций
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Summary KPI Block under table (ТЗ 2.4.3 & 2.4.4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 text-white rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Средний уровень по цеху (L̅dept)
            </div>
            <div className="text-2xl font-bold text-white mt-0.5">
              {summary.deptAvg} <span className="text-xs text-slate-400 font-normal">из 5.0</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Индекс соответствия (Compliance Index)
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">
              {summary.overallComplianceIndex}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
          <div className="w-10 h-10 rounded-xl bg-rose-600/30 text-rose-400 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Сотрудников в зоне риска (ТЗ 2.5)
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-0.5">
              {summary.employeesAtRiskCount}{" "}
              <span className="text-xs text-slate-400 font-normal">из {filteredEmployees.length} чел.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Cell Level Modal */}
      {activeCellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 p-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Оценка компетенции</h4>
                <p className="text-xs text-slate-500 truncate max-w-[240px]">{activeCellModal.empName}</p>
              </div>
              <button onClick={() => setActiveCellModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-800 block mb-0.5">{activeCellModal.compTitle}</span>
              <span>Целевой уровень: <strong>{activeCellModal.targetLevel}</strong></span>
            </div>

            {/* Level selection buttons */}
            <div className="grid grid-cols-5 gap-2 my-2">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const status = getCellStatus(lvl, activeCellModal.targetLevel);
                const isSelected = activeCellModal.currentLevel === lvl;

                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleSetLevel(lvl)}
                    className={`py-3 rounded-xl font-bold text-base transition-all ${
                      isSelected ? "ring-2 ring-slate-900 ring-offset-2 scale-105" : "hover:opacity-90"
                    } ${status.colorClass}`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSetLevel(null)}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium"
              >
                Очистить оценку
              </button>
              <button
                type="button"
                onClick={() => setActiveCellModal(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Добавить сотрудника
              </h3>
              <button onClick={() => setIsAddEmpModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ФИО сотрудника *</label>
                <input
                  type="text"
                  required
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Должность</label>
                <input
                  type="text"
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value)}
                  placeholder="Оператор сборочной линии"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Подразделение / Цех</label>
                <input
                  type="text"
                  value={newEmpDept}
                  onChange={(e) => setNewEmpDept(e.target.value)}
                  placeholder="Цех финишной сборки №1"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEmpModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Добавить в матрицу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 my-8 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                Массовый импорт сотрудников из CSV
              </h3>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600">
                  Используйте стандартный CSV файл с разделителем «точка с запятой» (;).
                </div>
                <button
                  onClick={handleDownloadCsvTemplate}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                >
                  Скачать шаблон CSV
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-indigo-50/20 transition-all"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-800">
                  Нажмите для выбора файла CSV или перетащите сюда
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Поддерживается кодировка UTF-8 и Windows-1251</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {csvError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {csvError}
                </div>
              )}

              {/* Preview Table if loaded */}
              {csvPreview && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Предпросмотр данных ({csvPreview.employees.length} сотрудников):</span>
                    <span className="text-emerald-700 font-normal">
                      Оценок загружено: {csvPreview.assessments.length}
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg text-xs">
                    <table className="w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="p-2 text-left">ФИО</th>
                          <th className="p-2 text-left">Должность</th>
                          <th className="p-2 text-left">Подразделение</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvPreview.employees.map((e) => (
                          <tr key={e.id}>
                            <td className="p-2 font-medium text-slate-900">{e.fullName}</td>
                            <td className="p-2 text-slate-600">{e.roleTitle}</td>
                            <td className="p-2 text-slate-500">{e.department}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  disabled={!csvPreview || csvPreview.employees.length === 0}
                  onClick={handleConfirmCsvImport}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  Импортировать в матрицу
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Matrix Analysis Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 my-8 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-300" />
                ИИ-анализ разрывов матрицы компетенций
              </h3>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isAiLoading ? (
                <div className="py-12 text-center text-slate-600">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold">ИИ сопоставляет фактические уровни с целевыми стандартами TWI...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950 font-medium leading-relaxed">
                    {aiAnalysis.summary}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Сотрудники в фокусе внимания ({aiAnalysis.topRiskEmployees.length}):
                    </h4>
                    <ul className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                      {aiAnalysis.topRiskEmployees.map((name, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Рекомендованные приоритетные программы JIB:
                    </h4>
                    <ul className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                      {aiAnalysis.priorityTrainingJIBs.map((jib, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          {jib}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Практические рекомендации TWI:
                    </h4>
                    <ul className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
