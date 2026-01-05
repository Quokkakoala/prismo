/**
 * Prismo Test Script
 * 
 * Tests the core functionality of the Prismo MCP server.
 * Run with: npm test
 */

import { analyzeArchitecture } from "./analyzer.js";
import { generateFMEA } from "./fmea.js";
import { calculateRPN, getRPNPriority } from "./rpn.js";

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(color: keyof typeof colors, ...args: any[]) {
  console.log(colors[color], ...args, colors.reset);
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log("\n" + "=".repeat(60));
  log("blue", "🔬 PRISMO TEST SUITE");
  console.log("=".repeat(60) + "\n");

  // Test 1: RPN Calculation
  console.log("Test 1: RPN Calculation");
  try {
    const rpn = calculateRPN(9, 4, 7);
    if (rpn === 252) {
      log("green", "  ✓ calculateRPN(9, 4, 7) = 252");
      passed++;
    } else {
      log("red", `  ✗ Expected 252, got ${rpn}`);
      failed++;
    }
  } catch (e) {
    log("red", `  ✗ Error: ${e}`);
    failed++;
  }

  // Test 2: RPN Priority
  console.log("\nTest 2: RPN Priority Levels");
  try {
    const critical = getRPNPriority(252);
    const medium = getRPNPriority(150);
    const low = getRPNPriority(75);
    const minimal = getRPNPriority(25);

    if (critical.level === "Critical") {
      log("green", "  ✓ RPN 252 = Critical");
      passed++;
    } else {
      log("red", `  ✗ Expected Critical, got ${critical.level}`);
      failed++;
    }

    if (medium.level === "Medium") {
      log("green", "  ✓ RPN 150 = Medium");
      passed++;
    } else {
      log("red", `  ✗ Expected Medium, got ${medium.level}`);
      failed++;
    }

    if (low.level === "Low") {
      log("green", "  ✓ RPN 75 = Low");
      passed++;
    } else {
      log("red", `  ✗ Expected Low, got ${low.level}`);
      failed++;
    }

    if (minimal.level === "Minimal") {
      log("green", "  ✓ RPN 25 = Minimal");
      passed++;
    } else {
      log("red", `  ✗ Expected Minimal, got ${minimal.level}`);
      failed++;
    }
  } catch (e) {
    log("red", `  ✗ Error: ${e}`);
    failed++;
  }

  // Test 3: Architecture Analysis (Demo Mode)
  console.log("\nTest 3: Architecture Analysis (Demo Mode)");
  try {
    const testArchitecture = `
      Library Management System with:
      - Web App (React frontend)
      - REST API (Node.js backend)
      - Redis Cache for session and search caching
      - Document DB (MongoDB) for book catalog and user records
      - Key Vault for API keys and database credentials
    `;

    const result = await analyzeArchitecture({
      architecture: testArchitecture,
      depth: "quick",
    });

    if (result.failureModes.length > 0) {
      log("green", `  ✓ Analysis returned ${result.failureModes.length} failure modes`);
      passed++;
    } else {
      log("red", "  ✗ No failure modes returned");
      failed++;
    }

    if (result.summary.totalRisks === result.failureModes.length) {
      log("green", "  ✓ Summary count matches failure modes");
      passed++;
    } else {
      log("red", "  ✗ Summary count mismatch");
      failed++;
    }

    // Verify RPN values are calculated
    const allHaveRPN = result.failureModes.every(fm => fm.rpn > 0);
    if (allHaveRPN) {
      log("green", "  ✓ All failure modes have RPN calculated");
      passed++;
    } else {
      log("red", "  ✗ Some failure modes missing RPN");
      failed++;
    }

    // Verify sorted by RPN descending
    let sorted = true;
    for (let i = 1; i < result.failureModes.length; i++) {
      if (result.failureModes[i].rpn > result.failureModes[i-1].rpn) {
        sorted = false;
        break;
      }
    }
    if (sorted) {
      log("green", "  ✓ Failure modes sorted by RPN (descending)");
      passed++;
    } else {
      log("red", "  ✗ Failure modes not properly sorted");
      failed++;
    }

  } catch (e) {
    log("red", `  ✗ Error: ${e}`);
    failed++;
  }

  // Test 4: FMEA Generation - Markdown
  console.log("\nTest 4: FMEA Markdown Generation");
  try {
    const fmea = await generateFMEA({
      architecture: "Simple web app with API and database",
      format: "markdown",
      includeMitigations: true,
    });

    if (fmea.includes("# FMEA Worksheet")) {
      log("green", "  ✓ Markdown has title header");
      passed++;
    } else {
      log("red", "  ✗ Missing title header");
      failed++;
    }

    if (fmea.includes("## Summary")) {
      log("green", "  ✓ Markdown has summary section");
      passed++;
    } else {
      log("red", "  ✗ Missing summary section");
      failed++;
    }

    if (fmea.includes("| ID |")) {
      log("green", "  ✓ Markdown has FMEA table");
      passed++;
    } else {
      log("red", "  ✗ Missing FMEA table");
      failed++;
    }

    if (fmea.includes("Tactical (Do Now)")) {
      log("green", "  ✓ Markdown includes mitigations");
      passed++;
    } else {
      log("red", "  ✗ Missing mitigations");
      failed++;
    }

  } catch (e) {
    log("red", `  ✗ Error: ${e}`);
    failed++;
  }

  // Test 5: FMEA Generation - CSV
  console.log("\nTest 5: FMEA CSV Generation");
  try {
    const csv = await generateFMEA({
      architecture: "API with Redis cache",
      format: "csv",
      includeMitigations: false,
    });

    if (csv.includes("ID,Component,Failure Mode")) {
      log("green", "  ✓ CSV has proper headers");
      passed++;
    } else {
      log("red", "  ✗ Missing or incorrect headers");
      failed++;
    }

    const lines = csv.split("\n");
    if (lines.length > 1) {
      log("green", `  ✓ CSV has ${lines.length - 1} data rows`);
      passed++;
    } else {
      log("red", "  ✗ No data rows in CSV");
      failed++;
    }

  } catch (e) {
    log("red", `  ✗ Error: ${e}`);
    failed++;
  }

  // Test 6: FMEA Generation - JSON
  console.log("\nTest 6: FMEA JSON Generation");
  try {
    const json = await generateFMEA({
      architecture: "Microservices with message queue",
      format: "json",
      includeMitigations: true,
    });

    const parsed = JSON.parse(json);
    if (parsed.failureModes && Array.isArray(parsed.failureModes)) {
      log("green", "  ✓ JSON has failureModes array");
      passed++;
    } else {
      log("red", "  ✗ Missing failureModes array");
      failed++;
    }

    if (parsed.summary) {
      log("green", "  ✓ JSON has summary object");
      passed++;
    } else {
      log("red", "  ✗ Missing summary object");
      failed++;
    }

  } catch (e) {
    log("red", `  ✗ Error: ${e}`);
    failed++;
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  const total = passed + failed;
  if (failed === 0) {
    log("green", `✅ ALL TESTS PASSED (${passed}/${total})`);
  } else {
    log("yellow", `⚠️  Tests: ${passed} passed, ${failed} failed (${total} total)`);
  }
  console.log("=".repeat(60) + "\n");

  // Print sample output
  console.log("\n📋 Sample FMEA Output (Markdown):\n");
  console.log("-".repeat(60));
  
  const sampleFMEA = await generateFMEA({
    architecture: `
      Library Management System:
      - Web App (React frontend)
      - REST API (Express backend)  
      - Redis Cache
      - MongoDB Database
      - Key Vault for secrets
    `,
    format: "markdown",
    includeMitigations: true,
  });
  
  // Print first 100 lines
  const sampleLines = sampleFMEA.split("\n").slice(0, 80);
  console.log(sampleLines.join("\n"));
  console.log("\n... (truncated)");
  console.log("-".repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
