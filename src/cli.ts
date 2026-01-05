#!/usr/bin/env node

/**
 * Prismo Interactive CLI
 * 
 * A simple command-line interface to test Prismo functionality
 * without needing MCP Inspector.
 * 
 * Run with: npm run cli
 */

import * as readline from "readline";
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
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function c(color: keyof typeof colors, text: string): string {
  return `${colors[color]}${text}${colors.reset}`;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function printBanner() {
  console.log(`
${c("cyan", "╔═══════════════════════════════════════════════════════════╗")}
${c("cyan", "║")}  ${c("bright", "🔮 PRISMO")} - AI-Powered Pre-Mortem Analysis              ${c("cyan", "║")}
${c("cyan", "║")}  ${c("dim", "Refract your architecture into a spectrum of risks")}       ${c("cyan", "║")}
${c("cyan", "╚═══════════════════════════════════════════════════════════╝")}
`);
}

function printHelp() {
  console.log(`
${c("bright", "Available Commands:")}

  ${c("green", "1")} | ${c("green", "analyze")}    - Analyze architecture for failure modes
  ${c("green", "2")} | ${c("green", "fmea")}       - Generate FMEA worksheet
  ${c("green", "3")} | ${c("green", "rpn")}        - Calculate RPN score
  ${c("green", "4")} | ${c("green", "demo")}       - Run demo analysis on Library System
  ${c("green", "5")} | ${c("green", "help")}       - Show this help
  ${c("green", "6")} | ${c("green", "exit")}       - Exit

${c("dim", "Type a number or command name to proceed.")}
`);
}

async function runAnalyze() {
  console.log(`\n${c("cyan", "═══ Architecture Analysis ═══")}\n`);
  
  console.log(c("dim", "Enter your architecture description (multi-line supported)."));
  console.log(c("dim", "Type 'END' on a new line when done:\n"));
  
  let architecture = "";
  while (true) {
    const line = await prompt("");
    if (line.trim().toUpperCase() === "END") break;
    architecture += line + "\n";
  }
  
  if (!architecture.trim()) {
    console.log(c("red", "No architecture provided. Cancelled."));
    return;
  }
  
  const depthChoice = await prompt(`\nAnalysis depth? [${c("green", "1")}=quick, ${c("yellow", "2")}=standard, ${c("red", "3")}=deep]: `);
  const depthMap: Record<string, "quick" | "standard" | "deep"> = {
    "1": "quick",
    "2": "standard", 
    "3": "deep",
    "quick": "quick",
    "standard": "standard",
    "deep": "deep",
  };
  const depth = depthMap[depthChoice] || "standard";
  
  console.log(`\n${c("yellow", "⏳ Analyzing architecture...")} (depth: ${depth})\n`);
  
  try {
    const result = await analyzeArchitecture({ architecture, depth });
    
    console.log(c("green", "✅ Analysis Complete!\n"));
    console.log(c("bright", "Summary:"));
    console.log(`  Total Risks:    ${result.summary.totalRisks}`);
    console.log(`  ${c("red", "Critical:")}       ${result.summary.criticalRisks}`);
    console.log(`  ${c("yellow", "Medium:")}         ${result.summary.mediumRisks}`);
    console.log(`  ${c("green", "Low:")}            ${result.summary.lowRisks}`);
    console.log(`  ${c("dim", "Minimal:")}         ${result.summary.minimalRisks}`);
    console.log(`\n  Top Risk Areas: ${result.summary.topRiskAreas.join(", ")}`);
    
    console.log(`\n${c("bright", "Top 5 Failure Modes:")}\n`);
    console.log("  ID         | RPN  | Priority | Component      | Failure Mode");
    console.log("  -----------|------|----------|----------------|---------------------------");
    
    for (const fm of result.failureModes.slice(0, 5)) {
      const priorityColor = fm.priority === "Critical" ? "red" : 
                           fm.priority === "Medium" ? "yellow" : "green";
      console.log(
        `  ${fm.id.padEnd(10)} | ${String(fm.rpn).padEnd(4)} | ${c(priorityColor, fm.priority.padEnd(8))} | ${fm.component.substring(0, 14).padEnd(14)} | ${fm.failureMode.substring(0, 25)}`
      );
    }
    
    const saveChoice = await prompt(`\n${c("cyan", "Save full results?")} [y/N]: `);
    if (saveChoice.toLowerCase() === "y") {
      const filename = `prismo-analysis-${Date.now()}.json`;
      const fs = await import("fs");
      fs.writeFileSync(filename, JSON.stringify(result, null, 2));
      console.log(c("green", `✓ Saved to ${filename}`));
    }
    
  } catch (error) {
    console.log(c("red", `Error: ${error}`));
  }
}

async function runFMEA() {
  console.log(`\n${c("cyan", "═══ FMEA Worksheet Generator ═══")}\n`);
  
  console.log(c("dim", "Enter your architecture description (type 'END' when done):\n"));
  
  let architecture = "";
  while (true) {
    const line = await prompt("");
    if (line.trim().toUpperCase() === "END") break;
    architecture += line + "\n";
  }
  
  if (!architecture.trim()) {
    console.log(c("red", "No architecture provided. Cancelled."));
    return;
  }
  
  const formatChoice = await prompt(`\nOutput format? [${c("green", "1")}=markdown, ${c("yellow", "2")}=json, ${c("blue", "3")}=csv]: `);
  const formatMap: Record<string, "markdown" | "json" | "csv"> = {
    "1": "markdown",
    "2": "json",
    "3": "csv",
    "markdown": "markdown",
    "json": "json",
    "csv": "csv",
  };
  const format = formatMap[formatChoice] || "markdown";
  
  console.log(`\n${c("yellow", "⏳ Generating FMEA worksheet...")} (format: ${format})\n`);
  
  try {
    const result = await generateFMEA({
      architecture,
      format,
      includeMitigations: true,
    });
    
    console.log(c("green", "✅ FMEA Generated!\n"));
    
    // Show first 50 lines
    const lines = result.split("\n");
    console.log(lines.slice(0, 50).join("\n"));
    if (lines.length > 50) {
      console.log(c("dim", `\n... (${lines.length - 50} more lines)`));
    }
    
    const saveChoice = await prompt(`\n${c("cyan", "Save full FMEA?")} [y/N]: `);
    if (saveChoice.toLowerCase() === "y") {
      const ext = format === "csv" ? "csv" : format === "json" ? "json" : "md";
      const filename = `prismo-fmea-${Date.now()}.${ext}`;
      const fs = await import("fs");
      fs.writeFileSync(filename, result);
      console.log(c("green", `✓ Saved to ${filename}`));
    }
    
  } catch (error) {
    console.log(c("red", `Error: ${error}`));
  }
}

async function runRPN() {
  console.log(`\n${c("cyan", "═══ RPN Calculator ═══")}\n`);
  console.log(c("dim", "RPN = Severity × Occurrence × Detection\n"));
  
  const severityStr = await prompt(`${c("bright", "Severity")} (1-10, 10=catastrophic): `);
  const occurrenceStr = await prompt(`${c("bright", "Occurrence")} (1-10, 10=constant): `);
  const detectionStr = await prompt(`${c("bright", "Detection")} (1-10, 10=no detection): `);
  const failureMode = await prompt(`${c("dim", "Failure mode description (optional):")} `);
  
  const severity = parseInt(severityStr) || 5;
  const occurrence = parseInt(occurrenceStr) || 5;
  const detection = parseInt(detectionStr) || 5;
  
  try {
    const rpn = calculateRPN(severity, occurrence, detection);
    const priority = getRPNPriority(rpn);
    
    const priorityColor = priority.level === "Critical" ? "red" : 
                         priority.level === "Medium" ? "yellow" : 
                         priority.level === "Low" ? "green" : "dim";
    
    console.log(`
${c("bright", "═══ Result ═══")}

  Failure Mode: ${failureMode || "Not specified"}
  
  ${c("bright", "Scores:")}
    Severity:   ${severity}
    Occurrence: ${occurrence}
    Detection:  ${detection}
  
  ${c("bright", "Calculation:")} ${severity} × ${occurrence} × ${detection} = ${c("cyan", String(rpn))}
  
  ${c("bright", "RPN:")} ${c("cyan", String(rpn))}
  ${c("bright", "Priority:")} ${c(priorityColor, priority.level)}
  ${c("bright", "Action:")} ${priority.action}
`);
    
  } catch (error) {
    console.log(c("red", `Error: ${error}`));
  }
}

async function runDemo() {
  console.log(`\n${c("cyan", "═══ Demo: Library Management System ═══")}\n`);
  
  const demoArchitecture = `
Library Management System:
- Web App (React frontend) for patrons to search and reserve books
- REST API (Node.js/Express backend) handling all business logic
- Redis Cache for session management and search result caching
- MongoDB Database storing book catalog, user records, and borrow history
- Key Vault (HashiCorp Vault) for API keys and database credentials
- Users can search books, borrow items, manage their accounts
- Integration with email service for notifications
`;

  console.log(c("dim", "Architecture:"));
  console.log(demoArchitecture);
  
  console.log(`${c("yellow", "⏳ Running analysis...")}\n`);
  
  try {
    const result = await analyzeArchitecture({
      architecture: demoArchitecture,
      depth: "standard",
    });
    
    console.log(c("green", "✅ Demo Analysis Complete!\n"));
    
    console.log(c("bright", "Summary:"));
    console.log(`  Total Risks: ${result.summary.totalRisks}`);
    console.log(`  Critical:    ${result.summary.criticalRisks}`);
    console.log(`  Medium:      ${result.summary.mediumRisks}`);
    console.log(`  Low:         ${result.summary.lowRisks}`);
    
    console.log(`\n${c("bright", "All Identified Failure Modes:")}\n`);
    console.log("  ID         | RPN  | Priority | Category       | Failure Mode");
    console.log("  -----------|------|----------|----------------|---------------------------");
    
    for (const fm of result.failureModes) {
      const priorityColor = fm.priority === "Critical" ? "red" : 
                           fm.priority === "Medium" ? "yellow" : "green";
      console.log(
        `  ${fm.id.padEnd(10)} | ${String(fm.rpn).padEnd(4)} | ${c(priorityColor, fm.priority.padEnd(8))} | ${fm.category.substring(0, 14).padEnd(14)} | ${fm.failureMode.substring(0, 25)}`
      );
    }
    
    // Show detailed mitigation for top risk
    const topRisk = result.failureModes[0];
    console.log(`\n${c("bright", "Top Risk Mitigation Details:")}`);
    console.log(`\n${c("red", topRisk.id)}: ${topRisk.failureMode} (RPN: ${topRisk.rpn})`);
    console.log(`\n  ${c("yellow", "Tactical (Do Now):")}`);
    for (const m of topRisk.tacticalMitigation) {
      console.log(`    • ${m}`);
    }
    console.log(`\n  ${c("green", "Strategic (Plan):")}`);
    for (const m of topRisk.strategicMitigation) {
      console.log(`    • ${m}`);
    }
    
  } catch (error) {
    console.log(c("red", `Error: ${error}`));
  }
}

async function main() {
  printBanner();
  printHelp();
  
  while (true) {
    const input = await prompt(`\n${c("cyan", "prismo>")} `);
    const cmd = input.trim().toLowerCase();
    
    switch (cmd) {
      case "1":
      case "analyze":
        await runAnalyze();
        break;
      case "2":
      case "fmea":
        await runFMEA();
        break;
      case "3":
      case "rpn":
        await runRPN();
        break;
      case "4":
      case "demo":
        await runDemo();
        break;
      case "5":
      case "help":
        printHelp();
        break;
      case "6":
      case "exit":
      case "quit":
      case "q":
        console.log(c("cyan", "\nGoodbye! 👋\n"));
        rl.close();
        process.exit(0);
      case "":
        break;
      default:
        console.log(c("yellow", `Unknown command: ${input}. Type 'help' for options.`));
    }
  }
}

main().catch(console.error);
