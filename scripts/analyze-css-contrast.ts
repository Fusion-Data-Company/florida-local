import { readFileSync } from 'fs';
import { join } from 'path';

interface ColorPair {
  name: string;
  textColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagLevel: 'AAA' | 'AA' | 'Fail';
  severity: 'critical' | 'moderate' | 'pass';
  location: string;
}

// Parse HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Get luminance for contrast calculation
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate WCAG contrast ratio
function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Parse HSL string
function parseHSL(hsl: string): [number, number, number] | null {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return null;
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

// Analyze CSS variables
function analyzeCSSVariables(cssContent: string, mode: 'light' | 'dark'): ColorPair[] {
  const issues: ColorPair[] = [];
  
  // Extract the relevant CSS variables section
  const darkModeMatch = cssContent.match(/\.dark\s*{([^}]+)}/s);
  const lightModeMatch = cssContent.match(/:root\s*{([^}]+)(?=\.dark|$)/s);
  
  const content = mode === 'dark' ? darkModeMatch?.[1] : lightModeMatch?.[1];
  if (!content) return issues;

  // Define color pair combinations to check
  const pairs: Array<{text: string, bg: string, name: string}> = [
    { text: '--foreground', bg: '--background', name: 'Body Text' },
    { text: '--card-foreground', bg: '--card', name: 'Card Text' },
    { text: '--popover-foreground', bg: '--popover', name: 'Popover Text' },
    { text: '--primary-foreground', bg: '--primary', name: 'Primary Button Text' },
    { text: '--secondary-foreground', bg: '--secondary', name: 'Secondary Button Text' },
    { text: '--accent-foreground', bg: '--accent', name: 'Accent Text' },
    { text: '--destructive-foreground', bg: '--destructive', name: 'Destructive Button Text' },
    { text: '--muted-foreground', bg: '--muted', name: 'Muted Text' },
  ];

  for (const pair of pairs) {
    const textMatch = content.match(new RegExp(`${pair.text}:\\s*hsl\\([^)]+\\)`));
    const bgMatch = content.match(new RegExp(`${pair.bg}:\\s*hsl\\([^)]+\\)`));

    if (!textMatch || !bgMatch) continue;

    const textHSL = parseHSL(textMatch[0].split(':')[1].trim());
    const bgHSL = parseHSL(bgMatch[0].split(':')[1].trim());

    if (!textHSL || !bgHSL) continue;

    const textRGB = hslToRgb(...textHSL);
    const bgRGB = hslToRgb(...bgHSL);

    const ratio = getContrastRatio(textRGB, bgRGB);
    const wcagLevel = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail';
    const severity = ratio < 3 ? 'critical' : ratio < 4.5 ? 'moderate' : 'pass';

    if (severity !== 'pass') {
      issues.push({
        name: pair.name,
        textColor: `hsl(${textHSL.join(', ')})`,
        backgroundColor: `hsl(${bgHSL.join(', ')})`,
        contrastRatio: parseFloat(ratio.toFixed(2)),
        wcagLevel,
        severity,
        location: `${mode} mode CSS variables`
      });
    }
  }

  return issues;
}

// Main analysis
console.log('🔍 Analyzing CSS contrast issues...\n');

const cssPath = join(process.cwd(), 'client/src/index.css');
const cssContent = readFileSync(cssPath, 'utf-8');

console.log('='.repeat(80));
console.log('LIGHT MODE ANALYSIS');
console.log('='.repeat(80));
const lightIssues = analyzeCSSVariables(cssContent, 'light');
if (lightIssues.length === 0) {
  console.log('✅ No contrast issues found in light mode CSS variables');
} else {
  lightIssues.forEach(issue => {
    console.log(`\n${issue.severity === 'critical' ? '🔴' : '🟡'} ${issue.name}`);
    console.log(`   Text: ${issue.textColor}`);
    console.log(`   Background: ${issue.backgroundColor}`);
    console.log(`   Contrast: ${issue.contrastRatio}:1 (${issue.wcagLevel})`);
    console.log(`   Severity: ${issue.severity.toUpperCase()}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('DARK MODE ANALYSIS');
console.log('='.repeat(80));
const darkIssues = analyzeCSSVariables(cssContent, 'dark');
if (darkIssues.length === 0) {
  console.log('✅ No contrast issues found in dark mode CSS variables');
} else {
  darkIssues.forEach(issue => {
    console.log(`\n${issue.severity === 'critical' ? '🔴' : '🟡'} ${issue.name}`);
    console.log(`   Text: ${issue.textColor}`);
    console.log(`   Background: ${issue.backgroundColor}`);
    console.log(`   Contrast: ${issue.contrastRatio}:1 (${issue.wcagLevel})`);
    console.log(`   Severity: ${issue.severity.toUpperCase()}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
const totalIssues = lightIssues.length + darkIssues.length;
const criticalIssues = [...lightIssues, ...darkIssues].filter(i => i.severity === 'critical').length;
const moderateIssues = [...lightIssues, ...darkIssues].filter(i => i.severity === 'moderate').length;

console.log(`Total Issues: ${totalIssues}`);
console.log(`Critical (< 3:1): ${criticalIssues}`);
console.log(`Moderate (3:1 - 4.5:1): ${moderateIssues}`);

// Additional checks for common problem patterns
console.log('\n' + '='.repeat(80));
console.log('CHECKING FOR COMMON READABILITY ISSUES');
console.log('='.repeat(80));

// Check for white-on-white patterns
if (cssContent.includes('white') && cssContent.includes('background') && cssContent.includes('text')) {
  console.log('\n⚠️  Potential white-on-white issues:');
  const whiteMatches = cssContent.match(/color:\s*white|color:\s*#fff|color:\s*rgb\(255,\s*255,\s*255\)/gi);
  if (whiteMatches) {
    console.log(`   Found ${whiteMatches.length} instances of white text`);
  }
}

// Check for glass effects with low opacity
const glassMatches = cssContent.match(/glass.*?rgba\([^)]+,\s*0\.[0-9]+\)/gi);
if (glassMatches) {
  console.log('\n⚠️  Glass effects with low opacity (may cause readability issues):');
  glassMatches.forEach(match => {
    console.log(`   ${match.substring(0, 80)}...`);
  });
}

// Check for abstract overlay opacities
const overlayMatches = cssContent.match(/overlay.*?rgba\([^)]+,\s*0\.[0-9]+\)/gi);
if (overlayMatches) {
  console.log('\n⚠️  Overlay effects (check for text readability):');
  overlayMatches.forEach(match => {
    console.log(`   ${match.substring(0, 80)}...`);
  });
}

console.log('\n✅ CSS analysis complete!\n');

export { lightIssues, darkIssues };
