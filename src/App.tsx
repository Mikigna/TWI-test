import React, { useState, useEffect } from "react";
import { User, UserRole, Competency, Employee, AssessmentRecord, JIBDocument, JMProposal, AuditLogEntry } from "./types";
import {
  INITIAL_USERS,
  INITIAL_COMPETENCIES,
  INITIAL_EMPLOYEES,
  INITIAL_ASSESSMENTS,
  INITIAL_JIBS,
  INITIAL_JM_PROPOSALS,
  INITIAL_AUDIT_LOGS,
} from "./data/initialData";
import { Navbar, NavTab } from "./components/Navbar";
import { LoginModal } from "./components/LoginModal";
import { DashboardView } from "./components/DashboardView";
import { CompetencyMatrixView } from "./components/CompetencyMatrixView";
import { CompetencyLibraryView } from "./components/CompetencyLibraryView";
import { JIBView } from "./components/JIBView";
import { JMProposalsView } from "./components/JMProposalsView";
import { AuditLogView } from "./components/AuditLogView";
import { AlertCircle } from "lucide-react";

export default function App() {
  // Current user state (default: Admin for full interactive testing)
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem("twi_current_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_USERS[0]; // Admin
  });

  const [currentTab, setCurrentTab] = useState<NavTab>("matrix");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Persistence for employees
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem("twi_employees");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_EMPLOYEES;
  });

  // Persistence for competencies
  const [competencies, setCompetencies] = useState<Competency[]>(() => {
    const saved = localStorage.getItem("twi_competencies");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_COMPETENCIES;
  });

  // Persistence for assessments
  const [assessments, setAssessments] = useState<AssessmentRecord[]>(() => {
    const saved = localStorage.getItem("twi_assessments");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ASSESSMENTS;
  });

  // Persistence for JIB documents
  const [jibs, setJibs] = useState<JIBDocument[]>(() => {
    const saved = localStorage.getItem("twi_jibs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_JIBS;
  });

  // Persistence for JM proposals
  const [jmProposals, setJmProposals] = useState<JMProposal[]>(() => {
    const saved = localStorage.getItem("twi_jm_proposals");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_JM_PROPOSALS;
  });

  // Persistence for Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem("twi_audit_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Save to localStorage effects
  useEffect(() => {
    localStorage.setItem("twi_current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("twi_employees", JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem("twi_competencies", JSON.stringify(competencies));
  }, [competencies]);

  useEffect(() => {
    localStorage.setItem("twi_assessments", JSON.stringify(assessments));
  }, [assessments]);

  useEffect(() => {
    localStorage.setItem("twi_jibs", JSON.stringify(jibs));
  }, [jibs]);

  useEffect(() => {
    localStorage.setItem("twi_jm_proposals", JSON.stringify(jmProposals));
  }, [jmProposals]);

  useEffect(() => {
    localStorage.setItem("twi_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helper to add audit entry
  const logAction = (action: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString("ru-RU"),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Switch role handler
  const handleSwitchUserRole = (newRole: UserRole) => {
    const targetUser = INITIAL_USERS.find((u) => u.role === newRole) || {
      id: `usr-${newRole.toLowerCase()}`,
      email: `${newRole.toLowerCase()}@twinavigator.pro`,
      name: `${newRole} Пользователь`,
      role: newRole,
      department: "Производственный департамент",
    };
    setCurrentUser(targetUser);

    // If active tab is not allowed for new role, redirect
    if (newRole === "VIEWER" && (currentTab === "library" || currentTab === "audit")) {
      setCurrentTab("matrix");
    } else if (newRole !== "ADMIN" && currentTab === "audit") {
      setCurrentTab("matrix");
    }

    logAction("СМЕНА РОЛИ", `Переключение профиля на ${newRole} (${targetUser.name})`);
  };

  // Assessment update handler (from matrix)
  const handleUpdateAssessment = (employeeId: string, competencyId: string, level: number | null) => {
    setAssessments((prev) => {
      const filtered = prev.filter((a) => !(a.employeeId === employeeId && a.competencyId === competencyId));
      if (level !== null && level !== undefined) {
        return [
          ...filtered,
          {
            employeeId,
            competencyId,
            level,
            updatedAt: new Date().toISOString().split("T")[0],
          },
        ];
      }
      return filtered;
    });

    const emp = employees.find((e) => e.id === employeeId);
    const comp = competencies.find((c) => c.id === competencyId);
    logAction(
      "ОЦЕНКА",
      `Обновлена оценка: ${emp?.fullName || employeeId} по «${comp?.title || competencyId}» -> ${
        level !== null ? `${level}/5` : "сброшена"
      }`
    );
  };

  // Add employee
  const handleAddEmployee = (newEmployee: Employee) => {
    setEmployees((prev) => [...prev, newEmployee]);
    logAction("ДОБАВЛЕНИЕ СОТРУДНИКА", `Добавлен сотрудник ${newEmployee.fullName} (${newEmployee.roleTitle})`);
  };

  // Batch import employees from CSV
  const handleBatchImportEmployees = (newEmployees: Employee[], newAssessments: AssessmentRecord[]) => {
    setEmployees((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const filteredNew = newEmployees.filter((e) => !existingIds.has(e.id));
      return [...prev, ...filteredNew];
    });

    setAssessments((prev) => {
      const newMap = new Map<string, AssessmentRecord>();
      for (const a of prev) {
        newMap.set(`${a.employeeId}:${a.competencyId}`, a);
      }
      for (const a of newAssessments) {
        newMap.set(`${a.employeeId}:${a.competencyId}`, a);
      }
      return Array.from(newMap.values());
    });

    logAction(
      "ИМПОРТ CSV",
      `Импортировано ${newEmployees.length} сотрудников и ${newAssessments.length} оценок матричного соответствия`
    );
  };

  // Competency CRUD
  const handleAddCompetency = (newComp: Competency) => {
    setCompetencies((prev) => [...prev, newComp]);
    logAction("КОМПЕТЕНЦИЯ", `Создана компетенция «${newComp.title}» (целевой уровень ${newComp.targetLevel})`);
  };

  const handleUpdateCompetency = (comp: Competency) => {
    setCompetencies((prev) => prev.map((c) => (c.id === comp.id ? comp : c)));
    logAction("КОМПЕТЕНЦИЯ", `Обновлены параметры компетенции «${comp.title}»`);
  };

  const handleDeleteCompetency = (id: string) => {
    const comp = competencies.find((c) => c.id === id);
    setCompetencies((prev) => prev.filter((c) => c.id !== id));
    setAssessments((prev) => prev.filter((a) => a.competencyId !== id));
    logAction("КОМПЕТЕНЦИЯ", `Удалена компетенция «${comp?.title || id}»`);
  };

  // JIB update & add
  const handleUpdateJIB = (jib: JIBDocument) => {
    setJibs((prev) => prev.map((j) => (j.id === jib.id ? jib : j)));
    logAction("JIB РЕДАКТИРОВАНИЕ", `Обновлена рабочая инструкция JIB «${jib.title}» (${jib.code})`);
  };

  const handleAddJIB = (jib: JIBDocument) => {
    setJibs((prev) => [jib, ...prev]);
    logAction("JIB СОЗДАНИЕ", `Создан новый стандартный инструктаж JIB «${jib.title}» (${jib.code})`);
  };

  // JM Proposal add & update status
  const handleAddProposal = (prop: JMProposal) => {
    setJmProposals((prev) => [prop, ...prev]);
    logAction("JM ПРЕДЛОЖЕНИЕ", `Подано предложение по улучшению: ${prop.operationTitle} (${prop.ecrsType})`);
  };

  const handleUpdateProposalStatus = (id: string, newStatus: any, reviewComment?: string) => {
    setJmProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus, reviewComment } : p))
    );
    logAction("JM СТАТУС", `Предложение ${id} переведено в статус ${newStatus}. ${reviewComment || ""}`);
  };

  // Tab safety check
  const isTabAllowed = (tab: NavTab) => {
    if (tab === "audit" && currentUser.role !== "ADMIN") return false;
    if (tab === "library" && currentUser.role === "VIEWER") return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (isTabAllowed(tab)) {
            setCurrentTab(tab);
          }
        }}
        currentUser={currentUser}
        onLogout={() => setIsLoginModalOpen(true)}
        onSwitchUser={handleSwitchUserRole}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === "dashboard" && (
          <DashboardView
            employees={employees}
            competencies={competencies}
            assessments={assessments}
            jibs={jibs}
            jmProposals={jmProposals}
            currentUser={currentUser}
            onNavigate={(tab) => {
              if (isTabAllowed(tab)) setCurrentTab(tab);
            }}
          />
        )}

        {currentTab === "matrix" && (
          <CompetencyMatrixView
            employees={employees}
            competencies={competencies}
            assessments={assessments}
            onUpdateAssessment={handleUpdateAssessment}
            onAddEmployee={handleAddEmployee}
            onBatchImportEmployees={handleBatchImportEmployees}
            userRole={currentUser.role}
          />
        )}

        {currentTab === "jib" && (
          <JIBView
            jibs={jibs}
            onUpdateJIB={handleUpdateJIB}
            onAddJIB={handleAddJIB}
            userRole={currentUser.role}
          />
        )}

        {currentTab === "jm" && (
          <JMProposalsView
            proposals={jmProposals}
            onAddProposal={handleAddProposal}
            onUpdateStatus={handleUpdateProposalStatus}
            userRole={currentUser.role}
            currentUserName={currentUser.name}
          />
        )}

        {currentTab === "library" && (
          <CompetencyLibraryView
            competencies={competencies}
            onAddCompetency={handleAddCompetency}
            onUpdateCompetency={handleUpdateCompetency}
            onDeleteCompetency={handleDeleteCompetency}
            userRole={currentUser.role}
          />
        )}

        {currentTab === "audit" && <AuditLogView logs={auditLogs} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">TWI Навигатор</span>
            <span>• Производственная система мирового уровня</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Job Instruction (JI) • Job Methods (JM) • Матрица квалификаций • Gemini AI
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={(user) => {
          setCurrentUser(user);
          logAction("ВХОД", `Успешный вход пользователя ${user.name} (${user.role})`);
        }}
      />
    </div>
  );
}
