import re
import glob

files = glob.glob('src/**/*.tsx', recursive=True)
for f_path in files:
    with open(f_path, 'r') as f:
        content = f.read()
    
    old_str = "['kilogram', 'kg', 'meter', 'liter', 'litter', 'yard', 'roll']"
    new_str = "['kilogram', 'kg', 'meter', 'liter', 'litter', 'yard', 'roll', 'set', 'gram', 'pcs']"
    
    if old_str in content:
        content = content.replace(old_str, new_str)
        with open(f_path, 'w') as f:
            f.write(content)
        print(f"Updated {f_path}")
