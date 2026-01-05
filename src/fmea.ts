/**
 * FMEA Worksheet Generator
 * 
 * Generates formatted FMEA (Failure Mode and Effects Analysis) worksheets
 * from architecture analysis results.
 */

import { analyzeArchitecture, type FailureMode, type AnalysisResult } from "./analyzer.js";

export interface FMEAOptions {
  architecture: string;
  format: "json" | "markdown" | "csv";
  includeMitigations: boolean;
}

/**
 * Generate FMEA worksheet from architecture
 */
export async function generateFMEA(options: FMEAOptions): Promise<string> {
  // First, analyze the architecture
  const analysis = await analyzeArchitecture({
    architecture: options.architecture,
    depth: "standard",
  });

  switch (options.format) {
    case "json":
      return formatAsJSON(analysis, options.includeMitigations);
    case "csv":
      return formatAsCSV(analysis, options.includeMitigations);
    case "markdown":
    default:
      return formatAsMarkdown(analysis, options.includeMitigations);
  }
}

/**
 * Format as JSON
 */
function formatAsJSON(analysis: AnalysisResult, includeMitigations: boolean): string {
  if (!includeMitigations) {
    const simplified = {
      ...analysis,
      failureModes: analysis.failureModes.map(fm => ({
        id: fm.id,
        component: fm.component,
        failureMode: fm.failureMode,
        effect: fm.effect,
        cause: fm.cause,
        severity: fm.severity,
        occurrence: fm.occurrence,
        detection: fm.detection,
        rpn: fm.rpn,
        priority: fm.priority,
        category: fm.category,
      })),
    };
    return JSON.stringify(simplified, null, 2);
  }
  return JSON.stringify(analysis, null, 2);
}

/**
 * Format as CSV
 */
