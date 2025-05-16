# GitHub Actions Workflows

This directory contains GitHub Actions workflow configurations for various automated processes in the Email Whisperer project.

## Available Workflows

### CI (`workflows/ci.yml`)

Continuous Integration workflow that runs on pull requests and pushes to the main branch.

**Checks performed:**

- Code formatting validation (Prettier)
- Code linting (ESLint)
- Type checking (TypeScript)
- Build verification

This workflow helps ensure that all code contributions meet the project's quality standards before merging.

## Adding New Workflows

When adding new workflows, please:

1. Add a descriptive name for the workflow
2. Document the workflow's purpose and triggers
3. Ensure the workflow has appropriate permissions
4. Test the workflow before merging

## Workflow Configuration

The workflows are configured to use:

- Node.js 22
- PNPM 8.15.5
- Caching for faster dependency installation
- Ubuntu latest runner

To modify these settings, edit the respective workflow files in the `workflows` directory.
