"""Compare the app's icon files with the Claude Design export at equal sizes.

Usage: python3 -I scripts/compare-icons.py <export app-icon/png dir>
Prints the mean absolute channel difference (0..255) and the share of pixels that differ by more than 8.
Files drawn at a different size are resampled to the export's size before the compare.
"""
import sys
from pathlib import Path
from PIL import Image, ImageChops

PAIRS = [
    ('assets/icon.png', 'ios-default-1024.png', 'RGB'),
    ('assets/icons/ios-light.png', 'ios-default-1024.png', 'RGB'),
    ('assets/icons/ios-dark.png', 'ios-dark-1024.png', 'RGB'),
    ('assets/icons/ios-tinted.png', 'ios-tinted-1024.png', 'RGB'),
    ('assets/android-icon-foreground.png', 'android-foreground-432.png', 'RGBA'),
    ('assets/android-icon-monochrome.png', 'android-monochrome-432.png', 'RGBA'),
    ('assets/favicon.png', 'favicon-32.png', 'RGBA'),
]

export = Path(sys.argv[1])
root = Path(__file__).resolve().parent.parent
for app, ref, mode in PAIRS:
    b = Image.open(export / ref).convert(mode)
    a = Image.open(root / app).convert(mode).resize(b.size, Image.LANCZOS)
    d = ImageChops.difference(a, b)
    k = len(d.getbands())
    raw = d.tobytes()
    mean = sum(raw) / len(raw)
    far = sum(1 for i in range(0, len(raw), k) if max(raw[i:i + k]) > 8) / (len(raw) // k)
    print(f'{app:42} vs {ref:28} mean {mean:6.2f}  differing {far:6.1%}')