function formatAsCSV(analysis: AnalysisResult, includeMitigations: boolean): string {
  const headers = [
    "ID",
    "Component",
    "Failure Mode",
    "Effect",
    "Cause",
    "Severity",
    "Occurrence",
    "Detection",
    "RPN",
    "Priority",
    "Category",
  ];

  if (includeMitigations) {
    headers.push("Tactical Mitigations", "Strategic Mitigations");
  }

  const rows = [headers.join(",")];

  for (const fm of analysis.failureModes) {
    const row = [
      escapeCSV(fm.id),
      escapeCSV(fm.component),
      escapeCSV(fm.failureMode),
      escapeCSV(fm.effect),
      escapeCSV(fm.cause),
      fm.severity.toString(),
      fm.occurrence.toString(),
      fm.detection.toString(),
      fm.rpn.toString(),
      escapeCSV(fm.priority),
      escapeCSV(fm.category),
    ];

    if (includeMitigations) {
      row.push(
        escapeCSV(fm.tacticalMitigation.join("; ")),
        escapeCSV(fm.strategicMitigation.join("; "))
      );
    }

    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * Escape CSV field
 */
function escapeCSV(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Format as Markdown
 */
function formatAsMarkdown(analysis: AnalysisResult, includeMitigations: boolean): string {
  const lines: string[] = [];

  // Header
  lines.push("# FMEA Worksheet - Prismo Analysis");
  lines.push("");
  lines.push(`**Generated:** ${analysis.timestamp}`);
  lines.push(`**Analysis Depth:** ${analysis.analysisDepth}`);
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|-------|");
  lines.push(`| Total Risks | ${analysis.summary.totalRisks} |`);
  lines.push(`| Critical (RPN ≥ 200) | ${analysis.summary.criticalRisks} |`);
  lines.push(`| Medium (RPN 100-199) | ${analysis.summary.mediumRisks} |`);
  lines.push(`| Low (RPN 50-99) | ${analysis.summary.lowRisks} |`);
  lines.push(`| Minimal (RPN < 50) | ${analysis.summary.minimalRisks} |`);
  lines.push("");
  lines.push(`**Top Risk Areas:** ${analysis.summary.topRiskAreas.join(", ")}`);
  lines.push("");

  // Risk Heatmap (ASCII)
  lines.push("## Risk Heatmap");
  lines.push("");
  lines.push(generateHeatmap(analysis.failureModes));
  lines.push("");

  // FMEA Table
  lines.push("## Failure Modes");
  lines.push("");
  lines.push("| ID | Component | Failure Mode | Effect | S | O | D | RPN | Priority |");
  lines.push("|----|-----------|--------------|--------|---|---|---|-----|----------|");

  for (const fm of analysis.failureModes) {
    const shortEffect = fm.effect.length > 40 
      ? fm.effect.substring(0, 37) + "..." 
      : fm.effect;
    const shortMode = fm.failureMode.length > 30 
      ? fm.failureMode.substring(0, 27) + "..." 
      : fm.failureMode;
    
    lines.push(
      `| ${fm.id} | ${fm.component} | ${shortMode} | ${shortEffect} | ${fm.severity} | ${fm.occurrence} | ${fm.detection} | ${fm.rpn} | ${fm.priority} |`
    );
  }
  lines.push("");

  // Detailed Mitigations
  if (includeMitigations) {
    lines.push("## Mitigation Details");
    lines.push("");

    for (const fm of analysis.failureModes) {
      lines.push(`### ${fm.id}: ${fm.failureMode} (RPN: ${fm.rpn})`);
      lines.push("");
      lines.push(`**Component:** ${fm.component}`);
      lines.push(`**Category:** ${fm.category}`);
      lines.push(`**Effect:** ${fm.effect}`);
      lines.push(`**Cause:** ${fm.cause}`);
      lines.push("");
      
      lines.push("**Tactical (Do Now):**");
      for (const m of fm.tacticalMitigation) {
        lines.push(`- ${m}`);
      }
      lines.push("");
      
      lines.push("**Strategic (Plan):**");
      for (const m of fm.strategicMitigation) {
        lines.push(`- ${m}`);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  // Recommendations
  lines.push("## Recommendations");
  lines.push("");
  for (const rec of analysis.recommendations) {
    lines.push(`- ${rec}`);
  }
  lines.push("");

  // Footer
  lines.push("---");
  lines.push("*Generated by Prismo - AI-powered pre-mortem analysis*");
  lines.push("*https://srestack.dev/docs/prismo*");

  return lines.join("\n");
}

/**
 * Generate ASCII heatmap
 */
function generateHeatmap(failureModes: FailureMode[]): string {
  // Categorize failure modes by severity and occurrence
  const high: string[] = [];
  const medium: string[] = [];
  const low: string[] = [];

  for (const fm of failureModes) {
    if (fm.severity >= 7) {
      high.push(fm.id);
    } else if (fm.severity >= 4) {
      medium.push(fm.id);
    } else {
      low.push(fm.id);
    }
  }

  const formatCell = (ids: string[], maxOcc: number, minOcc: number): string => {
    const filtered = ids.filter(id => {
      const fm = failureModes.find(f => f.id === id);
      return fm && fm.occurrence >= minOcc && fm.occurrence <= maxOcc;
    });
    return filtered.slice(0, 3).join(", ") || "";
  };

  const lines = [
    "```",
    "                        PROBABILITY",
    "            +------------+------------+------------+",
    "            |  Unlikely  |   Likely   |  Certain   |",
    "            |   (1-3)    |   (4-6)    |   (7-10)   |",
    " +----------+------------+------------+------------+",
    " |          |            |            |            |",
    ` |   HIGH   | ${formatCell(high, 3, 1).padEnd(10)} | ${formatCell(high, 6, 4).padEnd(10)} | ${formatCell(high, 10, 7).padEnd(10)} |`,
    " |  (7-10)  |            |            |            |",
    " +----------+------------+------------+------------+",
    "S|          |            |            |            |",
    `E|  MEDIUM  | ${formatCell(medium, 3, 1).padEnd(10)} | ${formatCell(medium, 6, 4).padEnd(10)} | ${formatCell(medium, 10, 7).padEnd(10)} |`,
    "V|  (4-6)   |            |            |            |",
    "E+----------+------------+------------+------------+",
    "R|          |            |            |            |",
    `I|   LOW    | ${formatCell(low, 3, 1).padEnd(10)} | ${formatCell(low, 6, 4).padEnd(10)} | ${formatCell(low, 10, 7).padEnd(10)} |`,
    "T|  (1-3)   |            |            |            |",
    "Y+----------+------------+------------+------------+",
    "```",
  ];

  return lines.join("\n");
}
