const fs = require('fs');
const content = fs.readFileSync('src/components/auth/LoginView.tsx', 'utf-8');

// 1. Remove loginWithGoogle from useERP import/destructuring
let newContent = content.replace(/loginWithGoogle,\s*/, '');

// 2. Remove handleGoogleLogin function
const handleRegex = /const handleGoogleLogin = async \(\) => \{[\s\S]*?\};\n/;
newContent = newContent.replace(handleRegex, '');

// 3. Remove the 'Atau' divider and the Google button
const buttonRegex = /<div className="flex items-center gap-3">[\s\S]*?<\/svg>\s*Masuk dengan Google\s*<\/>\s*\)}\s*<\/button>/;
newContent = newContent.replace(buttonRegex, '');

fs.writeFileSync('src/components/auth/LoginView.tsx', newContent);
console.log("Patched LoginView");
