import React, { useState } from "react";
import {
  Lightbulb,
  Plus,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  HelpCircle,
  Filter,
  User,
  ArrowRight,
  Loader2,
  TrendingDown,
  X,
  FileCheck,
} from "lucide-react";
import { JMProposal, ECRSType, ProposalStatus, UserRole } from "../types";

interface JMProposalsViewProps {
  proposals: JMProposal[];
  onAddProposal: (proposal: JMProposal) => void;
  onUpdateStatus: (id: string, newStatus: ProposalStatus, reviewComment?: string) => void;
  userRole: UserRole;
  currentUserName: string;
}

export const JMProposalsView: React.FC<JMProposalsViewProps> = ({
  proposals,
  onAddProposal,
  onUpdateStatus,
  userRole,
  currentUserName,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEcrs, setSelectedEcrs] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [operationTitle, setOperationTitle] = useState("");
  const [currentStep, setCurrentStep] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [ecrsType, setEcrsType] = useState<ECRSType>("SIMPLIFY");
  const [proposedSolution, setProposedSolution] = useState("");
  const [expectedEffect, setExpectedEffect] = useState("");
  const [qWhy, setQWhy] = useState("");
  const [qWhat, setQWhat] = useState("");
  const [qWhere, setQWhere] = useState("");
  const [qWhen, setQWhen] = useState("");
  const [qWho, setQWho] = useState("");
  const [qHow, setQHow] = useState("");

  // AI Assistant state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    ecrsType: ECRSType;
    proposedSolution: string;
    expectedEffect: string;
    analysis: string;
    actionItems: string[];
  } | null>(null);

  const canApprove = userRole === "ADMIN" || userRole === "MANAGER";

  const filtered = proposals.filter((p) => {
    const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;
    const matchesEcrs = selectedEcrs === "all" || p.ecrsType === selectedEcrs;
    return matchesStatus && matchesEcrs;
  });

  const handleAskAI = async () => {
    if (!currentStep && !problemDescription) return;
    setIsAiLoading(true);
    setAiSuggestions(null);

    try {
      const res = await fetch("/api/ai/jm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentStep,
          problem: problemDescription,
          operationTitle: operationTitle || "Операция сборочной линии",
          questions: {
            why: qWhy,
            what: qWhat,
            where: qWhere,
            when: qWhen,
            who: qWho,
            how: qHow,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiSuggestions(data.data);
        if (data.data.proposedSolution && !proposedSolution) {
          setProposedSolution(data.data.proposedSolution);
        }
        if (data.data.expectedEffect && !expectedEffect) {
          setExpectedEffect(data.data.expectedEffect);
        }
        if (data.data.ecrsType) {
          setEcrsType(data.data.ecrsType);
        }
      }
    } catch (err) {
      console.error("AI JM error:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!aiSuggestions) return;
    setProposedSolution(aiSuggestions.proposedSolution);
    setExpectedEffect(aiSuggestions.expectedEffect);
    setEcrsType(aiSuggestions.ecrsType);
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operationTitle || !currentStep || !proposedSolution) return;

    const newProposal: JMProposal = {
      id: `jm-${Date.now()}`,
      author: currentUserName,
      operationTitle,
      currentStep,
      problemDescription,
      ecrsType,
      proposedSolution,
      expectedEffect,
      status: "SUBMITTED",
      createdAt: new Date().toISOString().split("T")[0],
      analysisQuestions: {
        why: qWhy,
        what: qWhat,
        where: qWhere,
        when: qWhen,
        who: qWho,
        how: qHow,
      },
    };

    onAddProposal(newProposal);
    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setOperationTitle("");
    setCurrentStep("");
    setProblemDescription("");
    setProposedSolution("");
    setExpectedEffect("");
    setQWhy("");
    setQWhat("");
    setQWhere("");
    setQWhen("");
    setQWho("");
    setQHow("");
    setAiSuggestions(null);
  };

  const ecrsInfo: Record<ECRSType, { label: string; color: string; letter: string; desc: string }> = {
    ELIMINATE: {
      letter: "E",
      label: "Устранить (Eliminate)",
      color: "bg-rose-100 text-rose-800 border-rose-300",
      desc: "Лишние переходы, ожидания, ненужные проверки",
    },
    COMBINE: {
      letter: "C",
      label: "Объединить (Combine)",
      color: "bg-amber-100 text-amber-800 border-amber-300",
      desc: "Совмещение операций, инструментов или этапов",
    },
    REARRANGE: {
      letter: "R",
      label: "Переставить (Rearrange)",
      color: "bg-blue-100 text-blue-800 border-blue-300",
      desc: "Изменение последовательности или расстановки оборудования",
    },
    SIMPLIFY: {
      letter: "S",
      label: "Упростить (Simplify)",
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      desc: "Оснастка, упоры, гравитационные лотки, удобный хват",
    },
  };

  const statusBadges: Record<ProposalStatus, { label: string; color: string; icon: React.ReactNode }> = {
    DRAFT: { label: "Черновик", color: "bg-slate-100 text-slate-700", icon: <Clock className="w-3 h-3" /> },
    SUBMITTED: { label: "На рассмотрении", color: "bg-blue-100 text-blue-800", icon: <Send className="w-3 h-3" /> },
    APPROVED: { label: "Согласовано", color: "bg-emerald-100 text-emerald-800", icon: <CheckCircle2 className="w-3 h-3" /> },
    REJECTED: { label: "Отклонено", color: "bg-rose-100 text-rose-800", icon: <XCircle className="w-3 h-3" /> },
    IMPLEMENTED: { label: "Внедрено в производство", color: "bg-purple-100 text-purple-800", icon: <FileCheck className="w-3 h-3" /> },
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              JM-предложения: Оптимизация методов работы (ECRS)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
              Кайдзен TWI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Анализ операций по 6 ключевым вопросам и 4 направлениям ECRS (Eliminate, Combine, Rearrange, Simplify)
          </p>
        </div>

        <button
          id="btn-create-jm"
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Подать JM-предложение</span>
        </button>
      </div>

      {/* ECRS Methodology Explanatory Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(["ELIMINATE", "COMBINE", "REARRANGE", "SIMPLIFY"] as ECRSType[]).map((type) => {
          const info = ecrsInfo[type];
          return (
            <div key={type} className={`p-3.5 rounded-xl border ${info.color} bg-opacity-30`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                <span className="w-6 h-6 rounded-lg bg-white shadow-2xs flex items-center justify-center font-extrabold text-xs">
                  {info.letter}
                </span>
                <span>{info.label.split(" ")[0]}</span>
              </div>
              <p className="text-[11px] text-slate-700 mt-1.5 leading-snug">{info.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
            >
              <option value="all">Все статусы ({proposals.length})</option>
              <option value="SUBMITTED">На рассмотрении</option>
              <option value="APPROVED">Согласовано</option>
              <option value="IMPLEMENTED">Внедрено</option>
              <option value="REJECTED">Отклонено</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedEcrs}
              onChange={(e) => setSelectedEcrs(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
            >
              <option value="all">Все типы ECRS</option>
              <option value="ELIMINATE">Устранить (Eliminate)</option>
              <option value="COMBINE">Объединить (Combine)</option>
              <option value="REARRANGE">Переставить (Rearrange)</option>
              <option value="SIMPLIFY">Упростить (Simplify)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Показано: <strong>{filtered.length}</strong> предложений
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
            Предложений не найдено. Нажмите «Подать JM-предложение», чтобы зарегистрировать идею по улучшению.
          </div>
        ) : (
          filtered.map((p) => {
            const ecrs = ecrsInfo[p.ecrsType];
            const status = statusBadges[p.status];

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs p-5 space-y-4"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${ecrs.color}`}>
                      {ecrs.label}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </span>
                    <span className="text-xs text-slate-400">ID: {p.id}</span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Автор: <strong>{p.author}</strong></span>
                    <span>•</span>
                    <span>{p.createdAt}</span>
                  </div>
                </div>

                {/* Body Details */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{p.operationTitle}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-1">
                        Текущий шаг и проблема (AS-IS):
                      </span>
                      <p className="text-slate-600 mb-1">
                        <strong>Шаг:</strong> {p.currentStep}
                      </p>
                      <p className="text-rose-700">
                        <strong>Потери:</strong> {p.problemDescription}
                      </p>
                    </div>

                    <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
                      <span className="font-bold text-emerald-900 block mb-1">
                        Предлагаемое решение (TO-BE):
                      </span>
                      <p className="text-slate-800 mb-1 font-medium">{p.proposedSolution}</p>
                      <p className="text-emerald-700 font-semibold">
                        <strong>Ожидаемый эффект:</strong> {p.expectedEffect}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6 Questions TWI Drawer */}
                {p.analysisQuestions && (
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                      Анализ по 6 вопросам TWI:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      <div>
                        <span className="font-bold text-slate-800 block">1. Зачем?</span>
                        <span>{p.analysisQuestions.why || "—"}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">2. Что?</span>
                        <span>{p.analysisQuestions.what || "—"}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">3. Где?</span>
                        <span>{p.analysisQuestions.where || "—"}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">4. Когда?</span>
                        <span>{p.analysisQuestions.when || "—"}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">5. Кто?</span>
                        <span>{p.analysisQuestions.who || "—"}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">6. Как?</span>
                        <span>{p.analysisQuestions.how || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review comment if any */}
                {p.reviewComment && (
                  <div className="text-xs text-slate-600 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Резолюция руководителя: {p.reviewComment}
                  </div>
                )}

                {/* Action Buttons for Managers / Admins */}
                {canApprove && p.status === "SUBMITTED" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onUpdateStatus(p.id, "REJECTED", "Требуется доработка экономического обоснования")}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      Отклонить
                    </button>
                    <button
                      onClick={() => onUpdateStatus(p.id, "APPROVED", "Согласовано к пилотному внедрению")}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors"
                    >
                      Согласовать предложение
                    </button>
                  </div>
                )}

                {canApprove && p.status === "APPROVED" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onUpdateStatus(p.id, "IMPLEMENTED", "Внедрено на линии, карта JIB обновлена")}
                      className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Подтвердить факт внедрения</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New JM Proposal Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full border border-slate-200 my-8 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Подача JM-предложения по улучшению (ECRS)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Метод Job Methods TWI: устранить, объединить, переставить, упростить
                </p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitProposal} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Наименование операции / рабочего места *
                  </label>
                  <input
                    type="text"
                    required
                    value={operationTitle}
                    onChange={(e) => setOperationTitle(e.target.value)}
                    placeholder="Например: Установка разъема питания на плату"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Тип улучшения ECRS *
                  </label>
                  <select
                    value={ecrsType}
                    onChange={(e) => setEcrsType(e.target.value as ECRSType)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  >
                    <option value="SIMPLIFY">S — Упростить (Simplify)</option>
                    <option value="ELIMINATE">E — Устранить (Eliminate)</option>
                    <option value="COMBINE">C — Объединить (Combine)</option>
                    <option value="REARRANGE">R — Переставить (Rearrange)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Текущий шаг операции (AS-IS) *
                </label>
                <input
                  type="text"
                  required
                  value={currentStep}
                  onChange={(e) => setCurrentStep(e.target.value)}
                  placeholder="Опишите, как операция выполняется сейчас..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Описание проблемы или потери (Муда)
                </label>
                <textarea
                  rows={2}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="В чем заключается неудобство, риск брака, задержка или потеря времени?..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* 6 Questions Accordion */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    Анализ деталей по 6 вопросам TWI (Вопросник шага 2)
                  </span>
                  <button
                    type="button"
                    onClick={handleAskAI}
                    disabled={isAiLoading || !currentStep}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Спросить ИИ (ECRS анализ)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">1. Зачем? (Цель)</label>
                    <input
                      type="text"
                      value={qWhy}
                      onChange={(e) => setQWhy(e.target.value)}
                      placeholder="Зачем нужен этот шаг?"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">2. Что? (Суть)</label>
                    <input
                      type="text"
                      value={qWhat}
                      onChange={(e) => setQWhat(e.target.value)}
                      placeholder="Что именно делается?"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">3. Где? (Место)</label>
                    <input
                      type="text"
                      value={qWhere}
                      onChange={(e) => setQWhere(e.target.value)}
                      placeholder="Где лучше выполнять?"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">4. Когда? (Момент)</label>
                    <input
                      type="text"
                      value={qWhen}
                      onChange={(e) => setQWhen(e.target.value)}
                      placeholder="Когда выгоднее делать?"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">5. Кто? (Исполнитель)</label>
                    <input
                      type="text"
                      value={qWho}
                      onChange={(e) => setQWho(e.target.value)}
                      placeholder="Кто лучше справится?"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 text-[11px] mb-0.5">6. Как? (Метод)</label>
                    <input
                      type="text"
                      value={qHow}
                      onChange={(e) => setQHow(e.target.value)}
                      placeholder="Как упростить метод?"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* AI Suggestion box inside modal */}
                {aiSuggestions && (
                  <div className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Рекомендация ИИ по ECRS:
                      </span>
                      <button
                        type="button"
                        onClick={handleApplyAiSuggestion}
                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline"
                      >
                        Применить в форму
                      </button>
                    </div>
                    <p className="text-xs text-indigo-950">{aiSuggestions.analysis}</p>
                    <div className="text-xs text-slate-700">
                      <strong>Предложение:</strong> {aiSuggestions.proposedSolution}
                    </div>
                    <div className="text-xs text-emerald-800 font-medium">
                      <strong>Эффект:</strong> {aiSuggestions.expectedEffect}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Предлагаемое решение (TO-BE) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={proposedSolution}
                  onChange={(e) => setProposedSolution(e.target.value)}
                  placeholder="Опишите новый способ выполнения работы..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ожидаемый эффект (экономия времени, снижение брака, безопасность)
                </label>
                <input
                  type="text"
                  value={expectedEffect}
                  onChange={(e) => setExpectedEffect(e.target.value)}
                  placeholder="Например: Сокращение времени цикла на 8 секунд, 0 брака по перекосу"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Отправить предложение
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
