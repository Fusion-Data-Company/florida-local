import fs from 'fs';

// Read the file
let content = fs.readFileSync('server/routes.ts', 'utf8');

console.log('Starting ultimate fix for all syntax errors...');

// 1. Fix all json({ ... ); patterns that should be json({ ... });
content = content.replace(/\.json\(({[^}]*})\);/g, (match, jsonContent) => {
  // Check if the closing brace is missing
  if (!jsonContent.endsWith('}')) {
    return `.json(${jsonContent} });`;
  }
  return `.json(${jsonContent});`;
});

// 2. Fix all status().json patterns with missing closing braces
content = content.replace(/\.status\((\d+)\)\.json\(([^;]+)\);/g, (match, status, jsonContent) => {
  // Ensure proper closing
  if (!jsonContent.endsWith('}')) {
    return `.status(${status}).json(${jsonContent}});`;
  }
  return match;
});

// 3. Fix lines that have res.json or res.status on multiline
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const nextLine = lines[i+1];
  
  // Fix multiline json responses
  if (line.includes('.json({ message: "') && nextLine && nextLine.includes('});')) {
    // Already correct
    continue;
  }
  
  // Fix lines ending with ); that should be });
  if (line.includes('.json({') && line.endsWith(');') && !line.endsWith(' });')) {
    lines[i] = line.slice(0, -2) + ' });';
    console.log(`Fixed line ${i+1}`);
  }
  
  // Fix lines with res.send or res.json that have syntax issues
  if (line.includes('res.send(') || line.includes('res.json(')) {
    // Check for missing closing braces
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    if (openBraces > closeBraces && line.endsWith(');')) {
      lines[i] = line.slice(0, -2) + ' });';
      console.log(`Fixed unbalanced braces on line ${i+1}`);
    }
  }
}

content = lines.join('\n');

// Write the fixed content
fs.writeFileSync('server/routes.ts', content);

console.log('Ultimate fix complete!');