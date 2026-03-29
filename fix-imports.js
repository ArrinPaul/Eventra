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
    
    // Uncomment React imports
    content = content.replace(/\/\/\s*import\s+\{([^}]+)\}\s+from\s+['"]react['"];/g, "import {$1} from 'react';");
    content = content.replace(/\/\/\s*import\s+React(,\s*\{([^}]+)\})?\s+from\s+['"]react['"];/g, "import React$1 from 'react';");
    
    // Uncomment lucide-react imports
    content = content.replace(/\/\/\s*import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];/g, "import {$1} from 'lucide-react';");
    
    // Uncomment UI components
    content = content.replace(/\/\/\s*import\s+\{([^}]+)\}\s+from\s+['"]@\/components\/ui\/([^'"]+)['"];/g, "import {$1} from '@/components/ui/$2';");
    
    // Uncomment hooks
    content = content.replace(/\/\/\s*import\s+\{([^}]+)\}\s+from\s+['"]@\/hooks\/([^'"]+)['"];/g, "import {$1} from '@/hooks/$2';");

    // Uncomment next/navigation
    content = content.replace(/\/\/\s*import\s+\{([^}]+)\}\s+from\s+['"]next\/navigation['"];/g, "import {$1} from 'next/navigation';");

    // Uncomment framer-motion
    content = content.replace(/\/\/\s*import\s+\{([^}]+)\}\s+from\s+['"]framer-motion['"];/g, "import {$1} from 'framer-motion';");
    
    // Uncomment date-fns
    content = content.replace(/\/\/\s*import\s+\{([^}]+)\}\s+from\s+['"]date-fns['"];/g, "import {$1} from 'date-fns';");

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Uncommented imports in: ' + filePath);
    }
  }
});
