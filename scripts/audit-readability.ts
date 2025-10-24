import { chromium, Browser, Page } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface ContrastIssue {
  page: string;
  mode: 'light' | 'dark';
  viewport: 'desktop' | 'mobile';
  element: string;
  text: string;
  textColor: string;
  backgroundColor: string;
  contrastRatio: number;
  severity: 'critical' | 'moderate' | 'minor';
  wcagLevel: 'AAA' | 'AA' | 'Fail';
}

interface AuditResult {
  issues: ContrastIssue[];
  screenshots: { [key: string]: string };
  summary: {
    totalPages: number;
    totalIssues: number;
    criticalIssues: number;
    moderateIssues: number;
    minorIssues: number;
  };
}

// All routes from App.tsx
const routes = [
  // Public routes
  '/',
  '/login-error',
  '/florida-elite',
  '/registry',
  '/subscription',
  '/demo/card',
  '/demo/revolution-hero',
  '/businesses',
  '/marketplace',
  '/blog',
  '/contact',
  '/cart',
  // Authenticated routes (will test after login)
  '/profile',
  '/create-business',
  '/messages',
  '/checkout',
  '/order-confirmation',
  '/orders',
  '/vendor/products',
  '/vendor/payouts',
  '/ai/content-generator',
  '/ai/agents',
  '/ai/tools',
  '/integrations/gmb',
  '/spotlight/voting',
  '/community',
  '/loyalty',
  '/admin',
  '/admin/analytics',
  '/admin/monitoring',
  '/business-dashboard',
  '/business-analytics',
  '/marketing-hub',
  '/social-media-hub',
  '/entrepreneur-profile',
];

// WCAG 2.1 contrast calculation
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1: string, rgb2: string): number {
  const parseRgb = (rgb: string): [number, number, number] => {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return [0, 0, 0];
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  };

  const [r1, g1, b1] = parseRgb(rgb1);
  const [r2, g2, b2] = parseRgb(rgb2);

  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function getWCAGLevel(ratio: number, fontSize: number): 'AAA' | 'AA' | 'Fail' {
  const isLargeText = fontSize >= 18 || fontSize >= 14; // 14pt bold or 18pt regular
  
  if (isLargeText) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA';
  } else {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
  }
  return 'Fail';
}

function getSeverity(ratio: number): 'critical' | 'moderate' | 'minor' {
  if (ratio < 3) return 'critical';
  if (ratio < 4.5) return 'moderate';
  return 'minor';
}

async function analyzePage(page: Page, url: string, mode: 'light' | 'dark', viewport: 'desktop' | 'mobile'): Promise<ContrastIssue[]> {
  const issues: ContrastIssue[] = [];

  try {
    // Extract all text elements with their styles
    const elements = await page.evaluate(() => {
      const textElements: Array<{
        text: string;
        selector: string;
        textColor: string;
        backgroundColor: string;
        fontSize: number;
      }> = [];

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      const processedElements = new Set<Element>();

      while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent?.trim();
        if (!text || text.length < 2) continue;

        const element = node.parentElement;
        if (!element || processedElements.has(element)) continue;
        processedElements.add(element);

        const computed = window.getComputedStyle(element);
        const textColor = computed.color;
        const bgColor = computed.backgroundColor;
        const fontSize = parseFloat(computed.fontSize);

        // Skip if element is hidden
        if (computed.display === 'none' || computed.visibility === 'hidden') continue;

        // Get effective background color (may need to traverse up)
        let effectiveBg = bgColor;
        let parent = element.parentElement;
        while ((!effectiveBg || effectiveBg === 'rgba(0, 0, 0, 0)' || effectiveBg === 'transparent') && parent) {
          const parentBg = window.getComputedStyle(parent).backgroundColor;
          if (parentBg && parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
            effectiveBg = parentBg;
            break;
          }
          parent = parent.parentElement;
        }

        // If still no background, assume white for light mode, black for dark mode
        if (!effectiveBg || effectiveBg === 'rgba(0, 0, 0, 0)' || effectiveBg === 'transparent') {
          effectiveBg = 'rgb(255, 255, 255)'; // Will be overridden by mode
        }

        textElements.push({
          text: text.substring(0, 50),
          selector: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
          textColor,
          backgroundColor: effectiveBg,
          fontSize
        });
      }

      return textElements;
    });

    // Analyze each element for contrast
    for (const el of elements) {
      try {
        const ratio = getContrastRatio(el.textColor, el.backgroundColor);
        const wcagLevel = getWCAGLevel(ratio, el.fontSize);
        
        // Only report failures and AA issues
        if (wcagLevel === 'Fail' || ratio < 4.5) {
          issues.push({
            page: url,
            mode,
            viewport,
            element: el.selector,
            text: el.text,
            textColor: el.textColor,
            backgroundColor: el.backgroundColor,
            contrastRatio: parseFloat(ratio.toFixed(2)),
            severity: getSeverity(ratio),
            wcagLevel
          });
        }
      } catch (err) {
        // Skip elements we can't process
      }
    }
  } catch (err) {
    console.error(`Error analyzing ${url} in ${mode} mode (${viewport}):`, err);
  }

  return issues;
}

