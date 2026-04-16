import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

function walk(dir: string, callback: (file: string) => void) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (!f.startsWith('.') && f !== 'node_modules' && f !== '.next') {
        walk(dirPath, callback);
      }
    } else {
      callback(path.join(dir, f));
    }
  });
}

const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F3FB}-\u{1F3FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}\u{2705}\u{274C}\u{26A0}\u{2139}\u{26D4}]/gu;

walk(rootDir, (file) => {
  if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.md') || file.endsWith('.json')) {
    if (file.includes('es.json')) return; // Skip Spanish translations which have accents
    
    let content = fs.readFileSync(file, 'utf8');
    if (emojiRegex.test(content)) {
      console.log(`Cleaning ${file}...`);
      let cleaned = content.replace(emojiRegex, (match) => {
        if (match === '✅') return '[DONE]';
        if (match === '❌') return '[FAIL]';
        if (match === '⚠️') return '[WARN]';
        if (match === '💰') return '[MONEY]';
        if (match === '📋') return '[CLIPBOARD]';
        if (match === '🎉') return '';
        if (match === '🚀') return '';
        if (match === '✨') return '';
        return '';
      });
      fs.writeFileSync(file, cleaned);
    }
  }
});
