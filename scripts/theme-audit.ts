import fs from 'fs';
import path from 'path';

/*
  GDY·UP Theme Audit CLI
  --------------------------------------
  Usage:  yarn theme-audit [--json]

  This script scans *.tsx, *.ts, *.jsx, *.js, and style files for:
    • Hard-coded HEX colors (e.g. #DAFF0D)
    • Tailwind color utilities that are NOT prefixed with "gdyup-" (e.g. text-black bg-white)
    • Inline style color declarations
    • "!important" overrides
    • React components that render UI but omit `useGdyupTheme()` (best-effort heuristic)

  Results are printed to the console and written to theme-audit-report.json
*/

interface Issue {
  file: string;
  line: number;
  text: string;
  category: 'hex-color' | 'tailwind-color' | 'inline-style' | 'important-override' | 'missing-theme-hook';
}

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

let targetDirs = ['app/gdyup'];
let exitOnCritical = true;

args.forEach(arg => {
  if (arg.startsWith('--dir=')) {
    const dir = arg.replace('--dir=', '').trim();
    if (dir) targetDirs = dir.split(',');
  }
  if (arg === '--all') {
    targetDirs = ['app', 'components', 'pages'];
  }
  if (arg === '--no-exit') {
    exitOnCritical = false;
  }
});

const SRC_DIRS = targetDirs;

const HEX_COLOR = /#(?:[0-9a-fA-F]{3,8})/g;
const IMPORTANT = /!\s*important/;
const INLINE_STYLE_COLOR = /(style={{[^}}]*color\s*:\s*['"`]?#[0-9a-fA-F]{3,8})/;

// Tailwind utilities we consider problematic (not exhaustive)
const TAILWIND_BAD = [
  /\btext-(?:black|white|gray-\d{3}|red-\d{3}|blue-\d{3}|green-\d{3})\b/,
  /\bbg-(?:black|white|gray-\d{3}|red-\d{3}|blue-\d{3}|green-\d{3})\b/,
];

function isCodeFile(file: string) {
  return /\.(tsx|ts|jsx|js|css|scss)$/.test(file);
}

function scanFile(filePath: string): Issue[] {
  const issues: Issue[] = [];

  let data: string;
  try {
    data = fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    return issues;
  }

  const lines = data.split(/\r?\n/);

  const hasThemeHook = data.includes('useGdyupTheme');
  const isComponentFile = /\.(tsx|jsx)$/.test(filePath) && /function|const|export default/.test(data);

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;

    // Hex colors
    if (HEX_COLOR.test(line)) {
      const matches = line.match(HEX_COLOR)!;
      matches.forEach(() => {
        issues.push({ file: filePath, line: lineNo, text: line.trim(), category: 'hex-color' });
      });
    }

    // Tailwind un-themed colors
    TAILWIND_BAD.forEach((re) => {
      if (re.test(line)) {
        issues.push({ file: filePath, line: lineNo, text: line.trim(), category: 'tailwind-color' });
      }
    });

    // Inline style color
    if (INLINE_STYLE_COLOR.test(line)) {
      issues.push({ file: filePath, line: lineNo, text: line.trim(), category: 'inline-style' });
    }

    // !important overrides
    if (IMPORTANT.test(line)) {
      issues.push({ file: filePath, line: lineNo, text: line.trim(), category: 'important-override' });
    }
  });

  // Missing theme hook heuristic: component file with jsx and className but no hook usage
  if (isComponentFile && !hasThemeHook && /class(Name)?=/.test(data)) {
    issues.push({
      file: filePath,
      line: 1,
      text: 'Potential missing useGdyupTheme()',
      category: 'missing-theme-hook',
    });
  }

  return issues;
}

function walk(dir: string, callback: (file: string) => void) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      walk(res, callback);
    } else if (entry.isFile()) {
      callback(res);
    }
  });
}

function runAudit() {
  const allIssues: Issue[] = [];

  SRC_DIRS.map((d) => path.join(ROOT, d)).forEach((srcDir) => {
    if (fs.existsSync(srcDir)) {
      walk(srcDir, (file) => {
        if (isCodeFile(file)) {
          allIssues.push(...scanFile(file));
        }
      });
    }
  });

  const byCategory = allIssues.reduce<Record<string, Issue[]>>((acc, cur) => {
    acc[cur.category] = acc[cur.category] || [];
    acc[cur.category].push(cur);
    return acc;
  }, {});

  // Console summary
  console.log('\n\x1b[36mGDY·UP Theme Audit Results\x1b[0m');
  Object.entries(byCategory).forEach(([cat, list]) => {
    console.log(`• ${cat}: ${list.length}`);
  });

  const writePath = path.join(ROOT, 'theme-audit-report.json');
  fs.writeFileSync(writePath, JSON.stringify(allIssues, null, 2));
  console.log(`\nDetailed report written to ${writePath} (${allIssues.length} issues)\n`);

  const hasCritical = allIssues.some((i) => i.category === 'hex-color' || i.category === 'important-override');
  if (exitOnCritical) {
    process.exit(hasCritical ? 1 : 0);
  }
}

if (require.main === module) {
  runAudit();
} 