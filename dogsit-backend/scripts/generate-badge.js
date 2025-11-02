const path = require('path');
const { create } = require('coverage-badges-cli/lib/create');

const source = path.join(process.cwd(), 'config', 'coverage', 'coverage-summary.json');
const output = path.join(process.cwd(), 'config', 'coverage', 'badge.svg');

try {
  create({ source, output, style: 'flat' });
  console.log('Badge generated: config/coverage/badge.svg');
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
}