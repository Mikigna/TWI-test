import React, { useState } from "react";
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Sparkles,
  Download,
  FileDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Shield,
  Wrench,
  Package,
  Calendar,
  User,
  Info,
  ChevronRight,
  Loader2,
  AlertCircle,
  Copy,
} from "lucide-react";
import { JIBDocument, JIBRow, UserRole } from "../types";
import { exportJIBToExcel, exportJIBToPDF } from "../utils/exportUtils";

interface JIBViewProps {
  jibs: JIBDocument[];
  onUpdateJIB: (jib: JIBDocument) => void;
  onAddJIB: (jib: JIBDocument) => void;
  userRole: UserRole;
}

export const JIBView: React.FC<JIBViewProps> = ({
  jibs,
  onUpdateJIB,
  onAddJIB,
  userRole,
}) => {
  const [selectedJibId, setSelectedJibId] = useState<string>(jibs[0]?.id || "");
  const activeJib = jibs.find((j) => j.id === selectedJibId) || jibs[0];

  // AI State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    steps: string[];
    keyPoints: string[];
    reasons: string[];
    summaryNotes?: string;
  } | null>(null);
  const [aiContextInput, setAiContextInput] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);

  const canEdit = userRole === "ADMIN" || userRole === "MANAGER" || userRole === "TRAINER";

  // Modify active JIB fields
  const handleFieldChange = (field: keyof JIBDocument, value: any) => {
    if (!activeJib || !canEdit) return;
    const updated = { ...activeJib, [field]: value };
    onUpdateJIB(updated);
  };

  // Modify rows
  const handleRowChange = (index: number, field: keyof JIBRow, value: any) => {
    if (!activeJib || !canEdit) return;
    const newRows = [...activeJib.rows];
    newRows[index] = { ...newRows[index], [field]: value };
    handleFieldChange("rows", newRows);
  };

  const handleAddRow = () => {
    if (!activeJib || !canEdit) return;
    const newRow: JIBRow = {
      id: `row-${Date.now()}`,
      stepNumber: activeJib.rows.length + 1,
      step: "",
      keyPoint: "",
      reason: "",
    };
    handleFieldChange("rows", [...activeJib.rows, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    if (!activeJib || !canEdit) return;
    const newRows = activeJib.rows
      .filter((_, idx) => idx !== index)
      .map((r, idx) => ({ ...r, stepNumber: idx + 1 }));
    handleFieldChange("rows", newRows);
  };

  const handleMoveRow = (index: number, direction: "up" | "down") => {
    if (!activeJib || !canEdit) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeJib.rows.length) return;

    const newRows = [...activeJib.rows];
    const temp = newRows[index];
    newRows[index] = newRows[targetIndex];
    newRows[targetIndex] = temp;

    const renumbered = newRows.map((r, idx) => ({ ...r, stepNumber: idx + 1 }));
    handleFieldChange("rows", renumbered);
  };

  // Create new JIB
  const handleCreateNewJIB = () => {
    const newDoc: JIBDocument = {
      id: `jib-${Date.now()}`,
      title: "Новая стандартная операция",
      code: `JIB-${new Date().getFullYear()}-${String(jibs.length + 1).padStart(3, "0")}`,
      operation: "Технологическая операция",
      department: "Цех финишной сборки №1",
      author: "Инженер по стандартизации",
      trainer: "TWI-тренер",
      date: new Date().toISOString().split("T")[0],
      revision: "1.0",
      tools: "Стандартный набор инструмента",
      materials: "Комплектующие согласно спецификации",
      safetyNotes: "Защитные очки, перчатки, спецобувь",
      rows: [
        {
          id: `row-1`,
          stepNumber: 1,
          step: "Подготовить рабочее место и проверить комплектацию",
          keyPoint: "Сверить номер партии по чертежу; разложить инструмент слева направо",
          reason: "Исключить установку несоответствующих деталей; эргономика движений без лишних наклонов",
        },
      ],
    };
    onAddJIB(newDoc);
    setSelectedJibId(newDoc.id);
  };

  // Ask AI
  const handleAskAI = async () => {
    if (!activeJib) return;
    setIsAiLoading(true);
    setShowAiPanel(true);
    setAiResult(null);

    try {
      const existingSteps = activeJib.rows.map((r) => r.step).filter(Boolean);
      const res = await fetch("/api/ai/jib", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeJib.title,
          steps: existingSteps.length > 0 ? existingSteps : ["Выполнить сборку узла согласно технологическому регламенту"],
          context: `Операция: ${activeJib.operation}. Инструменты: ${activeJib.tools}. Безопасность: ${activeJib.safetyNotes}. Доп. контекст: ${aiContextInput}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiResult(data.data);
      }
    } catch (err) {
      console.error("AI JIB error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply AI Steps to table
  const handleApplyAiSteps = () => {
    if (!aiResult || !activeJib || !canEdit) return;
    const newRows: JIBRow[] = aiResult.steps.map((step, idx) => ({
      id: `row-ai-${Date.now()}-${idx}`,
      stepNumber: idx + 1,
      step: step,
      keyPoint: aiResult.keyPoints[idx] || "Соблюдать соосность и усилие затяжки",
      reason: aiResult.reasons[idx] || "Обеспечение надежности соединения и предотвращение брака",
    }));

    handleFieldChange("rows", newRows);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Selector & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Инструктаж JIB (Job Instruction Breakdown)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              Стандарт TWI (3 колонки)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Каноническая разбивка работы: «Важные шаги» (что делать), «Ключевые моменты» (как делать) и «Причины» (почему)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ask AI Button (Crucial requirement!) */}
          <button
            id="btn-jib-ai"
            onClick={handleAskAI}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Спросить ИИ (TWI разбивка)</span>
          </button>

          {canEdit && (
            <button
              id="btn-add-step"
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить шаг</span>
            </button>
          )}

          {canEdit && (
            <button
              id="btn-new-jib"
              onClick={handleCreateNewJIB}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Новый JIB</span>
            </button>
          )}

          {/* Export PDF */}
          <button
            id="btn-export-jib-pdf"
            onClick={() => exportJIBToPDF(activeJib)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 transition-colors shadow-xs"
            title="Выгрузить карту JIB в формате PDF для производственного поста"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Скачать PDF</span>
          </button>

          {/* Export Excel */}
          <button
            id="btn-export-jib-excel"
            onClick={() => exportJIBToExcel(activeJib)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-colors shadow-xs"
            title="Выгрузить в Excel"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>Скачать Excel</span>
          </button>
        </div>
      </div>

      {/* JIB Documents Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {jibs.map((j) => {
          const isSelected = j.id === selectedJibId;
          return (
            <button
              key={j.id}
              onClick={() => setSelectedJibId(j.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="font-mono text-[11px] opacity-75">{j.code}</span>
              <span className="max-w-[200px] truncate">{j.title}</span>
            </button>
          );
        })}
      </div>

      {/* Document Metadata Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Наименование работы / операции
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={activeJib.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              className="w-full font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Код JIB и ревизия
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                disabled={!canEdit}
                value={activeJib.code}
                onChange={(e) => handleFieldChange("code", e.target.value)}
                className="w-2/3 font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
              <input
                type="text"
                disabled={!canEdit}
                value={activeJib.revision}
                onChange={(e) => handleFieldChange("revision", e.target.value)}
                placeholder="Rev"
                className="w-1/3 text-center text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Подразделение / Цех
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={activeJib.department}
              onChange={(e) => handleFieldChange("department", e.target.value)}
              className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Составитель и Тренер TWI
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                disabled={!canEdit}
                value={activeJib.author}
                onChange={(e) => handleFieldChange("author", e.target.value)}
                placeholder="Автор"
                className="w-1/2 text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
              <input
                type="text"
                disabled={!canEdit}
                value={activeJib.trainer}
                onChange={(e) => handleFieldChange("trainer", e.target.value)}
                placeholder="Тренер"
                className="w-1/2 text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
          </div>
        </div>

        {/* Second row of metadata: Tools, Materials, Safety Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <Wrench className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
            <div className="w-full">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 block">
                Инструменты и оснастка
              </span>
              <input
                type="text"
                disabled={!canEdit}
                value={activeJib.tools}
                onChange={(e) => handleFieldChange("tools", e.target.value)}
                className="w-full text-xs text-slate-800 bg-transparent border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <Package className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
            <div className="w-full">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 block">
                Материалы и детали
              </span>
              <input
                type="text"
                disabled={!canEdit}
                value={activeJib.materials}
                onChange={(e) => handleFieldChange("materials", e.target.value)}
                className="w-full text-xs text-slate-800 bg-transparent border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
            <Shield className="w-4 h-4 text-rose-500 mt-1 shrink-0" />
            <div className="w-full">
              <span className="font-bold text-[10px] uppercase tracking-wider text-rose-700 block">
                Требования безопасности (СИЗ)
              </span>
              <input
                type="text"
                disabled={!canEdit}
                value={activeJib.safetyNotes}
                onChange={(e) => handleFieldChange("safetyNotes", e.target.value)}
                className="w-full text-xs text-rose-900 bg-transparent border-none p-0 focus:ring-0 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Canonical TWI Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 w-12 text-center border-r border-slate-800 font-bold">№</th>
                <th className="p-3 w-1/3 border-r border-slate-800 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <span>ВАЖНЫЕ ШАГИ (Important Steps)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                    Логический этап операции, продвигающий работу вперед
                  </span>
                </th>
                <th className="p-3 w-1/3 border-r border-slate-800 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                      2
                    </span>
                    <span>КЛЮЧЕВЫЕ МОМЕНТЫ (Key Points)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                    Безопасность, качество, сноровка («фишка» мастера)
                  </span>
                </th>
                <th className="p-3 w-1/3 border-r border-slate-800 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                      3
                    </span>
                    <span>ПРИЧИНЫ (Reasons Why)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                    Почему именно так? Предотвращение брака и травм
                  </span>
                </th>
                {canEdit && <th className="p-3 w-16 text-center font-bold">Действия</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {activeJib.rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Step Number */}
                  <td className="p-3 text-center font-bold text-slate-700 bg-slate-50/70 border-r border-slate-200">
                    {row.stepNumber}
                  </td>

                  {/* Column 1: Important Step */}
                  <td className="p-3 border-r border-slate-200 align-top">
                    {canEdit ? (
                      <textarea
                        rows={3}
                        value={row.step}
                        onChange={(e) => handleRowChange(index, "step", e.target.value)}
                        placeholder="Что делается? (действие с объектом)..."
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white font-medium text-slate-900"
                      />
                    ) : (
                      <div className="text-xs font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {row.step}
                      </div>
                    )}
                  </td>

                  {/* Column 2: Key Point */}
                  <td className="p-3 border-r border-slate-200 align-top bg-amber-50/15">
                    {canEdit ? (
                      <textarea
                        rows={3}
                        value={row.keyPoint}
                        onChange={(e) => handleRowChange(index, "keyPoint", e.target.value)}
                        placeholder="Как делается? (усилие, угол, щелчок, СИЗ)..."
                        className="w-full text-xs p-2 rounded-lg border border-amber-200 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 bg-white text-slate-800"
                      />
                    ) : (
                      <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {row.keyPoint}
                      </div>
                    )}
                  </td>

                  {/* Column 3: Reason Why */}
                  <td className="p-3 border-r border-slate-200 align-top bg-emerald-50/15">
                    {canEdit ? (
                      <textarea
                        rows={3}
                        value={row.reason}
                        onChange={(e) => handleRowChange(index, "reason", e.target.value)}
                        placeholder="Почему именно так? (последствия отклонения)..."
                        className="w-full text-xs p-2 rounded-lg border border-emerald-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white text-slate-800"
                      />
                    ) : (
                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {row.reason}
                      </div>
                    )}
                  </td>

                  {/* Row Management */}
                  {canEdit && (
                    <td className="p-2 text-center align-middle">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-0.5">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveRow(index, "up")}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Вверх"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={index === activeJib.rows.length - 1}
                            onClick={() => handleMoveRow(index, "down")}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            title="Вниз"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          disabled={activeJib.rows.length <= 1}
                          onClick={() => handleDeleteRow(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20"
                          title="Удалить шаг"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer row with 4-Step TWI reminder */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Метод производственного инструктажа TWI (4 шага):</strong> 1. Подготовить ученика → 2. Показать операцию → 3. Пробное выполнение → 4. Закрепление и контроль.
            </span>
          </div>
          {canEdit && (
            <button
              onClick={handleAddRow}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить шаг
            </button>
          )}
        </div>
      </div>

      {/* AI Breakdown Result Block (Under the table, per user prompt requirement!) */}
      {showAiPanel && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-indigo-800/60 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-800/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  ИИ-Ассистент TWI: Анализ и структурирование операции
                </h3>
                <p className="text-xs text-indigo-300">
                  Формирование канонической 3-колоночной таблицы по стандартам Training Within Industry
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {aiResult && canEdit && (
                <button
                  onClick={handleApplyAiSteps}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Применить шаги в таблицу JIB</span>
                </button>
              )}
              <button
                onClick={() => setShowAiPanel(false)}
                className="text-xs text-indigo-300 hover:text-white px-2 py-1"
              >
                Скрыть
              </button>
            </div>
          </div>

          {isAiLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-indigo-200">
                Нейросеть выделяет «Важные шаги», находит «Ключевые моменты» безопасности/сноровки и формулирует «Причины»...
              </p>
            </div>
          ) : aiResult ? (
            <div className="space-y-4">
              {aiResult.summaryNotes && (
                <div className="p-3 rounded-xl bg-indigo-900/40 border border-indigo-700/50 text-xs text-indigo-200 leading-relaxed">
                  <strong>Примечание TWI-методолога:</strong> {aiResult.summaryNotes}
                </div>
              )}

              {/* 3 Columns Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Steps */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-indigo-900/60">
                  <div className="font-bold text-indigo-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                      1
                    </span>
                    Важные шаги ({aiResult.steps.length})
                  </div>
                  <ol className="space-y-2.5 list-decimal list-inside text-slate-200">
                    {aiResult.steps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed pl-1">
                        <span className="font-medium text-white">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Key Points */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-amber-900/50">
                  <div className="font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                      2
                    </span>
                    Ключевые моменты
                  </div>
                  <ul className="space-y-2.5 text-amber-100/90">
                    {aiResult.keyPoints.map((kp, idx) => (
                      <li key={idx} className="leading-relaxed flex items-start gap-2">
                        <span className="font-bold text-amber-400 shrink-0">#{idx + 1}:</span>
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Reasons */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-emerald-900/50">
                  <div className="font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                      3
                    </span>
                    Причины (Почему)
                  </div>
                  <ul className="space-y-2.5 text-emerald-100/90">
                    {aiResult.reasons.map((r, idx) => (
                      <li key={idx} className="leading-relaxed flex items-start gap-2">
                        <span className="font-bold text-emerald-400 shrink-0">#{idx + 1}:</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-indigo-300">
              Нажмите «Спросить ИИ», чтобы получить TWI разбивку для текущей операции.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
