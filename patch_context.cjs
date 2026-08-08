const fs = require('fs');
const content = fs.readFileSync('src/context/ERPContext.tsx', 'utf-8');

// 1. Remove loginWithGoogle from ERPContextType
const regex1 = /loginWithGoogle:\s*\(\)\s*=>\s*Promise<\{\s*success:\s*boolean;\s*message:\s*string\s*\}>;\n/;
let newContent = content.replace(regex1, '');

// 2. Change useState for currentUser
const regex2 = /const \[currentUser, setCurrentUser\] = useState<User \| null>\(null\);/;
const replace2 = `const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('jerhon_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });`;
newContent = newContent.replace(regex2, replace2);

// 3. Remove onAuthStateChanged useEffect
const startIdx = newContent.indexOf('useEffect(() => {\n    return onAuthStateChanged(auth');
const endIdx = newContent.indexOf('// Login handler');
if (startIdx !== -1 && endIdx !== -1) {
    newContent = newContent.slice(0, startIdx) + newContent.slice(endIdx);
} else {
    console.log("Could not find onAuthStateChanged useEffect");
}

// 4. Remove loginWithGoogle implementation
const loginStart = newContent.indexOf('const loginWithGoogle = async () => {');
const loginEnd = newContent.indexOf('const loginWithCredentials = async (usernameOrEmail: string, password: string) => {');
if (loginStart !== -1 && loginEnd !== -1) {
    newContent = newContent.slice(0, loginStart) + newContent.slice(loginEnd);
} else {
    console.log("Could not find loginWithGoogle implementation");
}

// 5. Remove loginWithGoogle from value={{ ... }}
newContent = newContent.replace(/loginWithGoogle,\n?\s*/g, '');

// 6. Remove signOut(auth) from logout
newContent = newContent.replace(/await signOut\(auth\);\n\s*/g, '');

fs.writeFileSync('src/context/ERPContext.tsx', newContent);
console.log("Patched ERPContext");
