#!/usr/bin/env node
const { globby } = require('globby');
const fs = require('fs');

(async () => {
  const files = await globby(['src/**/*.astro']);
  const offenders = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (/\sstyle=\"/.test(text)) {
      offenders.push(file);
    }
  }
  if (offenders.length) {
    console.error('Inline style detected in .astro files (use theme classes instead):');
    offenders.forEach((f) => console.error(' - ' + f));
    process.exit(1);
  }
})();


