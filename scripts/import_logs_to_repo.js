#!/usr/bin/env node
// Usage: node import_logs_to_repo.js /path/to/downloaded/log.json
// Copies the specified JSON log file into the `logs/` folder in the project root.

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Please provide the path to the exported log JSON file.');
  console.error('Example: node import_logs_to_repo.js ~/Downloads/detection_logs_2025-11-14.json');
  process.exit(2);
}

const src = path.resolve(args[0]);
const projectRoot = path.resolve(path.join(process.cwd()));
const logsDir = path.join(projectRoot, 'logs');

if (!fs.existsSync(src)) {
  console.error('File does not exist:', src);
  process.exit(3);
}

try {
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  const destName = `detection_import_${new Date().toISOString().replace(/[:.]/g,'-')}${path.extname(src)}`;
  const dest = path.join(logsDir, destName);
  fs.copyFileSync(src, dest);
  console.log('Imported logs to', dest);
} catch (e) {
  console.error('Failed to import logs:', e);
  process.exit(4);
}
