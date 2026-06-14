const fs = require('fs');
const path = require('path');

const replacements = [
  // Backgrounds
  { regex: /bg-\[#0a0b14\]/g, replacement: 'bg-background' },
  { regex: /bg-\[#0f172a\]/g, replacement: 'bg-card' },
  { regex: /bg-white\/5/g, replacement: 'bg-card' },
  { regex: /bg-white\/10/g, replacement: 'bg-muted' },
  { regex: /bg-gray-900/g, replacement: 'bg-card' },
  { regex: /bg-black/g, replacement: 'bg-background' },
  
  // Text Colors
  { regex: /text-gray-400/g, replacement: 'text-muted-foreground' },
  { regex: /text-gray-500/g, replacement: 'text-muted-foreground' },
  { regex: /text-gray-300/g, replacement: 'text-foreground/80' },
  { regex: /text-white/g, replacement: 'text-foreground' },
  { regex: /text-cyan-400/g, replacement: 'text-primary' },
  { regex: /text-cyan-500/g, replacement: 'text-primary' },
  { regex: /text-cyan-300/g, replacement: 'text-primary-foreground' },
  
  // Borders
  { regex: /border-white\/10/g, replacement: 'border-border' },
  { regex: /border-white\/5/g, replacement: 'border-border/50' },
  { regex: /border-white\/20/g, replacement: 'border-border' },
  { regex: /border-cyan-500\/30/g, replacement: 'border-primary/30' },
  { regex: /border-cyan-500\/50/g, replacement: 'border-primary/50' },
  
  // Hover States
  { regex: /hover:bg-white\/5/g, replacement: 'hover:bg-muted' },
  { regex: /hover:bg-white\/10/g, replacement: 'hover:bg-muted/80' },
  { regex: /hover:text-cyan-400/g, replacement: 'hover:text-primary' },
  { regex: /hover:bg-cyan-500\/10/g, replacement: 'hover:bg-primary/10' },
  { regex: /hover:border-cyan-500\/50/g, replacement: 'hover:border-primary/50' },
  
  // Specific semantic
  { regex: /bg-cyan-500\/10/g, replacement: 'bg-primary/10' },
  { regex: /bg-cyan-500\/20/g, replacement: 'bg-primary/20' },
  { regex: /bg-cyan-600/g, replacement: 'bg-primary' },
  { regex: /hover:bg-cyan-500/g, replacement: 'hover:bg-primary/90' },
  { regex: /text-red-400/g, replacement: 'text-destructive' },
  { regex: /text-red-500/g, replacement: 'text-destructive' },
  { regex: /bg-red-500\/10/g, replacement: 'bg-destructive/10' },
  { regex: /bg-red-500\/20/g, replacement: 'bg-destructive/20' },
  { regex: /text-yellow-400/g, replacement: 'text-warning' },
  { regex: /text-yellow-500/g, replacement: 'text-warning' },
  { regex: /bg-yellow-500\/20/g, replacement: 'bg-warning/20' },
  { regex: /text-green-400/g, replacement: 'text-success' },
  { regex: /text-green-500/g, replacement: 'text-success' },
  { regex: /bg-green-500\/20/g, replacement: 'bg-success/20' },
  { regex: /bg-green-500\/5/g, replacement: 'bg-success/10' },
  { regex: /bg-amber-500\/5/g, replacement: 'bg-warning/10' },
  { regex: /bg-red-500\/5/g, replacement: 'bg-destructive/10' },
  { regex: /bg-cyan-500\/5/g, replacement: 'bg-primary/10' },
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

let modifiedCount = 0;

walkDir('./src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
  }
});

console.log(`Successfully updated ${modifiedCount} files with semantic tokens.`);
