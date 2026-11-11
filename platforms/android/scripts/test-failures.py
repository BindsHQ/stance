#!/usr/bin/env python3
"""Prints failing test names and messages from Gradle JUnit XML. Usage: scripts/test-failures.py <dir>"""
import glob, re, sys
for f in glob.glob(sys.argv[1] + '/**/TEST-*.xml', recursive=True):
    s = open(f).read()
    for m in re.finditer(r'<testcase name="([^"]+)"[^>]*>\s*<(?:failure|error) message="([^"]{0,500})', s):
        print(m.group(1), '\n   ', m.group(2).replace('&#10;', ' | ')[:500])
