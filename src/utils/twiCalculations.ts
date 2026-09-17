import { Competency, Employee, AssessmentRecord } from "../types";

export interface EmployeeStats {
  employeeId: string;
  actualAvg: number;
  targetAvg: number;
  complianceIndex: number;
  isAtRisk: boolean;
  riskReasons: string[];
}

export interface CompetencyStats {
  competencyId: string;
  actualAvg: number;
  targetLevel: number;
  assessedCount: number;
  qualifiedCount: number; // employees with L >= T
  hasNoCarrier: boolean; // no employee >= T
  hasSystemicDeficit: boolean; // actualAvg < target - 1
}

export interface DepartmentSummary {
  deptAvg: number;
  overallComplianceIndex: number;
  employeesAtRiskCount: number;
  uncoveredCriticalCompetenciesCount: number;
}

export function calculateMatrixStats(
  employees: Employee[],
  competencies: Competency[],
  assessments: AssessmentRecord[]
): {
  employeeStatsMap: Map<string, EmployeeStats>;
  competencyStatsMap: Map<string, CompetencyStats>;
  summary: DepartmentSummary;
} {
  // Map assessments for quick lookup (employeeId + ":" + competencyId -> level)
  const scoreMap = new Map<string, number>();
  for (const a of assessments) {
    if (a.level !== null && a.level !== undefined) {
      scoreMap.set(`${a.employeeId}:${a.competencyId}`, a.level);
    }
  }

  const employeeStatsMap = new Map<string, EmployeeStats>();
  let totalDeptWeightedSum = 0;
  let totalDeptWeightedCount = 0;
  let totalMinScoreSum = 0;
  let totalTargetScoreSum = 0;
  let employeesAtRiskCount = 0;

  for (const emp of employees) {
    let weightedActualSum = 0;
    let weightedTargetSum = 0;
    let totalWeight = 0;
    let minScoreSum = 0;
    let targetScoreSum = 0;
    const riskReasons: string[] = [];

    for (const comp of competencies) {
      const actualLevel = scoreMap.get(`${emp.id}:${comp.id}`) ?? 0;
      const targetLevel = comp.targetLevel;
      const weight = comp.weight || 1.0;

      weightedActualSum += actualLevel * weight;
      weightedTargetSum += targetLevel * weight;
      totalWeight += weight;

      minScoreSum += Math.min(actualLevel, targetLevel);
      targetScoreSum += targetLevel;

      // Check critical gap trigger: L <= 2 when T >= 4
      if (actualLevel > 0 && actualLevel <= 2 && targetLevel >= 4) {
        riskReasons.push(`Критический разрыв в «${comp.title}» (${actualLevel} из ${targetLevel})`);
      }
    }

    const actualAvg = totalWeight > 0 ? Number((weightedActualSum / totalWeight).toFixed(2)) : 0;
    const targetAvg = totalWeight > 0 ? Number((weightedTargetSum / totalWeight).toFixed(2)) : 0;
    const complianceIndex = targetScoreSum > 0 ? Number(((minScoreSum / targetScoreSum) * 100).toFixed(1)) : 0;

    let isAtRisk = false;
    // Trigger 2: actualAvg < 0.7 * targetAvg
    if (actualAvg < 0.7 * targetAvg) {
      isAtRisk = true;
      riskReasons.push(`Средний уровень ${actualAvg} ниже 70% целевого (${(0.7 * targetAvg).toFixed(2)})`);
    }

    // Trigger 3: CI < 70%
    if (complianceIndex < 70) {
      isAtRisk = true;
      riskReasons.push(`Индекс соответствия (${complianceIndex}%) ниже допустимого порога 70%`);
    }

    if (riskReasons.length > 0) {
      isAtRisk = true;
    }

    if (isAtRisk) {
      employeesAtRiskCount++;
    }

    totalDeptWeightedSum += actualAvg;
    totalDeptWeightedCount++;
    totalMinScoreSum += minScoreSum;
    totalTargetScoreSum += targetScoreSum;

    employeeStatsMap.set(emp.id, {
      employeeId: emp.id,
      actualAvg,
      targetAvg,
      complianceIndex,
      isAtRisk,
      riskReasons,
    });
  }

  // Competency stats calculation
  const competencyStatsMap = new Map<string, CompetencyStats>();
  let uncoveredCriticalCompetenciesCount = 0;

  for (const comp of competencies) {
    let compScoreSum = 0;
    let assessedCount = 0;
    let qualifiedCount = 0;

    for (const emp of employees) {
      const score = scoreMap.get(`${emp.id}:${comp.id}`);
      if (score !== undefined && score > 0) {
        compScoreSum += score;
        assessedCount++;
        if (score >= comp.targetLevel) {
          qualifiedCount++;
        }
      }
    }

    const actualAvg = assessedCount > 0 ? Number((compScoreSum / assessedCount).toFixed(2)) : 0;
    const hasNoCarrier = qualifiedCount === 0;
    const hasSystemicDeficit = actualAvg > 0 && actualAvg < comp.targetLevel - 1;

    if (comp.isCritical && hasNoCarrier) {
      uncoveredCriticalCompetenciesCount++;
    }

    competencyStatsMap.set(comp.id, {
      competencyId: comp.id,
      actualAvg,
      targetLevel: comp.targetLevel,
      assessedCount,
      qualifiedCount,
      hasNoCarrier,
      hasSystemicDeficit,
    });
  }

  const deptAvg = totalDeptWeightedCount > 0 ? Number((totalDeptWeightedSum / totalDeptWeightedCount).toFixed(2)) : 0;
  const overallComplianceIndex = totalTargetScoreSum > 0 ? Number(((totalMinScoreSum / totalTargetScoreSum) * 100).toFixed(1)) : 0;

  return {
    employeeStatsMap,
    competencyStatsMap,
    summary: {
      deptAvg,
      overallComplianceIndex,
      employeesAtRiskCount,
      uncoveredCriticalCompetenciesCount,
    },
  };
}

export function getCellStatus(
  actual: number | null | undefined,
  target: number
): {
  colorClass: string;
  textClass: string;
  badge: "green" | "yellow" | "red" | "gray";
  isCriticalGap: boolean;
} {
  if (actual === null || actual === undefined || actual === 0) {
    return {
      colorClass: "bg-slate-100 text-slate-400 border-slate-200",
      textClass: "text-slate-400",
      badge: "gray",
      isCriticalGap: false,
    };
  }

  const isCriticalGap = actual <= 2 && target >= 4;

  if (actual >= target) {
    return {
      colorClass: "bg-emerald-600 text-white font-semibold border-emerald-700 shadow-xs",
      textClass: "text-white",
      badge: "green",
      isCriticalGap: false,
    };
  }

  if (actual >= target - 1) {
    return {
      colorClass: "bg-amber-400 text-amber-950 font-semibold border-amber-500 shadow-xs",
      textClass: "text-amber-950",
      badge: "yellow",
      isCriticalGap: false,
    };
  }

  return {
    colorClass: "bg-rose-600 text-white font-bold border-rose-700 shadow-xs ring-1 ring-rose-300",
    textClass: "text-white",
    badge: "red",
    isCriticalGap,
  };
}
