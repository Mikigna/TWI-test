import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Sparkles,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { Competency, CompetencyCategory, UserRole } from "../types";

interface CompetencyLibraryViewProps {
  competencies: Competency[];
  onAddCompetency: (comp: Competency) => void;
  onUpdateCompetency: (comp: Competency) => void;
  onDeleteCompetency: (id: string) => void;
  userRole: UserRole;
}

export const CompetencyLibraryView: React.FC<CompetencyLibraryViewProps> = ({
  competencies,
  onAddCompetency,
  onUpdateCompetency,
  onDeleteCompetency,
  userRole,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Partial<Competency> | null>(null);

  // AI Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiRoleTitle, setAiRoleTitle] = useState("Оператор автоматической сборочной линии");
  const [aiDepartment, setAiDepartment] = useState("Сборочный цех");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiGeneratedList, setAiGeneratedList] = useState<Competency[]>([]);

  const canEdit = userRole === "ADMIN" || userRole === "MANAGER";
  const canDelete = userRole === "ADMIN";

  const filtered = competencies.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.targetRoles.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingComp({
      id: `comp-${Date.now()}`,
      title: "",
      category: "technical",
      weight: 1.0,
      targetLevel: 4,
      targetRoles: ["Оператор сборочной линии"],
      description: "",
      level1_desc: "Знает основы под контролем наставника.",
      level2_desc: "Выполняет типовые действия с контролем.",
      level3_desc: "Самостоятельно работает по стандарту JIB в такте.",
      level4_desc: "Работает без отклонений, обучает по 4-шаговому методу TWI.",
      level5_desc: "Эксперт, оптимизирует технологию (JM), разрабатывает новые JIB.",
      isCritical: false,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (comp: Competency) => {
    setEditingComp({ ...comp });
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComp || !editingComp.title) return;

    const compToSave: Competency = {
      id: editingComp.id || `comp-${Date.now()}`,
      title: editingComp.title,
      category: editingComp.category || "technical",
      weight: Number(editingComp.weight) || 1.0,
      targetLevel: Number(editingComp.targetLevel) || 4,
      targetRoles: Array.isArray(editingComp.targetRoles) ? editingComp.targetRoles : ["Рабочий"],
      description: editingComp.description || "",
      level1_desc: editingComp.level1_desc || "",
      level2_desc: editingComp.level2_desc || "",
      level3_desc: editingComp.level3_desc || "",
      level4_desc: editingComp.level4_desc || "",
      level5_desc: editingComp.level5_desc || "",
      isCritical: Boolean(editingComp.isCritical),
    };

    const exists = competencies.some((c) => c.id === compToSave.id);
    if (exists) {
      onUpdateCompetency(compToSave);
    } else {
      onAddCompetency(compToSave);
    }
    setIsEditModalOpen(false);
    setEditingComp(null);
  };

  const handleAskAI = async () => {
    setIsAiLoading(true);
    setAiGeneratedList([]);

    try {
      const res = await fetch("/api/ai/competencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTitle: aiRoleTitle,
          department: aiDepartment,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.competencies) {
        const generated: Competency[] = data.data.competencies.map(
          (item: any, idx: number) => ({
            id: `comp-ai-${Date.now()}-${idx}`,
            title: item.title,
            category: item.category || "technical",
            weight: item.weight || 1.0,
            targetLevel: item.targetLevel || 4,
            targetRoles: [aiRoleTitle],
            description: item.description || "",
            level1_desc: item.level1_desc || "",
            level2_desc: item.level2_desc || "",
            level3_desc: item.level3_desc || "",
            level4_desc: item.level4_desc || "",
            level5_desc: item.level5_desc || "",
            isCritical: Boolean(item.isCritical),
          })
        );
        setAiGeneratedList(generated);
      }
    } catch (err) {
      console.error("AI error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiCompetency = (comp: Competency) => {
    onAddCompetency(comp);
    setAiGeneratedList((prev) => prev.filter((item) => item.id !== comp.id));
  };

  const categoryLabels: Record<CompetencyCategory, { label: string; color: string }> = {
    technical: { label: "Профессиональная", color: "bg-blue-100 text-blue-800 border-blue-200" },
    core: { label: "Корпоративная / Безопасность", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    leadership: { label: "Наставничество / TWI", color: "bg-purple-100 text-purple-800 border-purple-200" },
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Библиотека компетенций
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Каталог квалификационных требований, поведенческих индикаторов 1–5 уровней и привязок к должностям
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Ask AI Button */}
          <button
            id="btn-ai-competency"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Спросить ИИ (Генерация профиля)</span>
          </button>

          {canEdit && (
            <button
              id="btn-add-competency"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить компетенцию</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Поиск компетенции, описания или должности..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="all">Все категории ({competencies.length})</option>
            <option value="technical">Профессиональные (technical)</option>
            <option value="core">Корпоративные / Безопасность (core)</option>
            <option value="leadership">Наставничество / TWI (leadership)</option>
          </select>
        </div>
      </div>

      {/* Competencies List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            Компетенций по заданным критериям не найдено.
          </div>
        ) : (
          filtered.map((comp) => {
            const isExpanded = expandedId === comp.id;
            const categoryInfo = categoryLabels[comp.category] || categoryLabels.technical;

            return (
              <div
                key={comp.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs overflow-hidden"
              >
                {/* Header row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : comp.id)}>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                      {comp.isCritical && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                          Критическая (SPOF)
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        Цель: <strong className="text-slate-800">{comp.targetLevel}/5</strong> • Вес: {comp.weight}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{comp.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Roles Badges */}
                    <div className="hidden md:flex flex-wrap gap-1 max-w-xs justify-end">
                      {comp.targetRoles.slice(0, 2).map((r, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {r}
                        </span>
                      ))}
                      {comp.targetRoles.length > 2 && (
                        <span className="text-[10px] text-slate-400">+{comp.targetRoles.length - 2}</span>
                      )}
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(comp)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => onDeleteCompetency(comp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : comp.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded 5 Levels Accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Поведенческие индикаторы по уровням мастерства TWI (1–5):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="font-bold text-slate-800 flex items-center gap-1 mb-1">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">1</span>
                          Новичок
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{comp.level1_desc}</p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="font-bold text-slate-800 flex items-center gap-1 mb-1">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">2</span>
                          Ученик
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{comp.level2_desc}</p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="font-bold text-slate-800 flex items-center gap-1 mb-1">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">3</span>
                          Специалист
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{comp.level3_desc}</p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-emerald-200 bg-emerald-50/20">
                        <div className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
                          <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px]">4</span>
                          Мастер (JI)
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{comp.level4_desc}</p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-purple-200 bg-purple-50/20">
                        <div className="font-bold text-purple-800 flex items-center gap-1 mb-1">
                          <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-[10px]">5</span>
                          Эксперт (JM)
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{comp.level5_desc}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Целевые должности:</span>
                      <span>{comp.targetRoles.join(", ")}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit/Add Modal */}
      {isEditModalOpen && editingComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 my-8 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                {competencies.some((c) => c.id === editingComp.id) ? "Редактирование компетенции" : "Новая компетенция"}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Название компетенции *</label>
                <input
                  type="text"
                  required
                  value={editingComp.title || ""}
                  onChange={(e) => setEditingComp({ ...editingComp, title: e.target.value })}
                  placeholder="Например: Монтаж кабельных жгутов и разъемов"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Категория</label>
                  <select
                    value={editingComp.category || "technical"}
                    onChange={(e) => setEditingComp({ ...editingComp, category: e.target.value as CompetencyCategory })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  >
                    <option value="technical">Профессиональная</option>
                    <option value="core">Корпоративная / Безопасность</option>
                    <option value="leadership">Наставничество / Лидерство</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Целевой уровень (1–5)</label>
                  <select
                    value={editingComp.targetLevel || 4}
                    onChange={(e) => setEditingComp({ ...editingComp, targetLevel: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  >
                    <option value={1}>1 (Новичок)</option>
                    <option value={2}>2 (Ученик)</option>
                    <option value={3}>3 (Специалист)</option>
                    <option value={4}>4 (Мастер)</option>
                    <option value={5}>5 (Эксперт)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Вес важности (W)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="2.5"
                    value={editingComp.weight || 1.0}
                    onChange={(e) => setEditingComp({ ...editingComp, weight: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Привязка к должностям (через запятую)</label>
                <input
                  type="text"
                  value={editingComp.targetRoles ? editingComp.targetRoles.join(", ") : ""}
                  onChange={(e) =>
                    setEditingComp({
                      ...editingComp,
                      targetRoles: e.target.value.split(",").map((r) => r.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Оператор сборочной линии, Слесарь-сборщик"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Общее описание</label>
                <textarea
                  rows={2}
                  value={editingComp.description || ""}
                  onChange={(e) => setEditingComp({ ...editingComp, description: e.target.value })}
                  placeholder="Краткое описание назначения и сферы применения компетенции..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700">
                  Поведенческие индикаторы уровней 1–5:
                </label>
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const key = `level${lvl}_desc` as keyof Competency;
                  return (
                    <div key={lvl} className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                        {lvl}
                      </span>
                      <input
                        type="text"
                        value={(editingComp[key] as string) || ""}
                        onChange={(e) => setEditingComp({ ...editingComp, [key]: e.target.value })}
                        placeholder={`Индикаторы уровня ${lvl}...`}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isCritical"
                  checked={Boolean(editingComp.isCritical)}
                  onChange={(e) => setEditingComp({ ...editingComp, isCritical: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor="isCritical" className="text-xs text-slate-700 font-medium">
                  Критическая компетенция (контроль риска «единой точки отказа» в цеху)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Сохранить компетенцию
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ask AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full border border-slate-200 my-8 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-300" />
                  ИИ-генерация профиля компетенций TWI
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Gemini формулирует профессиональные компетенции с 5 уровнями поведенческих индикаторов
                </p>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Должность / Профессия</label>
                  <input
                    type="text"
                    value={aiRoleTitle}
                    onChange={(e) => setAiRoleTitle(e.target.value)}
                    placeholder="Например: Оператор-наладчик лазерного раскроя"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Цех / Подразделение</label>
                  <input
                    type="text"
                    value={aiDepartment}
                    onChange={(e) => setAiDepartment(e.target.value)}
                    placeholder="Например: Заготовительный цех №2"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <button
                onClick={handleAskAI}
                disabled={isAiLoading || !aiRoleTitle}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xs"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ИИ анализирует отраслевые стандарты TWI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Сгенерировать компетенции</span>
                  </>
                )}
              </button>

              {/* AI Results */}
              {aiGeneratedList.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                    <span>Предложенные компетенции ({aiGeneratedList.length}):</span>
                    <span className="text-[11px] text-indigo-600 font-normal">Нажмите «Добавить в библиотеку»</span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {aiGeneratedList.map((c) => (
                      <div key={c.id} className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              {c.category}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{c.title}</h4>
                            <p className="text-xs text-slate-600 mt-0.5">{c.description}</p>
                            <div className="mt-2 text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                              <strong>Уровень 4 (Мастер TWI):</strong> {c.level4_desc}
                            </div>
                          </div>
                          <button
                            onClick={() => handleApplyAiCompetency(c)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 transition-colors"
                          >
                            Добавить в библиотеку
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
