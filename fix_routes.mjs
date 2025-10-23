import fs from 'fs';

// Read the file
let content = fs.readFileSync('server/routes.ts', 'utf8');

// Fix all broken ApiResponse patterns
const fixPatterns = () => {
  // Remove any remaining ApiResponse calls 
  content = content.replace(/return ApiResponse\.\w+\([^;]*?\);?/g, (match) => {
    if (match.includes('notFound')) {
      return 'return res.status(404).json({ message: "Not found" });';
    } else if (match.includes('forbidden')) {
      return 'return res.status(403).json({ message: "Forbidden" });';
    } else if (match.includes('unauthorized')) {
      return 'return res.status(401).json({ message: "Unauthorized" });';
    } else if (match.includes('validation')) {
      return 'return res.status(400).json({ message: "Validation error" });';
    } else if (match.includes('rateLimited')) {
      return 'return res.status(429).json({ message: "Rate limited" });';
    } else if (match.includes('internal')) {
      return 'return res.status(500).json({ message: "Internal server error" });';
    }
    return match;
  });

  // Fix missing closing braces
  content = content.replace(/res\.status\((\d+)\)\.json\({ message: ([^}]+)}\);/g, 
    'res.status($1).json({ message: $2 });');
  
  // Fix broken json message patterns
  content = content.replace(/\.json\({\s+message: "/g, '.json({ message: "');
  
  // Fix double closing parentheses
  content = content.replace(/\}\);\);/g, '});');
  
  // Remove trailing req parameters from error responses
  content = content.replace(/\}\);, req\);/g, '});');
};

fixPatterns();

// Write the fixed content
fs.writeFileSync('server/routes.ts', content);

console.log('Fixed routes.ts file');