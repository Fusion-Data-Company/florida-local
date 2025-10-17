#!/usr/bin/env python3
import re

# Read the file
with open('server/routes.ts', 'r') as f:
    content = f.read()

# Fix all broken ApiResponse patterns
patterns_to_fix = [
    # Fix broken ApiResponse.validation with multiline
    (r'return ApiResponse\.validation\(res, "\s*\n\s*message: "([^"]+)"\s*\n\s*\}\);', 
     r'return res.status(400).json({\n        message: "\1"\n      });'),
    
    # Fix broken ApiResponse.validation with error field
    (r'return ApiResponse\.validation\(res, "\s*\n\s*message: "([^"]+)",?\s*\n\s*error: ([^\n]+)\s*\n\s*\}\);',
     r'return res.status(400).json({\n        message: "\1",\n        error: \2\n      });'),
     
    # Fix broken ApiResponse.internal
    (r'return ApiResponse\.internal\(res, "\s*\n\s*message: "([^"]+)"\s*\n\s*\}\);',
     r'return res.status(500).json({\n        message: "\1"\n      });'),
    
    # Fix broken ApiResponse.rateLimited
    (r'return ApiResponse\.rateLimited\(res, "\s*\n\s*message: "([^"]+)"\s*\n\s*\}\);',
     r'return res.status(429).json({\n        message: "\1"\n      });'),
     
    # Fix remaining ApiResponse calls
    (r'return ApiResponse\.notFound\(res, "([^"]+)"\);',
     r'return res.status(404).json({ message: "\1 not found" });'),
    (r'return ApiResponse\.forbidden\(res, "([^"]+)"\);',
     r'return res.status(403).json({ message: "\1" });'),
    (r'return ApiResponse\.unauthorized\(res, "([^"]+)"\);',
     r'return res.status(401).json({ message: "\1" });'),
    
    # Fix weird spacing in json objects
    (r'\.json\({(\s+)message:',
     r'.json({\n        message:'),
    
    # Fix broken closing braces
    (r'\}\);(\s*\})',
     r'});\1'),
]

# Apply all patterns
for pattern, replacement in patterns_to_fix:
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

# Write the fixed content
with open('server/routes.ts', 'w') as f:
    f.write(content)

print("Fixed routes.ts file")