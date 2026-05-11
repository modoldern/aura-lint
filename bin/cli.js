#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Terminal ANSI color codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  gray: "\x1b[90m",
  blue: "\x1b[34m"
};

// Parse arguments for flags and target path
const args = process.argv.slice(2);
const isDetailed = args.includes('-f');
const isLinkMode = args.includes('-l');

// Determine language (default: English)
const isTr = args.includes('-tr');
const isAz = args.includes('-az');
const isEn = args.includes('-en');
let currentLang = 'en';
if (isTr) currentLang = 'tr';
if (isAz) currentLang = 'az';

// Extract target path (filter out all known flags)
const targetPath = args.find(arg => !['-f', '-l', '-tr', '-az', '-en'].includes(arg));

// Load language dictionary
const i18nPath = path.join(__dirname, `../locales/${currentLang}.json`);
const t = JSON.parse(fs.readFileSync(i18nPath, 'utf8'));

if (!targetPath) {
  console.log(`${colors.red}${t.cli.error_path}${colors.reset}`);
  console.log(`${colors.gray}${t.cli.example_usage}${colors.reset}`);
  process.exit(1);
}

// --- LOAD AND MERGE RULES ---
// 1. Load default system rules
const defaultRulesPath = path.join(__dirname, '../rules/rules.json');
let rules = JSON.parse(fs.readFileSync(defaultRulesPath, 'utf8'));

// 2. Check for custom configuration file in the user's execution directory (root)
const customRulesPath = path.join(process.cwd(), 'auralint.json');

if (fs.existsSync(customRulesPath)) {
  console.log(`${colors.cyan}ℹ Custom configuration found: auralint.json loaded.${colors.reset}\n`);
  const customRules = JSON.parse(fs.readFileSync(customRulesPath, 'utf8'));
  
  // 3. Merge custom rules with default rules
  if (customRules.must_not_have) {
    rules.must_not_have = [...rules.must_not_have, ...customRules.must_not_have];
  }
  if (customRules.must_have) {
    rules.must_have = [...rules.must_have, ...customRules.must_have];
  }
}

// --- SMART TAILWIND SUGGESTION ENGINE ---
function getTailwindSuggestion(matchedString) {
  const parts = matchedString.match(/([a-z-]+)-\[([\d.]+)(px|rem|em)\]/);
  if (!parts) return "";

  const prefix = parts[1];
  const val = parseFloat(parts[2]);
  const unit = parts[3];

  let pxVal = val;
  if (unit === 'rem' || unit === 'em') pxVal = val * 16;

  if (prefix === 'text') {
    const textSizes = {
      'xs': 12, 'sm': 14, 'base': 16, 'lg': 18, 'xl': 20,
      '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60
    };
    let closest = 'base';
    let minDiff = Infinity;
    
    for (const [name, size] of Object.entries(textSizes)) {
      const diff = Math.abs(size - pxVal);
      if (diff < minDiff) {
        minDiff = diff;
        closest = name;
      }
    }
    return `${colors.yellow} 💡 ${t.cli.suggestion}: ${prefix}-${closest} (~${textSizes[closest]}px)${colors.reset}`;
  } else {
    const twClass = pxVal / 4;
    if (Number.isInteger(twClass)) {
      return `${colors.yellow} 💡 ${t.cli.suggestion}: ${prefix}-${twClass} (${pxVal}px)${colors.reset}`;
    } else {
      const closest = Math.round(twClass);
      return `${colors.yellow} 💡 ${t.cli.suggestion}: ${prefix}-${closest} (~${closest * 4}px)${colors.reset}`;
    }
  }
}

