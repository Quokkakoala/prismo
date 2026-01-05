#!/usr/bin/env node

/**
 * Prismo MCP Server
 * 
 * AI-powered pre-mortem analysis tool that refracts your architecture 
 * into a spectrum of risks - just like a prism breaks white light.
 * 
 * Tools:
 * - analyze_architecture: Refract architecture into failure modes
 * - get_fmea: Generate complete FMEA worksheet
 * - calculate_rpn: Calculate Risk Priority Number for a failure mode
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { analyzeArchitecture, type ArchitectureInput } from "./analyzer.js";
import { generateFMEA, type FMEAOptions } from "./fmea.js";
import { calculateRPN, getRPNPriority } from "./rpn.js";

// Create the MCP server
const server = new McpServer({
  name: "prismo",
  version: "1.0.0",
});

// Tool: Analyze Architecture
server.tool(
  "analyze_architecture",
  "Refract an architecture description into a spectrum of risks and failure modes. " +
  "Provide a description of your system architecture and Prismo will identify potential " +
  "failure points, categorize them, and suggest mitigations.",
  {
    architecture: z.string().describe(
      "Description of the system architecture including components, connections, " +
      "data flows, and any relevant infrastructure details"
    ),
    context: z.string().optional().describe(
      "Additional context like business criticality, compliance requirements, " +
      "or specific areas of concern"
    ),
    depth: z.enum(["quick", "standard", "deep"]).default("standard").describe(
      "Analysis depth: quick (5-10 risks), standard (15-25 risks), deep (30+ risks)"
    ),
  },
  async ({ architecture, context, depth }) => {
    try {
      const input: ArchitectureInput = {
        architecture,
        context,
        depth: depth as "quick" | "standard" | "deep",
      };
      
      const result = await analyzeArchitecture(input);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error analyzing architecture: ${message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Generate FMEA Worksheet
server.tool(
  "get_fmea",
  "Generate a complete FMEA (Failure Mode and Effects Analysis) worksheet from " +
  "architecture analysis results. Returns a structured table with failure modes, " +
  "effects, SOD scores, RPN values, and recommended mitigations.",
  {
    architecture: z.string().describe(
      "System architecture description to analyze"
    ),
    format: z.enum(["json", "markdown", "csv"]).default("markdown").describe(
      "Output format for the FMEA worksheet"
    ),
    include_mitigations: z.boolean().default(true).describe(
      "Include tactical and strategic mitigation recommendations"
    ),
  },
  async ({ architecture, format, include_mitigations }) => {
    try {
      const options: FMEAOptions = {
        architecture,
        format: format as "json" | "markdown" | "csv",
        includeMitigations: include_mitigations,
      };
      
      const result = await generateFMEA(options);
      
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error generating FMEA: ${message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Calculate RPN
server.tool(
  "calculate_rpn",
  "Calculate the Risk Priority Number (RPN) for a failure mode using the formula: " +
  "RPN = Severity × Occurrence × Detection. Also returns the priority level and " +
  "recommended action timeline.",
  {
    severity: z.number().min(1).max(10).describe(
      "Severity score (1-10): How bad is the impact? 10=catastrophic, 1=minor"
    ),
    occurrence: z.number().min(1).max(10).describe(
      "Occurrence score (1-10): How often does it happen? 10=constant, 1=rare"
    ),
    detection: z.number().min(1).max(10).describe(
      "Detection score (1-10): Can we catch it? 10=no detection, 1=always caught"
    ),
    failure_mode: z.string().optional().describe(
      "Optional description of the failure mode for context"
    ),
  },
  async ({ severity, occurrence, detection, failure_mode }) => {
    const rpn = calculateRPN(severity, occurrence, detection);
    const priority = getRPNPriority(rpn);
    
    const result = {
      failure_mode: failure_mode || "Unspecified",
      scores: {
        severity,
        occurrence,
        detection,
      },
      rpn,
      priority: priority.level,
      action: priority.action,
      rpn_breakdown: `${severity} × ${occurrence} × ${detection} = ${rpn}`,
    };
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Resource: Prismo methodology guide
server.resource(
  "prismo://methodology",
  "Prismo pre-mortem methodology guide",
  async () => ({
    contents: [
      {
        uri: "prismo://methodology",
        mimeType: "text/markdown",
        text: `# Prismo Pre-Mortem Methodology

## The Prism Metaphor
Just like a prism breaks white light into a visible spectrum, Prismo breaks your 
architecture into a spectrum of risks — revealing hidden failure modes, categorizing 
them by type, and making the invisible visible.

## RPN Scoring (Severity × Occurrence × Detection)

### Severity (S) - Business Impact
| Score | Meaning |
|-------|---------|
| 10 | Catastrophic - complete service failure |
| 7-9 | Major - significant customer impact |
| 4-6 | Moderate - degraded experience |
| 1-3 | Minor - barely noticeable |

### Occurrence (O) - Frequency
| Score | Meaning |
|-------|---------|
| 10 | Constant - happens daily |
| 7-9 | Frequent - weekly |
| 4-6 | Occasional - monthly |
| 1-3 | Rare - annually or never |

### Detection (D) - Monitoring
| Score | Meaning |
|-------|---------|
| 10 | No detection - customers report it |
| 7-9 | Poor - usually miss it |
| 4-6 | Moderate - sometimes catch it |
| 1-3 | Good - almost always catch it first |

## Priority Actions
| RPN Range | Priority | Action |
|-----------|----------|--------|
| 200-1000 | Critical | Fix this sprint, escalate to leadership |
| 100-199 | Medium | Plan within quarter |
| 50-99 | Low | Add to backlog |
| 1-49 | Minimal | Document and monitor |

## Best Practices
- Identify stakeholders deeply before starting
- Align with leadership on goals
- Measure first - you can't improve what you can't measure
- Collaborate - build your network
- Celebrate wins - create awareness of milestones
`,
      },
    ],
  })
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Prismo MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
