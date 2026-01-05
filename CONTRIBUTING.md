# Contributing to Prismo

Thank you for your interest in contributing to Prismo! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/srestack/prismo.git
cd prismo

# Install dependencies
npm install

# Run tests
npm test

# Run demo
npm run demo
```

## Development Workflow

### Running Locally

```bash
# Development mode (with hot reload)
npm run dev

# Run tests
npm test

# Run demo
npm run demo

# Interactive CLI
npm run cli

# MCP Inspector (opens browser)
npm run inspector

# Build for production
npm run build
```

### Project Structure

```
prismo/
├── src/
│   ├── index.ts      # MCP server entry point
│   ├── analyzer.ts   # Architecture analysis engine
│   ├── fmea.ts       # FMEA worksheet generator
│   ├── rpn.ts        # RPN calculation utilities
│   ├── cli.ts        # Interactive CLI
│   ├── demo.ts       # Demo script
│   └── test.ts       # Test suite
├── .vscode/          # VS Code debug configs
├── package.json
└── tsconfig.json
```

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS)

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its use case
3. Explain how it fits with Prismo's goals

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit with clear messages: `git commit -m "Add: description"`
6. Push to your fork: `git push origin feature/your-feature`
7. Open a Pull Request

### Commit Message Format

```
Type: Short description

Longer description if needed.

Types:
- Add: New feature
- Fix: Bug fix
- Update: Improvement to existing feature
- Remove: Removed feature
- Docs: Documentation only
- Refactor: Code restructuring
```

## Code Style

- Use TypeScript with strict mode
- Follow existing code patterns
- Add JSDoc comments for public functions
- Keep functions focused and small

## Testing

- Add tests for new features
- Ensure all tests pass before submitting PR
- Test with both demo mode and API mode (if you have a key)

## Areas for Contribution

### Good First Issues

- Improve error messages
- Add more demo analysis patterns
- Enhance CLI output formatting
- Documentation improvements

### Feature Ideas

- Additional output formats (HTML, PDF)
- Risk trend tracking over time
- Integration with issue trackers
- Custom risk category definitions
- Batch analysis for multiple architectures

## Questions?

- Open a GitHub issue
- Reach out on [LinkedIn](https://linkedin.com/in/santosh-swamynathan)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
