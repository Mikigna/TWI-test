import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { Competency, Employee, AssessmentRecord, JIBDocument, JMProposal } from "../types";
import { calculateMatrixStats } from "./twiCalculations";

export function exportMatrixToExcel(
  employees: Employee[],
  competencies: Competency[],
  assessments: AssessmentRecord[],
  departmentName: string
) {
  const { employeeStatsMap, competencyStatsMap } = calculateMatrixStats(employees, competencies, assessments);

  // Score map
  const scoreMap = new Map<string, number>();
  for (const a of assessments) {
    if (a.level !== null && a.level !== undefined) {
      scoreMap.set(`${a.employeeId}:${a.competencyId}`, a.level);
    }
  }

  // Header row
  const header = [
    "Таб. № / ID",
    "ФИО сотрудника",
    "Должность",
    "Подразделение",
    ...competencies.map((c) => `${c.title} (Цель: ${c.targetLevel})`),
    "Средний балл (факт)",
    "Целевой средний",
    "Индекс CI (%)",
    "Статус риска",
  ];

  const rows = employees.map((emp) => {
    const stats = employeeStatsMap.get(emp.id);
    const compScores = competencies.map((c) => {
      const score = scoreMap.get(`${emp.id}:${c.id}`);
      return score !== undefined ? score : "Н/О";
    });

    return [
      emp.id,
      emp.fullName,
      emp.roleTitle,
      emp.department,
      ...compScores,
      stats?.actualAvg ?? 0,
      stats?.targetAvg ?? 0,
      `${stats?.complianceIndex ?? 0}%`,
      stats?.isAtRisk ? "В ЗОНЕ РИСКА" : "В норме",
    ];
  });

  // Footer row with averages
  const compAvgRow = [
    "",
    "СРЕДНИЙ УРОВЕНЬ ПО КОМПЕТЕНЦИИ",
    "",
    "",
    ...competencies.map((c) => {
      const cStat = competencyStatsMap.get(c.id);
      return cStat ? cStat.actualAvg : 0;
    }),
    "-",
    "-",
    "-",
    "-",
  ];

  const wsData = [
    [`Матрица компетенций TWI — ${departmentName}`],
    [`Дата формирования: ${new Date().toLocaleDateString("ru-RU")}`],
    [],
    header,
    ...rows,
    [],
    compAvgRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Матрица компетенций");
  XLSX.writeFile(wb, `TWI_Матрица_компетенций_${departmentName.replace(/\s+/g, "_")}.xlsx`);
}

export function exportJIBToExcel(jib: JIBDocument) {
  const headerInfo = [
    ["СТАНДАРТНАЯ РАБОЧАЯ ИНСТРУКЦИЯ TWI (JOB INSTRUCTION BREAKDOWN)"],
    ["Код документа:", jib.code, "Ревизия:", jib.revision],
    ["Наименование работы:", jib.title],
    ["Операция:", jib.operation, "Подразделение:", jib.department],
    ["Составитель:", jib.author, "Тренер:", jib.trainer, "Дата:", jib.date],
    ["Инструменты и приспособления:", jib.tools],
    ["Материалы и комплектующие:", jib.materials],
    ["Требования безопасности (СИЗ):", jib.safetyNotes],
    [],
    ["№ шага", "ВАЖНЫЕ ШАГИ (Important Steps)", "КЛЮЧЕВЫЕ МОМЕНТЫ (Key Points)", "ПРИЧИНЫ (Reasons Why)"],
  ];

  const rows = jib.rows.map((r) => [
    r.stepNumber,
    r.step,
    r.keyPoint,
    r.reason,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...headerInfo, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "JIB");
  XLSX.writeFile(wb, `TWI_JIB_${jib.code}.xlsx`);
}

export function exportMatrixToPDF(
  employees: Employee[],
  competencies: Competency[],
  assessments: AssessmentRecord[],
  departmentName: string
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const { summary, employeeStatsMap } = calculateMatrixStats(employees, competencies, assessments);

  // Score map
  const scoreMap = new Map<string, number>();
  for (const a of assessments) {
    if (a.level !== null && a.level !== undefined) {
      scoreMap.set(`${a.employeeId}:${a.competencyId}`, a.level);
    }
  }

  // Header band
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TWI NAVIGATOR: COMPETENCY MATRIX REPORT", 14, 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Department: ${departmentName}  |  Generated: ${new Date().toLocaleDateString("ru-RU")}`, 14, 18);
  doc.text(`Avg Level: ${summary.deptAvg} / 5.0  |  CI: ${summary.overallComplianceIndex}%  |  At Risk: ${summary.employeesAtRiskCount}`, 200, 18);

  let y = 34;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 269, 10, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 269, 10, "S");

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  doc.text("Employee", 18, y + 6);
  doc.text("Role", 65, y + 6);

  const compColWidth = 24;
  let compX = 110;
  competencies.slice(0, 5).forEach((c, idx) => {
    doc.text(`C${idx + 1} (T:${c.targetLevel})`, compX, y + 6);
    compX += compColWidth;
  });

  doc.text("Avg Level", 232, y + 6);
  doc.text("CI %", 252, y + 6);
  doc.text("Risk", 268, y + 6);

  y += 10;

  // Rows
  doc.setFont("helvetica", "normal");
  employees.forEach((emp, i) => {
    if (y > 185) {
      doc.addPage();
      y = 20;
    }

    const stats = employeeStatsMap.get(emp.id);
    const isEven = i % 2 === 0;

    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 269, 9, "F");
    }

    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, 269, 9, "S");

    if (stats?.isAtRisk) {
      doc.setFillColor(239, 68, 68);
      doc.rect(14, y, 3, 9, "F"); // red left risk indicator
    }

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    // Sanitize cyrillic for basic PDF font fallback
    doc.text(emp.fullName, 18, y + 6);
    doc.text(emp.roleTitle.slice(0, 22), 65, y + 6);

    let cx = 110;
    competencies.slice(0, 5).forEach((c) => {
      const score = scoreMap.get(`${emp.id}:${c.id}`) ?? 0;
      if (score >= c.targetLevel) {
        doc.setFillColor(16, 185, 129); // emerald
        doc.setTextColor(255, 255, 255);
      } else if (score >= c.targetLevel - 1) {
        doc.setFillColor(245, 158, 11); // amber
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(239, 68, 68); // red
        doc.setTextColor(255, 255, 255);
      }
      doc.rect(cx, y + 1.5, 12, 6, "F");
      doc.text(String(score || "-"), cx + 4.5, y + 5.5);
      cx += compColWidth;
    });

    doc.setTextColor(15, 23, 42);
    doc.text(String(stats?.actualAvg ?? "-"), 236, y + 6);
    doc.text(`${stats?.complianceIndex ?? 0}%`, 252, y + 6);
    doc.text(stats?.isAtRisk ? "RISK" : "OK", 268, y + 6);

    y += 9;
  });

  // Footer notes
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Legend: Green = Meets/Exceeds Target (L >= T), Yellow = Attention (T - 1 <= L < T), Red = Risk Zone (L < T - 1)", 14, y + 10);

  doc.save(`TWI_Competency_Matrix_${departmentName.replace(/\s+/g, "_")}.pdf`);
}

