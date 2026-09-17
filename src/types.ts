export type UserRole = "ADMIN" | "MANAGER" | "TRAINER" | "VIEWER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
}

export type CompetencyCategory = "technical" | "core" | "leadership";

export interface Competency {
  id: string;
  title: string;
  category: CompetencyCategory;
  description: string;
  level1_desc: string;
  level2_desc: string;
  level3_desc: string;
  level4_desc: string;
  level5_desc: string;
  targetRoles: string[];
  targetLevel: number;
  weight: number;
  isCritical?: boolean;
}

export interface Employee {
  id: string;
  fullName: string;
  roleTitle: string;
  department: string;
  hireDate: string;
  status: "active" | "probation" | "certified";
}

export interface AssessmentRecord {
  employeeId: string;
  competencyId: string;
  level: number | null; // 1-5 or null (not assessed)
  updatedAt: string;
  assessedBy?: string;
  notes?: string;
}

export interface JIBRow {
  id: string;
  stepNumber: number;
  step: string; // Важный шаг (Important Step)
  keyPoint: string; // Ключевой момент (Key Point)
  reason: string; // Причина (Reason Why)
  type?: "safety" | "quality" | "technique";
}

export interface JIBDocument {
  id: string;
  code: string;
  title: string;
  department: string;
  operation: string;
  author: string;
  trainer: string;
  date: string;
  revision: string;
  tools: string;
  materials: string;
  safetyNotes: string;
  rows: JIBRow[];
}

export type ECRSType = "ELIMINATE" | "COMBINE" | "REARRANGE" | "SIMPLIFY";

export type ProposalStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "IMPLEMENTED" | "REJECTED";

export interface JMProposal {
  id: string;
  code?: string;
  title?: string;
  operationTitle?: string;
  author: string;
  authorRole?: string;
  department?: string;
  operation?: string;
  currentStep: string;
  problemDescription: string;
  questions?: {
    why?: string;
    what?: string;
    where?: string;
    when?: string;
    who?: string;
    how?: string;
  };
  analysisQuestions?: {
    why?: string;
    what?: string;
    where?: string;
    when?: string;
    who?: string;
    how?: string;
  };
  ecrsType: ECRSType;
  proposal?: string;
  proposedSolution?: string;
  expectedEffect: string;
  status: ProposalStatus;
  savingsMinutes?: number;
  createdAt: string;
  reviewerNotes?: string;
  reviewComment?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  userName: string;
  userRole?: UserRole;
  role?: UserRole;
  action: string;
  details: string;
}

export type AuditLogItem = AuditLogEntry;

export interface AIJIBResponse {
  steps: string[];
  keyPoints: string[];
  reasons: string[];
  breakdown?: Array<{
    step: string;
    keyPoint: string;
    reason: string;
    type?: "safety" | "quality" | "technique";
  }>;
  summary?: string;
}
