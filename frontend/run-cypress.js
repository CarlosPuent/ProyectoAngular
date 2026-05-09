#!/usr/bin/env node
/**
 * Cypress launcher — removes ELECTRON_RUN_AS_NODE before starting Cypress.
 *
 * Background: This system has ELECTRON_RUN_AS_NODE=1 set globally (used by
 * VS Code / Copilot CLI). Without clearing it, the Cypress Electron binary
 * runs as plain Node.js instead of the Electron GUI, causing startup failure.
 */
const { spawnSync } = require('child_process');
const path         = require('path');

delete process.env.ELECTRON_RUN_AS_NODE;

const args       = process.argv.slice(2);
const isWin      = process.platform === 'win32';
const binName    = isWin ? 'cypress.cmd' : 'cypress';
const cypressBin = path.join(__dirname, 'node_modules', '.bin', binName);

const result = spawnSync(cypressBin, args, {
  stdio:  'inherit',
  env:    process.env,
  shell:  false,
});

process.exit(result.status ?? 0);