async function runAudit(): Promise<AuditResult> {
  console.log('🔍 Starting comprehensive readability audit...\n');

  const browser = await chromium.launch({ headless: true });
  const result: AuditResult = {
    issues: [],
    screenshots: {},
    summary: {
      totalPages: 0,
      totalIssues: 0,
      criticalIssues: 0,
      moderateIssues: 0,
      minorIssues: 0
    }
  };

  // Create screenshots directory
  const screenshotDir = join(process.cwd(), 'audit-screenshots');
  if (!existsSync(screenshotDir)) {
    mkdirSync(screenshotDir, { recursive: true });
  }

  const baseUrl = 'http://localhost:5000';
  const modes: Array<'light' | 'dark'> = ['light', 'dark'];
  const viewports: Array<{ name: 'desktop' | 'mobile', width: number, height: number }> = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  for (const route of routes) {
    console.log(`\n📄 Auditing: ${route}`);
    result.summary.totalPages++;

    for (const mode of modes) {
      for (const viewport of viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          colorScheme: mode
        });

        const page = await context.newPage();

        try {
          // Navigate to page
          await page.goto(`${baseUrl}${route}`, { 
            waitUntil: 'networkidle',
            timeout: 10000 
          });

          // Wait for page to fully render
          await page.waitForTimeout(2000);

          // Add dark mode class if needed
          if (mode === 'dark') {
            await page.evaluate(() => {
              document.documentElement.classList.add('dark');
            });
            await page.waitForTimeout(500);
          }

          // Take screenshot
          const screenshotName = `${route.replace(/\//g, '_') || 'home'}_${mode}_${viewport.name}.png`;
          const screenshotPath = join(screenshotDir, screenshotName);
          await page.screenshot({ path: screenshotPath, fullPage: false });
          result.screenshots[`${route}_${mode}_${viewport.name}`] = screenshotPath;

          console.log(`  ✓ ${mode} mode (${viewport.name})`);

          // Analyze contrast
          const pageIssues = await analyzePage(page, route, mode, viewport.name);
          result.issues.push(...pageIssues);

          if (pageIssues.length > 0) {
            console.log(`    ⚠️  Found ${pageIssues.length} contrast issues`);
          }
        } catch (err) {
          console.error(`  ✗ Failed to audit ${route} (${mode} ${viewport.name}):`, err);
        } finally {
          await context.close();
        }
      }
    }
  }

  await browser.close();

  // Calculate summary
  result.summary.totalIssues = result.issues.length;
  result.summary.criticalIssues = result.issues.filter(i => i.severity === 'critical').length;
  result.summary.moderateIssues = result.issues.filter(i => i.severity === 'moderate').length;
  result.summary.minorIssues = result.issues.filter(i => i.severity === 'minor').length;

  console.log('\n✅ Audit complete!');
  console.log(`📊 Summary:`);
  console.log(`   Total Pages: ${result.summary.totalPages}`);
  console.log(`   Total Issues: ${result.summary.totalIssues}`);
  console.log(`   Critical (< 3:1): ${result.summary.criticalIssues}`);
  console.log(`   Moderate (3:1 - 4.5:1): ${result.summary.moderateIssues}`);
  console.log(`   Minor (4.5:1 - 7:1): ${result.summary.minorIssues}`);

  // Save results
  const resultsPath = join(process.cwd(), 'audit-results.json');
  writeFileSync(resultsPath, JSON.stringify(result, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);

  return result;
}

// Run audit
runAudit().catch(console.error);
