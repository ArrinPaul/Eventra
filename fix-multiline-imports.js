const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    // Fix incomplete multi-line imports for UI components
    content = content.replace(
      /import\s*\{\s*\n\/\/([^}]*?)\n\/\/\s*\}\s*from\s+['"]@\/components\/ui\/([^'"]+)['"]/gs,
      (match, items, component) => {
        const uncommented = items.replace(/^\/\/\s*/gm, '').trim();
        return `import {\n${uncommented}\n} from '@/components/ui/${component}'`;
      }
    );
    
    // Fix incomplete multi-line imports for lucide-react
    content = content.replace(
      /import\s*\{\s*\n\/\/([^}]*?)\n\/\/\s*\}\s*from\s+['"]lucide-react['"]/gs,
      (match, items) => {
        const uncommented = items.replace(/^\/\/\s*/gm, '').trim();
        return `import {\n${uncommented}\n} from 'lucide-react'`;
      }
    );

    // Fix incomplete multi-line imports for hooks
    content = content.replace(
      /import\s*\{\s*\n\/\/([^}]*?)\n\/\/\s*\}\s*from\s+['"]@\/hooks\/([^'"]+)['"]/gs,
      (match, items, hook) => {
        const uncommented = items.replace(/^\/\/\s*/gm, '').trim();
        return `import {\n${uncommented}\n} from '@/hooks/${hook}'`;
      }
    );

    // Fix incomplete multi-line imports for date-fns
    content = content.replace(
      /import\s*\{\s*\n\/\/([^}]*?)\n\/\/\s*\}\s*from\s+['"]date-fns['"]/gs,
      (match, items) => {
        const uncommented = items.replace(/^\/\/\s*/gm, '').trim();
        return `import {\n${uncommented}\n} from 'date-fns'`;
      }
    );

    // Fix incomplete multi-line imports for framer-motion
    content = content.replace(
      /import\s*\{\s*\n\/\/([^}]*?)\n\/\/\s*\}\s*from\s+['"]framer-motion['"]/gs,
      (match, items) => {
        const uncommented = items.replace(/^\/\/\s*/gm, '').trim();
        return `import {\n${uncommented}\n} from 'framer-motion'`;
      }
    );

    // Fix incomplete multi-line imports for next modules
    content = content.replace(
      /import\s*\{\s*\n\/\/([^}]*?)\n\/\/\s*\}\s*from\s+['"]next\/([^'"]+)['"]/gs,
      (match, items, module) => {
        const uncommented = items.replace(/^\/\/\s*/gm, '').trim();
        return `import {\n${uncommented}\n} from 'next/${module}'`;
      }
    );

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Fixed multi-line imports in: ' + filePath);
    }
  }
});

console.log('Completed multi-line import fixes');
