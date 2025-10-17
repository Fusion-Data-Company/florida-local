const fs = require('fs');

// Read the broken file
let content = fs.readFileSync('server/routes.ts', 'utf8');

// Fix double quotes in Error constructors
content = content.replace(/new Error\("([^"]+)""\)/g, 'new Error("$1")');

// Fix incomplete ApiResponse calls with broken strings
// These patterns are from the broken find/replace
content = content.replace(/return ApiResponse\.validation\(res, "\s*\n/g, 'return res.status(400).json({ message: ');
content = content.replace(/return ApiResponse\.internal\(res, new Error\("([^"]+)"\);$/gm, 'return res.status(500).json({ message: "$1" });');
content = content.replace(/return ApiResponse\.notFound\(res, "([^"]+)"\);$/gm, 'return res.status(404).json({ message: "$1 not found" });');
content = content.replace(/return ApiResponse\.forbidden\(res, "([^"]+)"\);$/gm, 'return res.status(403).json({ message: "$1" });');
content = content.replace(/return ApiResponse\.unauthorized\(res, "([^"]+)"\);$/gm, 'return res.status(401).json({ message: "$1" });');
content = content.replace(/return ApiResponse\.rateLimited\(res, "\s*\n/g, 'return res.status(429).json({ message: ');

// Fix incomplete parentheses
content = content.replace(/return ApiResponse\.(.*?)\(res,\s*([^)]+)$/gm, function(match, method, params) {
  if (!params.endsWith(');')) {
    return match + ');';
  }
  return match;
});

// Remove the import that's breaking things temporarily
content = content.replace(/import { ApiResponse, asyncHandler, standardErrorMiddleware } from "\.\/errorHandler";/, '// import { ApiResponse, asyncHandler, standardErrorMiddleware } from "./errorHandler";');

// Write the fixed content
fs.writeFileSync('server/routes.ts', content);

console.log('Fixed routes.ts file');