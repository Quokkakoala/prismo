# Changelog

All notable changes to Prismo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-04

### Added

- **MCP Server** with three tools:
  - `analyze_architecture` - Refract architecture into failure modes
  - `get_fmea` - Generate FMEA worksheets (JSON/Markdown/CSV)
  - `calculate_rpn` - Calculate Risk Priority Numbers

- **AI-Powered Analysis** using Claude API
  - Automatic failure mode identification
  - SOD scoring (Severity × Occurrence × Detection)
  - Tactical and strategic mitigation suggestions

- **Demo Mode** - Pattern-based analysis when no API key is set

- **Interactive CLI** (`npm run cli`) for testing

- **VS Code Integration** - Debug configurations included

- **Comprehensive Documentation**
  - README with usage examples
  - Methodology guide as MCP resource
  - RPN scoring reference

### Technical Details

- Built with TypeScript and MCP SDK
- Zod schema validation for tool inputs
- Supports Node.js 18+

---

## Future Roadmap

- [ ] Historical risk tracking
- [ ] Integration with Jira/GitHub Issues
- [ ] Risk trend visualization
- [ ] Team collaboration features
- [ ] Custom risk categories