function checkFile(filePath) {
  // Support both Svelte and generic JS/TS files for a broader ecosystem
  if (!filePath.match(/\.(svelte|js|ts|jsx|tsx)$/)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`\n${colors.bold}${colors.cyan}--- 🔍 ${t.cli.inspecting}: ${filePath} ---${colors.reset}`);
  
  let errors = 0;
  let globalViolationIndex = 0;

  // CHECK "MUST NOT HAVE" RULES
  if (rules.must_not_have) {
    rules.must_not_have.forEach(rule => {
      let matchCount = 0;
      let details = [];
      let hasSuggestion = false;

      lines.forEach((line, index) => {
        const regex = new RegExp(rule.pattern, 'g');
        let match;
        while ((match = regex.exec(line)) !== null) {
          matchCount++;
          globalViolationIndex++;
          
          const cleanLine = line.trim().substring(0, 50); 
          
          let suggestion = "";
          if (match[0].includes('[')) {
            suggestion = getTailwindSuggestion(match[0]);
            if (suggestion) hasSuggestion = true;
          }

          let linePrefix = "";
          if (isLinkMode) {
            const clickableLink = `${filePath}:${index + 1}`;
            linePrefix = `${colors.gray}(#${globalViolationIndex}) 👉 ${colors.blue}${colors.bold}${clickableLink}${colors.reset}`;
          } else {
            linePrefix = `${colors.gray}${index + 1}(#${globalViolationIndex})${colors.reset}`;
          }

          details.push(`    ${linePrefix} ${colors.gray}|${colors.reset} ${colors.red}${match[0]}${colors.reset}${suggestion} ${colors.gray}| ( ${cleanLine}... )${colors.reset}`);
        }
      });

      if (matchCount > 0) {
        // Fetch custom error message if provided, else fetch translated error from dictionary
        const translatedError = rule.errorMsg || t.rules[rule.id] || `Unknown Error (${rule.id})`;
        console.log(`${colors.red}✖ ${translatedError} (${colors.bold}${matchCount} ${t.cli.violations_count}${colors.reset}${colors.red})${colors.reset}`);
        
        if (isDetailed) {
          const headerTitle = isLinkMode ? `${t.cli.link} (#NO)` : `${t.cli.line} (#NO)`;
          let violationHeader = `${colors.reset}${colors.red}${t.cli.violation_code}${colors.reset}${colors.gray}${colors.bold}`;
          
          if (hasSuggestion) {
            violationHeader = `${colors.reset}${colors.red}${t.cli.violation_code}${colors.reset}${colors.gray}${colors.bold} & ${colors.reset}${colors.yellow}${t.cli.suggestion}${colors.reset}${colors.gray}${colors.bold}`;
          }

          console.log(`    ${colors.gray}${colors.bold}${headerTitle} | ${violationHeader} | ${t.cli.code_snippet}${colors.reset}`);
          console.log(`    ${colors.gray}------------------------------------------------------------${colors.reset}`);
          details.forEach(detail => console.log(detail));
          console.log(""); 
        }
        errors++;
      }
    });
  }

  // CHECK "MUST HAVE" RULES
  if (rules.must_have) {
    rules.must_have.forEach(rule => {
      const regex = new RegExp(rule.pattern, 'g');
      if (!regex.test(content)) {
        // Fetch custom error message if provided, else fetch translated error from dictionary
        const translatedError = rule.errorMsg || t.rules[rule.id] || `Unknown Error (${rule.id})`;
        console.log(`${colors.yellow}⚠ ${translatedError}${colors.reset}`);
        errors++;
      }
    });
  }

  // CLOSING SUMMARY
  if (errors === 0) {
    console.log(`${colors.green}${colors.bold}${t.cli.success}${colors.reset}`);
  } else {
    if (!isDetailed) {
      console.log(`${colors.red}${colors.bold}${t.cli.violations_found}${colors.reset}`);
    } else {
      console.log(`${colors.red}${colors.bold}${t.cli.scan_complete}${colors.reset}`);
    }
  }
}

// Check if target is directory or file
const stats = fs.statSync(targetPath);
if (stats.isDirectory()) {
  const files = fs.readdirSync(targetPath, { recursive: true }); 
  files.forEach(file => {
    const fullPath = path.join(targetPath, file);
    if (fs.statSync(fullPath).isFile()) {
      checkFile(fullPath);
    }
  });
} else {
  checkFile(targetPath);
}