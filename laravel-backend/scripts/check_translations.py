#!/usr/bin/env python3
"""
Script để kiểm tra các translation keys còn thiếu trong vi.json
So sánh keys được sử dụng trong code React với keys có trong file translation
"""

import json
import re
import os
from pathlib import Path

def load_json_file(filepath):
    """Load JSON file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def flatten_keys(obj, prefix=''):
    """Flatten nested dict to dot-notation keys"""
    keys = []
    for key, value in obj.items():
        new_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            keys.extend(flatten_keys(value, new_key))
        else:
            keys.append(new_key)
    return keys

def extract_keys_from_file(filepath):
    """Extract t('key') patterns from JS/JSX file"""
    keys = set()
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Match t('key'), t("key"), t(`key`)
    patterns = [
        r"t\(['\"]([\w._-]+)['\"]",
        r"t\(`([\w._-]+)`",
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, content)
        keys.update(matches)
    
    return keys

def scan_directory(directory):
    """Scan all JS/JSX files in directory"""
    all_keys = set()
    for ext in ['*.js', '*.jsx']:
        for filepath in Path(directory).rglob(ext):
            keys = extract_keys_from_file(filepath)
            all_keys.update(keys)
    return all_keys

def main():
    base_dir = Path(__file__).parent.parent
    js_dir = base_dir / 'resources' / 'js'
    vi_json = base_dir / 'resources' / 'lang' / 'vi.json'
    en_json = base_dir / 'resources' / 'lang' / 'en.json'
    
    print("=" * 60)
    print("TRANSLATION KEY CHECKER")
    print("=" * 60)
    
    # Load translation files
    print("\n📂 Loading translation files...")
    vi_translations = load_json_file(vi_json)
    en_translations = load_json_file(en_json)
    
    vi_keys = set(flatten_keys(vi_translations))
    en_keys = set(flatten_keys(en_translations))
    
    print(f"   Vietnamese: {len(vi_keys)} keys")
    print(f"   English: {len(en_keys)} keys")
    
    # Scan React files
    print("\n🔍 Scanning React files...")
    used_keys = scan_directory(js_dir)
    
    # Filter out non-translation keys (like CSS selectors, URLs, etc.)
    translation_keys = {k for k in used_keys if '.' in k and not k.startswith('.')}
    print(f"   Found {len(translation_keys)} translation keys in use")
    
    # Find missing keys
    print("\n" + "=" * 60)
    print("MISSING KEYS IN vi.json")
    print("=" * 60)
    
    missing_vi = sorted(translation_keys - vi_keys)
    if missing_vi:
        for key in missing_vi:
            print(f"   ❌ {key}")
        print(f"\n   Total: {len(missing_vi)} missing keys")
    else:
        print("   ✅ All keys are translated!")
    
    print("\n" + "=" * 60)
    print("MISSING KEYS IN en.json")
    print("=" * 60)
    
    missing_en = sorted(translation_keys - en_keys)
    if missing_en:
        for key in missing_en:
            print(f"   ❌ {key}")
        print(f"\n   Total: {len(missing_en)} missing keys")
    else:
        print("   ✅ All keys are translated!")
    
    # Keys in vi but not en (sync check)
    print("\n" + "=" * 60)
    print("KEYS IN vi.json BUT NOT IN en.json")
    print("=" * 60)
    only_in_vi = sorted(vi_keys - en_keys)
    if only_in_vi:
        for key in only_in_vi[:20]:  # Show first 20
            print(f"   ⚠️  {key}")
        if len(only_in_vi) > 20:
            print(f"   ... and {len(only_in_vi) - 20} more")
    else:
        print("   ✅ Files are in sync!")
    
    # Output missing keys as JSON for easy copy-paste
    if missing_vi:
        print("\n" + "=" * 60)
        print("COPY-PASTE JSON FOR vi.json")
        print("=" * 60)
        print("\nAdd these keys to your translation file:")
        print("{")
        for key in missing_vi[:30]:  # Show first 30
            parts = key.rsplit('.', 1)
            if len(parts) == 2:
                value = parts[-1].replace('_', ' ').title()
            else:
                value = key.replace('_', ' ').title()
            print(f'    "{key}": "{value}",')
        print("}")
    
    return len(missing_vi), len(missing_en)

if __name__ == '__main__':
    main()
