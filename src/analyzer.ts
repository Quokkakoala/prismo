/**
 * Architecture Analyzer
 * 
 * Uses Claude AI to refract architecture descriptions into failure modes.
 * This is the core "prism" functionality of Prismo.
 */

import { calculateRPN, getRPNPriority } from "./rpn.js";

export interface ArchitectureInput {
  architecture: string;
  context?: string;
  depth: "quick" | "standard" | "deep";
}

export interface FailureMode {
  id: string;
  component: string;
  failureMode: string;
  effect: string;
  cause: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  priority: string;
  category: string;
  tacticalMitigation: string[];
  strategicMitigation: string[];
}

export interface AnalysisResult {
  summary: {
    totalRisks: number;
    criticalRisks: number;
    mediumRisks: number;
    lowRisks: number;
    minimalRisks: number;
    topRiskAreas: string[];
  };
  failureModes: FailureMode[];
  recommendations: string[];
  analysisDepth: string;
  timestamp: string;
}

// Risk categories for classification
const RISK_CATEGORIES = [
  "Availability",
  "Security",
  "Data Integrity",
  "Performance",
  "Scalability",
  "Observability",
  "Configuration",
  "Dependencies",
  "Networking",
  "Authentication",
];

/**
 * Analyze architecture and identify failure modes
 * 
 * This function calls Claude API to perform the analysis.
 * The API key should be provided via ANTHROPIC_API_KEY environment variable.
 */
