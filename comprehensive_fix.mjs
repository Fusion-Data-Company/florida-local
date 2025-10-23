import fs from 'fs';

// Read the file
let content = fs.readFileSync('server/routes.ts', 'utf8');

// Fix all syntax issues comprehensively
console.log('Starting comprehensive fix...');

// 1. Fix unterminated strings in error messages
content = content.replace(/json\({ message: (.*?)\|\| "([^"]*) }\);/g, 
  'json({ message: $1|| "$2" });');

// 2. Fix missing closing braces
content = content.replace(/json\({ message: (.*?)\)\);/g, 
  'json({ message: $1});');

// 3. Fix double spaces before closing braces
content = content.replace(/json\({ message: "(.*?)"  }\);/g, 
  'json({ message: "$1" });');

// 4. Fix any remaining ApiResponse patterns
content = content.replace(/return res\.status\((\d+)\)\.json\({ message: "Validation error", \n/g, 
  'return res.status($1).json({ message: "Validation error",\n');

// 5. Fix multiline json objects with errors field
content = content.replace(/json\({ message: "(.*?)", \n\s+errors: (.*?)\n}\);/g, 
  'json({ message: "$1",\n        errors: $2\n      });');

// 6. Fix incomplete json objects
content = content.replace(/json\({ message: "(.*?)"\n}\);/g, 
  'json({ message: "$1"\n      });');

// 7. Ensure all error responses are properly formatted
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Check for lines with json({ but missing closing })
  if (line.includes('json({ message:') && !line.includes('});')) {
    if (!lines[i+1] || !lines[i+1].includes('});')) {
      lines[i] = line.replace(/\);?$/, ' });');
    }
  }
}
content = lines.join('\n');

// Write the fixed content
fs.writeFileSync('server/routes.ts', content);

console.log('Comprehensive fix complete');