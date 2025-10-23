import fs from 'fs';

// Read the file
let content = fs.readFileSync('server/routes.ts', 'utf8');

console.log('Running absolute final fix for ALL syntax errors...');

// Fix ALL patterns with missing closing braces in objects
// Pattern 1: storage.methodName(..., { key: value);
content = content.replace(/storage\.(\w+)\([^)]*{([^}]*)\);/g, (match, method, objectContent) => {
  console.log(`Fixing storage.${method} call`);
  return match.replace(/\);$/, ' });');
});

// Pattern 2: res.json({ key: value);
content = content.replace(/res\.json\({ ([^}]*)\);/g, (match, jsonContent) => {
  console.log('Fixing res.json call');
  return `res.json({ ${jsonContent} });`;
});

// Pattern 3: res.send({ key: value);
content = content.replace(/res\.send\({ ([^}]*)\);/g, (match, sendContent) => {
  console.log('Fixing res.send call');
  return `res.send({ ${sendContent} });`;
});

// Pattern 4: Any other method calls with object literals missing closing brace
content = content.replace(/(\w+)\({ ([^}]*)\);/g, (match, func, objContent) => {
  // Check if it's a function call with an object literal
  if (func === 'json' || func === 'send' || func.includes('update') || func.includes('create')) {
    console.log(`Fixing ${func} call`);
    return `${func}({ ${objContent} });`;
  }
  return match;
});

// Pattern 5: Fix specific line patterns
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Count braces
  const openBraces = (line.match(/{/g) || []).length;
  const closeBraces = (line.match(/}/g) || []).length;
  
  // If there are more open than close and line ends with );
  if (openBraces > closeBraces && line.endsWith(');')) {
    // Check if it's a function call with an object
    if (line.includes('({ ') || line.includes('({')) {
      lines[i] = line.slice(0, -2) + ' });';
      console.log(`Fixed line ${i+1}: ${line.trim().substring(0, 50)}...`);
    }
  }
}

content = lines.join('\n');

// Write the fixed content
fs.writeFileSync('server/routes.ts', content);

console.log('\nAbsolute final fix complete!');