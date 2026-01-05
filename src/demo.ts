#!/usr/bin/env node

/**
 * Prismo Demo Script
 * 
 * Runs a demo analysis on a sample architecture without requiring user input.
 * Perfect for testing in VS Code.
 * 
 * Run with: npm run demo
 */

import { analyzeArchitecture } from "./analyzer.js";
import { generateFMEA } from "./fmea.js";
import { calculateRPN, getRPNPriority } from "./rpn.js";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function c(color: keyof typeof colors, text: string): string {
  return `${colors[color]}${text}${colors.reset}`;
}

async function main() {
  console.log(`
${c("cyan", "╔═══════════════════════════════════════════════════════════╗")}
${c("cyan", "║")}  ${c("bright", "🔮 PRISMO DEMO")} - Pre-Mortem Analysis                    ${c("cyan", "║")}
${c("cyan", "╚═══════════════════════════════════════════════════════════╝")}
`);

  // Demo architecture (from your blog post)
  const architecture = `
Library Management System:
- Web App (React frontend) for patrons to search and reserve books
- REST API (Node.js/Express backend) handling all business logic
- Redis Cache for session management and search result caching  
- Document DB (MongoDB) storing book catalog, user records, borrow history
- Key Vault for API keys and database credentials
- Integration with email service for notifications
`;

  console.log(c("bright", "📋 Sample Architecture:"));
  console.log(c("dim", architecture));

  // ═══════════════════════════════════════════════════════════════
  // TEST 1: RPN Calculation
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${c("cyan", "═══ Test 1: RPN Calculation ═══")}\n`);
  
  const testCases = [
    { s: 9, o: 4, d: 7, desc: "Secret expiration not monitored" },
    { s: 10, o: 2, d: 8, desc: "Single database instance" },
    { s: 6, o: 5, d: 5, desc: "Cache invalidation failure" },
  ];

  for (const tc of testCases) {
    const rpn = calculateRPN(tc.s, tc.o, tc.d);
    const priority = getRPNPriority(rpn);
    const priorityColor = priority.level === "Critical" ? "red" : 
                         priority.level === "Medium" ? "yellow" : "green";
    
    console.log(`  ${tc.desc}`);
    console.log(`    ${tc.s} × ${tc.o} × ${tc.d} = ${c("bright", String(rpn))} (${c(priorityColor, priority.level)})`);
    console.log(`    Action: ${priority.action}\n`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 2: Architecture Analysis
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${c("cyan", "═══ Test 2: Architecture Analysis ═══")}\n`);
  console.log(`${c("yellow", "⏳ Analyzing architecture...")}\n`);

  const analysis = await analyzeArchitecture({
    architecture,
    depth: "standard",
  });

  console.log(c("green", "✅ Analysis Complete!\n"));
  
  console.log(c("bright", "Summary:"));
  console.log(`  Total Risks Identified: ${analysis.summary.totalRisks}`);
  console.log(`  ${c("red", "Critical (RPN ≥ 200):")}  ${analysis.summary.criticalRisks}`);
  console.log(`  ${c("yellow", "Medium (RPN 100-199):")} ${analysis.summary.mediumRisks}`);
  console.log(`  ${c("green", "Low (RPN 50-99):")}      ${analysis.summary.lowRisks}`);
  console.log(`  ${c("dim", "Minimal (RPN < 50):")}    ${analysis.summary.minimalRisks}`);
  console.log(`\n  Top Risk Areas: ${analysis.summary.topRiskAreas.join(", ")}`);

  console.log(`\n${c("bright", "Failure Modes (sorted by RPN):")}\n`);
  console.log("  ┌────────────┬──────┬──────────┬────────────────┬─────────────────────────────┐");
  console.log("  │ ID         │ RPN  │ Priority │ Category       │ Failure Mode                │");
  console.log("  ├────────────┼──────┼──────────┼────────────────┼─────────────────────────────┤");
  
  for (const fm of analysis.failureModes) {
    const priorityColor = fm.priority === "Critical" ? "red" : 
                         fm.priority === "Medium" ? "yellow" : "green";
    console.log(
      `  │ ${fm.id.padEnd(10)} │ ${String(fm.rpn).padEnd(4)} │ ${c(priorityColor, fm.priority.padEnd(8))} │ ${fm.category.substring(0, 14).padEnd(14)} │ ${fm.failureMode.substring(0, 27).padEnd(27)} │`
    );
  }
  console.log("  └────────────┴──────┴──────────┴────────────────┴─────────────────────────────┘");

  // ═══════════════════════════════════════════════════════════════
  // TEST 3: Mitigation Details (Top Risk)
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${c("cyan", "═══ Test 3: Mitigation Details ═══")}\n`);
  
  const topRisk = analysis.failureModes[0];
  console.log(`${c("red", "🚨 Top Risk:")} ${topRisk.id}\n`);
  console.log(`  ${c("bright", "Failure Mode:")} ${topRisk.failureMode}`);
  console.log(`  ${c("bright", "Component:")}    ${topRisk.component}`);
  console.log(`  ${c("bright", "Category:")}     ${topRisk.category}`);
  console.log(`  ${c("bright", "Effect:")}       ${topRisk.effect}`);
  console.log(`  ${c("bright", "Cause:")}        ${topRisk.cause}`);
  console.log(`  ${c("bright", "RPN:")}          ${topRisk.severity} × ${topRisk.occurrence} × ${topRisk.detection} = ${topRisk.rpn}`);
  
  console.log(`\n  ${c("yellow", "Tactical Mitigations (Do Now):")}`);
  for (const m of topRisk.tacticalMitigation) {
    console.log(`    • ${m}`);
  }
  
  console.log(`\n  ${c("green", "Strategic Mitigations (Plan):")}`);
  for (const m of topRisk.strategicMitigation) {
    console.log(`    • ${m}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 4: FMEA Worksheet Generation
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n\n${c("cyan", "═══ Test 4: FMEA Worksheet Generation ═══")}\n`);
  console.log(`${c("yellow", "⏳ Generating FMEA worksheet (Markdown format)...")}\n`);

  const fmea = await generateFMEA({
    architecture,
    format: "markdown",
    includeMitigations: false,  // Keep output shorter
  });

  // Show first 40 lines
  const lines = fmea.split("\n").slice(0, 40);
  console.log(c("dim", "─".repeat(60)));
  console.log(lines.join("\n"));
  console.log(c("dim", "─".repeat(60)));
  console.log(c("dim", `\n... (showing first 40 lines of ${fmea.split("\n").length} total)`));

  // ═══════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${c("cyan", "═══════════════════════════════════════════════════════════")}`);
  console.log(c("green", "✅ All tests completed successfully!"));
  console.log(`${c("cyan", "═══════════════════════════════════════════════════════════")}\n`);
  
  console.log(c("bright", "Next Steps:"));
  console.log("  1. Set ANTHROPIC_API_KEY for AI-powered analysis");
  console.log("  2. Run 'npm run cli' for interactive mode");
  console.log("  3. Run 'npm run inspector' to test MCP tools");
  console.log("  4. Add to Claude Desktop config for production use\n");
}

main().catch(console.error);
