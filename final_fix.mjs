import fs from 'fs';

// Read the file
let content = fs.readFileSync('server/routes.ts', 'utf8');
const lines = content.split('\n');

console.log('Scanning for syntax errors...');
let fixCount = 0;

// Fix patterns line by line
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Fix lines with json({ ... that are missing closing }
  if (line.includes('.json({ ') && !line.includes('});')) {
    // Check if it's a single line json that should have });
    if (line.includes('.json({ ') && line.includes(': ')) {
      // Check for patterns like .json({ success: true);
      if (line.endsWith(');')) {
        lines[i] = line.slice(0, -2) + ' });';
        console.log(`Fixed line ${i+1}: missing closing brace`);
        fixCount++;
      }
      // Check for patterns like .json({ message: "..." });
      else if (!line.endsWith(' });')) {
        lines[i] = line.replace(/\);?$/, ' });');
        console.log(`Fixed line ${i+1}: incorrect closing`);
        fixCount++;
      }
    }
  }
  
  // Fix unterminated strings in error messages
  if (line.includes('json({ message:') && line.includes('||')) {
    // Check for missing closing quote
    const match = line.match(/message: (.*?)\|\| "([^"]*) }\);/);
    if (match) {
      lines[i] = line.replace(/ }\);/, '" });');
      console.log(`Fixed line ${i+1}: unterminated string`);
      fixCount++;
    }
  }
  
  // Fix multiline json objects with wrong indentation
  if (line.trim().startsWith('message:') && !line.includes('json({')) {
    // Ensure proper indentation
    lines[i] = '        ' + line.trim();
    fixCount++;
  }
}

content = lines.join('\n');

// Write the fixed content
fs.writeFileSync('server/routes.ts', content);

console.log(`\nCompleted! Fixed ${fixCount} issues.`);