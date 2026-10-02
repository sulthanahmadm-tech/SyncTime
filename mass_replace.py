import os
import re

replacements = {
    r'(?<!dark:)bg-gray-950': 'bg-gray-50 dark:bg-gray-950',
    r'(?<!dark:)bg-gray-900': 'bg-white dark:bg-gray-900',
    r'(?<!dark:)bg-gray-800': 'bg-gray-100 dark:bg-gray-800',
    r'(?<!dark:)bg-gray-700': 'bg-gray-200 dark:bg-gray-700',
    r'(?<!dark:)text-white': 'text-gray-900 dark:text-white',
    r'(?<!dark:)text-gray-400': 'text-gray-500 dark:text-gray-400',
    r'(?<!dark:)text-gray-300': 'text-gray-600 dark:text-gray-300',
    r'(?<!dark:)border-gray-800': 'border-gray-200 dark:border-gray-800',
    r'(?<!dark:)border-gray-700': 'border-gray-300 dark:border-gray-700',
    r'(?<!dark:)border-gray-600': 'border-gray-300 dark:border-gray-600',
    r'(?<!dark:)bg-indigo-600': 'bg-emerald-600 dark:bg-indigo-600',
    r'(?<!dark:)bg-indigo-700': 'bg-emerald-700 dark:bg-indigo-700',
    r'(?<!dark:)text-indigo-400': 'text-emerald-600 dark:text-indigo-400',
    r'(?<!dark:)text-indigo-500': 'text-emerald-600 dark:text-indigo-500',
    r'(?<!dark:)border-indigo-500': 'border-emerald-500 dark:border-indigo-500',
    r'(?<!dark:)ring-indigo-500': 'ring-emerald-500 dark:ring-indigo-500',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, replacement in replacements.items():
        new_content = re.sub(pattern, replacement, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filepath}')

for root, _, files in os.walk('client/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            # Skip new files
            if file in ['SettingsModal.tsx', 'Checkbox.tsx']:
                continue
            process_file(os.path.join(root, file))
