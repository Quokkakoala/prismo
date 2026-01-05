/**
 * RPN (Risk Priority Number) Calculator
 * 
 * RPN = Severity × Occurrence × Detection
 * 
 * Used to prioritize failure modes in FMEA analysis.
 */

export interface RPNPriority {
  level: "Critical" | "Medium" | "Low" | "Minimal";
  action: string;
  color: string;
}

/**
 * Calculate the Risk Priority Number
 */
export function calculateRPN(
  severity: number,
  occurrence: number,
  detection: number
): number {
  // Validate inputs
  if (severity < 1 || severity > 10) {
    throw new Error("Severity must be between 1 and 10");
  }
  if (occurrence < 1 || occurrence > 10) {
    throw new Error("Occurrence must be between 1 and 10");
  }
  if (detection < 1 || detection > 10) {
    throw new Error("Detection must be between 1 and 10");
  }

  return severity * occurrence * detection;
}

/**
 * Get priority level and recommended action based on RPN
 */
export function getRPNPriority(rpn: number): RPNPriority {
  if (rpn >= 200) {
    return {
      level: "Critical",
      action: "Fix this sprint, escalate to leadership",
      color: "red",
    };
  } else if (rpn >= 100) {
    return {
      level: "Medium",
      action: "Plan within quarter",
      color: "orange",
    };
  } else if (rpn >= 50) {
    return {
      level: "Low",
      action: "Add to backlog",
      color: "yellow",
    };
  } else {
    return {
      level: "Minimal",
      action: "Document and monitor",
      color: "green",
    };
  }
}

/**
 * Get severity score description
 */
export function getSeverityDescription(score: number): string {
  if (score >= 10) return "Catastrophic - complete service failure";
  if (score >= 7) return "Major - significant customer impact";
  if (score >= 4) return "Moderate - degraded experience";
  return "Minor - barely noticeable";
}

/**
 * Get occurrence score description
 */
export function getOccurrenceDescription(score: number): string {
  if (score >= 10) return "Constant - happens daily";
  if (score >= 7) return "Frequent - weekly";
  if (score >= 4) return "Occasional - monthly";
  return "Rare - annually or never";
}

/**
 * Get detection score description
 */
export function getDetectionDescription(score: number): string {
  if (score >= 10) return "No detection - customers report it";
  if (score >= 7) return "Poor - usually miss it";
  if (score >= 4) return "Moderate - sometimes catch it";
  return "Good - almost always catch it first";
}

/**
 * Calculate expected RPN after mitigations
 */
export function calculateMitigatedRPN(
  currentRPN: number,
  newSeverity?: number,
  newOccurrence?: number,
  newDetection?: number,
  currentScores?: { severity: number; occurrence: number; detection: number }
): { newRPN: number; reduction: number; reductionPercent: number } {
  if (!currentScores) {
    throw new Error("Current scores required to calculate mitigated RPN");
  }

  const s = newSeverity ?? currentScores.severity;
  const o = newOccurrence ?? currentScores.occurrence;
  const d = newDetection ?? currentScores.detection;

  const newRPN = calculateRPN(s, o, d);
  const reduction = currentRPN - newRPN;
  const reductionPercent = Math.round((reduction / currentRPN) * 100);

  return { newRPN, reduction, reductionPercent };
}