export async function analyzeArchitecture(
  input: ArchitectureInput
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    // If no API key, return a demo analysis
    console.error("Warning: ANTHROPIC_API_KEY not set, returning demo analysis");
    return generateDemoAnalysis(input);
  }

  const depthConfig = {
    quick: { minRisks: 5, maxRisks: 10 },
    standard: { minRisks: 15, maxRisks: 25 },
    deep: { minRisks: 30, maxRisks: 50 },
  };

  const config = depthConfig[input.depth];

  const systemPrompt = `You are Prismo, an expert SRE and reliability engineer specializing in pre-mortem analysis and FMEA (Failure Mode and Effects Analysis). Your task is to analyze system architectures and identify potential failure modes.

For each failure mode, you MUST provide:
1. A unique ID (format: COMPONENT-NNN)
2. The component/service affected
3. The specific failure mode
4. The effect on the system/users
5. The root cause
6. Severity score (1-10): How bad is the impact?
7. Occurrence score (1-10): How often might it happen?
8. Detection score (1-10): How hard is it to detect before customers notice?
9. Category from: ${RISK_CATEGORIES.join(", ")}
10. Tactical mitigations (do now)
11. Strategic mitigations (plan for later)

Be thorough and realistic. Consider:
- Single points of failure
- Missing monitoring/observability
- Security vulnerabilities
- Data integrity risks
- Cascading failures
- External dependency failures
- Configuration drift
- Capacity/scaling issues
- Authentication/authorization gaps
- Network partitions`;

  const userPrompt = `Analyze this architecture and identify ${config.minRisks}-${config.maxRisks} potential failure modes:

ARCHITECTURE:
${input.architecture}

${input.context ? `ADDITIONAL CONTEXT:\n${input.context}` : ""}

Return your analysis as a JSON object with this exact structure:
{
  "failureModes": [
    {
      "id": "COMPONENT-001",
      "component": "Component Name",
      "failureMode": "What can fail",
      "effect": "Impact on system/users",
      "cause": "Root cause",
      "severity": 8,
      "occurrence": 4,
      "detection": 6,
      "category": "Availability",
      "tacticalMitigation": ["Action 1", "Action 2"],
      "strategicMitigation": ["Long-term fix 1", "Long-term fix 2"]
    }
  ],
  "recommendations": ["Top recommendation 1", "Top recommendation 2"]
}

Respond ONLY with valid JSON, no markdown or explanation.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error("No content in API response");
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);

    // Process and enrich the failure modes
    const failureModes: FailureMode[] = parsed.failureModes.map(
      (fm: any, index: number) => {
        const rpn = calculateRPN(fm.severity, fm.occurrence, fm.detection);
        const priority = getRPNPriority(rpn);
        return {
          id: fm.id || `RISK-${String(index + 1).padStart(3, "0")}`,
          component: fm.component,
          failureMode: fm.failureMode,
          effect: fm.effect,
          cause: fm.cause,
          severity: fm.severity,
          occurrence: fm.occurrence,
          detection: fm.detection,
          rpn,
          priority: priority.level,
          category: fm.category,
          tacticalMitigation: fm.tacticalMitigation || [],
          strategicMitigation: fm.strategicMitigation || [],
        };
      }
    );

    // Sort by RPN descending
    failureModes.sort((a, b) => b.rpn - a.rpn);

    // Calculate summary
    const summary = {
      totalRisks: failureModes.length,
      criticalRisks: failureModes.filter((fm) => fm.rpn >= 200).length,
      mediumRisks: failureModes.filter((fm) => fm.rpn >= 100 && fm.rpn < 200).length,
      lowRisks: failureModes.filter((fm) => fm.rpn >= 50 && fm.rpn < 100).length,
      minimalRisks: failureModes.filter((fm) => fm.rpn < 50).length,
      topRiskAreas: [...new Set(failureModes.slice(0, 5).map((fm) => fm.category))],
    };

    return {
      summary,
      failureModes,
      recommendations: parsed.recommendations || [],
      analysisDepth: input.depth,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error calling Claude API:", error);
    throw error;
  }
}

/**
 * Generate a demo analysis when no API key is available
 */
function generateDemoAnalysis(input: ArchitectureInput): AnalysisResult {
  // Extract component names from the architecture description
  const componentPatterns = [
    /\b(web\s*app|frontend|ui)\b/gi,
    /\b(api|backend|rest\s*api|graphql)\b/gi,
    /\b(database|db|postgres|mysql|mongodb|documentdb)\b/gi,
    /\b(cache|redis|memcached)\b/gi,
    /\b(queue|rabbitmq|kafka|sqs)\b/gi,
    /\b(key\s*vault|secrets|hsm)\b/gi,
    /\b(load\s*balancer|lb|nginx|haproxy)\b/gi,
    /\b(storage|blob|s3)\b/gi,
  ];

  const components: string[] = [];
  for (const pattern of componentPatterns) {
    const matches = input.architecture.match(pattern);
    if (matches) {
      components.push(...matches.map(m => m.toLowerCase()));
    }
  }

  // Default components if none detected
  if (components.length === 0) {
    components.push("web app", "api", "database");
  }

  // Generate demo failure modes based on detected components
  const demoFailureModes: FailureMode[] = [];
  let riskIndex = 1;

  // Add risks for each detected component
  const componentRisks: Record<string, Partial<FailureMode>[]> = {
    "web app": [
      {
        failureMode: "Session management failure",
        effect: "Users logged out unexpectedly, lost work",
        cause: "Session timeout misconfiguration or token expiration",
        severity: 6, occurrence: 5, detection: 4,
        category: "Authentication",
        tacticalMitigation: ["Review session timeout settings", "Add session warning notifications"],
        strategicMitigation: ["Implement sliding session expiration", "Add session persistence layer"],
      },
    ],
    frontend: [
      {
        failureMode: "JavaScript bundle too large",
        effect: "Slow page loads, poor user experience",
        cause: "Unoptimized dependencies and no code splitting",
        severity: 5, occurrence: 6, detection: 3,
        category: "Performance",
        tacticalMitigation: ["Analyze bundle with webpack-analyzer", "Remove unused dependencies"],
        strategicMitigation: ["Implement code splitting", "Add CDN for static assets"],
      },
    ],
    api: [
      {
        failureMode: "Rate limiting not implemented",
        effect: "API overwhelmed, service degradation for all users",
        cause: "Missing rate limiting middleware",
        severity: 8, occurrence: 4, detection: 6,
        category: "Availability",
        tacticalMitigation: ["Add basic IP-based rate limiting", "Monitor request volumes"],
        strategicMitigation: ["Implement tiered rate limiting", "Add API gateway with throttling"],
      },
      {
        failureMode: "No request timeout configured",
        effect: "Thread pool exhaustion, cascading failures",
        cause: "Long-running requests holding connections",
        severity: 7, occurrence: 5, detection: 7,
        category: "Availability",
        tacticalMitigation: ["Add timeout middleware", "Set database query timeouts"],
        strategicMitigation: ["Implement circuit breakers", "Add request deadline propagation"],
      },
    ],
    backend: [
      {
        failureMode: "Unhandled exception crashes service",
        effect: "Complete service outage until restart",
        cause: "Missing global error handler",
        severity: 9, occurrence: 3, detection: 5,
        category: "Availability",
        tacticalMitigation: ["Add global exception handler", "Implement graceful shutdown"],
        strategicMitigation: ["Add process supervisor", "Implement health checks with auto-restart"],
      },
    ],
    database: [
      {
        failureMode: "Single database instance (no replication)",
        effect: "Complete data loss if instance fails",
        cause: "No high availability configuration",
        severity: 10, occurrence: 2, detection: 8,
        category: "Data Integrity",
        tacticalMitigation: ["Enable automated backups", "Document recovery procedure"],
        strategicMitigation: ["Configure read replicas", "Implement multi-region deployment"],
      },
      {
        failureMode: "Connection pool exhaustion",
        effect: "New requests fail, service degradation",
        cause: "Connection leaks or undersized pool",
        severity: 8, occurrence: 4, detection: 5,
        category: "Availability",
        tacticalMitigation: ["Monitor connection pool metrics", "Review connection lifecycle"],
        strategicMitigation: ["Implement connection pool sizing automation", "Add circuit breaker"],
      },
    ],
    db: [
      {
        failureMode: "No query performance monitoring",
        effect: "Slow queries degrade overall performance",
        cause: "Missing query analysis tooling",
        severity: 6, occurrence: 6, detection: 8,
        category: "Observability",
        tacticalMitigation: ["Enable slow query logging", "Review top queries manually"],
        strategicMitigation: ["Implement APM with query tracing", "Add automated index recommendations"],
      },
    ],
    cache: [
      {
        failureMode: "Cache invalidation failure",
        effect: "Stale data shown to users",
        cause: "Missing or incorrect cache invalidation logic",
        severity: 6, occurrence: 5, detection: 6,
        category: "Data Integrity",
        tacticalMitigation: ["Review cache TTL settings", "Add manual cache clear endpoint"],
        strategicMitigation: ["Implement event-driven cache invalidation", "Add cache versioning"],
      },
    ],
    redis: [
      {
        failureMode: "Redis memory exhaustion",
        effect: "Cache evictions, performance degradation",
        cause: "No memory limits or eviction policy",
        severity: 7, occurrence: 4, detection: 5,
        category: "Performance",
        tacticalMitigation: ["Set maxmemory limit", "Configure eviction policy"],
        strategicMitigation: ["Implement cache tiering", "Add memory usage alerting"],
      },
    ],
    "key vault": [
      {
        failureMode: "Secret expiration not monitored",
        effect: "Service outage when credentials expire",
        cause: "No alerting on secret expiry dates",
        severity: 9, occurrence: 4, detection: 7,
        category: "Configuration",
        tacticalMitigation: ["Document all secret expiry dates", "Set calendar reminders"],
        strategicMitigation: ["Implement automated secret rotation", "Add expiry monitoring alerts"],
      },
    ],
    secrets: [
      {
        failureMode: "Secrets in environment variables",
        effect: "Credentials leaked in logs or crash dumps",
        cause: "Insecure secret storage pattern",
        severity: 9, occurrence: 3, detection: 8,
        category: "Security",
        tacticalMitigation: ["Audit logging for secret exposure", "Rotate exposed credentials"],
        strategicMitigation: ["Migrate to secret manager", "Implement secret scanning in CI"],
      },
    ],
  };

  // General risks that apply to most systems
  const generalRisks: Partial<FailureMode>[] = [
    {
      component: "Infrastructure",
      failureMode: "No centralized logging",
      effect: "Unable to diagnose issues, extended MTTR",
      cause: "Logs scattered across multiple systems",
      severity: 6, occurrence: 5, detection: 7,
      category: "Observability",
      tacticalMitigation: ["Set up log aggregation", "Standardize log format"],
      strategicMitigation: ["Implement ELK/Datadog/similar", "Add log-based alerting"],
    },
    {
      component: "Monitoring",
      failureMode: "Missing health check endpoints",
      effect: "Load balancer routes traffic to unhealthy instances",
      cause: "No health check implementation",
      severity: 7, occurrence: 4, detection: 6,
      category: "Availability",
      tacticalMitigation: ["Add basic /health endpoint", "Configure load balancer health checks"],
      strategicMitigation: ["Implement deep health checks", "Add dependency health verification"],
    },
    {
      component: "Deployment",
      failureMode: "No rollback procedure",
      effect: "Extended outage during bad deployments",
      cause: "Missing deployment automation",
      severity: 8, occurrence: 3, detection: 5,
      category: "Availability",
      tacticalMitigation: ["Document manual rollback steps", "Keep previous version artifacts"],
      strategicMitigation: ["Implement blue-green deployments", "Add automated rollback triggers"],
    },
  ];

  // Build failure modes from detected components
  for (const component of [...new Set(components)]) {
    const risks = componentRisks[component];
    if (risks) {
      for (const risk of risks) {
        const rpn = calculateRPN(risk.severity!, risk.occurrence!, risk.detection!);
        const priority = getRPNPriority(rpn);
        demoFailureModes.push({
          id: `RISK-${String(riskIndex++).padStart(3, "0")}`,
          component: component.toUpperCase().replace(/\s+/g, "-"),
          failureMode: risk.failureMode!,
          effect: risk.effect!,
          cause: risk.cause!,
          severity: risk.severity!,
          occurrence: risk.occurrence!,
          detection: risk.detection!,
          rpn,
          priority: priority.level,
          category: risk.category!,
          tacticalMitigation: risk.tacticalMitigation || [],
          strategicMitigation: risk.strategicMitigation || [],
        });
      }
    }
  }

  // Add general risks
  for (const risk of generalRisks) {
    const rpn = calculateRPN(risk.severity!, risk.occurrence!, risk.detection!);
    const priority = getRPNPriority(rpn);
    demoFailureModes.push({
      id: `RISK-${String(riskIndex++).padStart(3, "0")}`,
      component: risk.component!,
      failureMode: risk.failureMode!,
      effect: risk.effect!,
      cause: risk.cause!,
      severity: risk.severity!,
      occurrence: risk.occurrence!,
      detection: risk.detection!,
      rpn,
      priority: priority.level,
      category: risk.category!,
      tacticalMitigation: risk.tacticalMitigation || [],
      strategicMitigation: risk.strategicMitigation || [],
    });
  }

  // Sort by RPN descending
  demoFailureModes.sort((a, b) => b.rpn - a.rpn);

  // Limit based on depth
  const limits = { quick: 8, standard: 15, deep: 25 };
  const limited = demoFailureModes.slice(0, limits[input.depth]);

  const summary = {
    totalRisks: limited.length,
    criticalRisks: limited.filter((fm) => fm.rpn >= 200).length,
    mediumRisks: limited.filter((fm) => fm.rpn >= 100 && fm.rpn < 200).length,
    lowRisks: limited.filter((fm) => fm.rpn >= 50 && fm.rpn < 100).length,
    minimalRisks: limited.filter((fm) => fm.rpn < 50).length,
    topRiskAreas: [...new Set(limited.slice(0, 5).map((fm) => fm.category))],
  };

  return {
    summary,
    failureModes: limited,
    recommendations: [
      "Prioritize fixing Critical and Medium priority risks within this quarter",
      "Implement centralized observability to improve detection scores",
      "Review single points of failure and add redundancy",
      "Document runbooks for top 5 failure modes",
      "Schedule quarterly pre-mortem reviews to track progress",
    ],
    analysisDepth: input.depth,
    timestamp: new Date().toISOString(),
  };
}
