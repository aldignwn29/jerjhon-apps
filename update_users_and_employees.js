const fs = require('fs');
const content = fs.readFileSync('src/data/initialData.ts', 'utf-8');

// I will clean up the duplicates by re-writing INITIAL_EMPLOYEES based on INITIAL_USERS list.