export function exportJIBToPDF(jib: JIBDocument) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("JOB INSTRUCTION BREAKDOWN (TWI JIB)", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Code: ${jib.code}  |  Rev: ${jib.revision}  |  Date: ${jib.date}`, 14, 19);
  doc.text(`Department: ${jib.department}`, 130, 19);

  let y = 34;

  // Metadata block
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 30, "FD");

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Work / Operation:", 18, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(`${jib.title} (${jib.operation})`, 54, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text("Tools & Equipment:", 18, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(jib.tools.slice(0, 75), 54, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Materials:", 18, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(jib.materials.slice(0, 75), 54, y + 18);

  doc.setFont("helvetica", "bold");
  doc.text("Safety & PPE:", 18, y + 24);
  doc.setFont("helvetica", "normal");
  doc.text(jib.safetyNotes.slice(0, 75), 54, y + 24);

  y += 36;

  // 3 Columns header
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, 182, 10, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("1. Important Steps", 18, y + 6.5);
  doc.text("2. Key Points", 78, y + 6.5);
  doc.text("3. Reasons Why", 138, y + 6.5);

  y += 10;

  jib.rows.forEach((row) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    const rowHeight = 26;
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, y, 182, rowHeight, "S");

    // Divider lines
    doc.line(74, y, 74, y + rowHeight);
    doc.line(134, y, 134, y + rowHeight);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    // Col 1: Important Step
    const splitStep = doc.splitTextToSize(`${row.stepNumber}. ${row.step}`, 54);
    doc.text(splitStep, 18, y + 5);

    // Col 2: Key Point
    const splitKey = doc.splitTextToSize(row.keyPoint, 54);
    doc.text(splitKey, 78, y + 5);

    // Col 3: Reason Why
    const splitReason = doc.splitTextToSize(row.reason, 54);
    doc.text(splitReason, 138, y + 5);

    y += rowHeight;
  });

  // Signatures
  y = Math.max(y + 10, 260);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Prepared by: ${jib.author}  ____________________`, 14, y);
  doc.text(`Trainer / Approved by: ${jib.trainer}  ____________________`, 110, y);

  doc.save(`TWI_JIB_${jib.code}.pdf`);
}
