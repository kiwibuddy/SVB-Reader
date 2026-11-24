"""
Prints the public-domain artworks for Film 3 (Out Loud): each etching on warm
paper, with loose hand-cut spot colours in the app's four inks behind its
readers, slightly misregistered, with grain. Writes public/source/art/*.jpg and
credits.json (shown on screen as museum labels).

  python scripts/etch.py fetch CACHE_DIR    # download originals (open access)
  python scripts/etch.py print CACHE_DIR    # make the prints

Sources: Art Institute of Chicago open access (IIIF, public-domain works, CC0)
and Wikimedia Commons (PD-Art). Shapes are in 0..1 of the cropped image.
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'public', 'source', 'art')
PAPER = np.array([242, 234, 220], np.float32)
INK = np.array([28, 26, 30], np.float32)
INKS = {'black': (112, 128, 156), 'red': (255, 98, 78), 'green': (70, 205, 150), 'blue': (98, 160, 255)}
UA = 'Mozilla/5.0 (compatible; ad-research-script/1.0)'

# key: source file, url, crop (x0, y0, x1, y1 in 0..1), output width, shapes, credit
WORKS = {
    'synagogue': dict(
        file='aic-13103.jpg',
        url='https://www.artic.edu/iiif/2/96babfca-826c-bcc1-e051-5012168657c2/full/1200,/0/default.jpg',
        crop=(0.035, 0.04, 0.965, 0.955), width=1200,
        shapes=[(0.17, 0.50, 0.11, 0.42, 'green', 1), (0.33, 0.50, 0.11, 0.43, 'blue', 2),
                (0.53, 0.55, 0.08, 0.22, 'red', 3), (0.84, 0.55, 0.12, 0.40, 'black', 4)],
        credit=dict(artist='Rembrandt van Rijn', title='Jews in the Synagogue', date='1648', place='Art Institute of Chicago')),
    'synagogue-tall': dict(
        file='aic-13103.jpg', url=None, crop=(0.03, 0.04, 0.55, 0.955), width=1200,
        shapes=[(0.27, 0.50, 0.19, 0.44, 'green', 1), (0.57, 0.50, 0.20, 0.45, 'blue', 2)],
        credit=dict(artist='Rembrandt van Rijn', title='Jews in the Synagogue', date='1648', place='Art Institute of Chicago')),
    'ezra': dict(
        file='dore-ezra.jpg',
        url='https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/109.Ezra_Reads_the_Law_to_the_People.jpg/1280px-109.Ezra_Reads_the_Law_to_the_People.jpg',
        crop=(0.0, 0.05, 1.0, 0.92), width=1200,
        shapes=[(0.45, 0.425, 0.14, 0.31, 'black', 9), (0.15, 0.816, 0.12, 0.276, 'green', 10),
                (0.70, 0.379, 0.08, 0.195, 'blue', 11), (0.77, 0.93, 0.15, 0.16, 'red', 12)],
        credit=dict(artist='Gustave Doré', title='Ezra Reads the Law to the People', date='1866', place='Wikimedia Commons')),
    'paul': dict(
        file='aic-106578.jpg',
        url='https://www.artic.edu/iiif/2/1ebe5af2-52d7-c9ce-7cd5-5385946efec9/full/843,/0/default.jpg',
        crop=(0.0, 0.0, 1.0, 1.0), width=1000,
        shapes=[(0.33, 0.48, 0.09, 0.32, 'blue', 5), (0.49, 0.66, 0.09, 0.16, 'green', 6),
                (0.64, 0.66, 0.06, 0.20, 'red', 7), (0.82, 0.80, 0.09, 0.18, 'black', 8)],
        credit=dict(artist='Marcantonio Raimondi, after Raphael', title='Saint Paul Preaching at Athens', date='c. 1517–20', place='Art Institute of Chicago')),
    'refectory': dict(
        file='aic-116597.jpg',
        url='https://www.artic.edu/iiif/2/08c33e2c-13fd-49a2-9393-66734e2391c6/full/1686,/0/default.jpg',
        crop=(0.2207, 0.1268, 0.8001, 0.7382), width=1200,
        shapes=[(0.08, 0.39, 0.087, 0.178, 'black', 3), (0.425, 0.40, 0.087, 0.17, 'red', 4),
                (0.648, 0.385, 0.082, 0.163, 'green', 5), (0.813, 0.564, 0.097, 0.311, 'blue', 6)],
        credit=dict(artist='Alphonse Legros', title='The Refectory', date='1862', place='Art Institute of Chicago')),
}


def fetch(cache):
    os.makedirs(cache, exist_ok=True)
    for key, w in WORKS.items():
        path = os.path.join(cache, w['file'])
        if w['url'] and not os.path.exists(path):
            subprocess.run(['curl', '-s', '-L', '--max-time', '120', '-A', UA, '-o', path, w['url']], check=True)
            print('fetched', key)


def etched(img):
    g = np.asarray(img.convert('L')).astype(np.float32)
    lo, hi = np.percentile(g, 2), np.percentile(g, 92)
    g = np.clip((g - lo) / (hi - lo), 0, 1) ** 1.15
    return PAPER * g[..., None] + INK * (1 - g[..., None])


def blob(size, cx, cy, rx, ry, seed):
    r = np.random.default_rng(seed)
    t = np.linspace(0, 2 * np.pi, 48, endpoint=False)
    wob = 1 + 0.10 * np.sin(3 * t + r.uniform(0, 6)) + 0.06 * np.sin(5 * t + r.uniform(0, 6))
    pts = [(cx + rx * wob[i] * np.cos(t[i]), cy + ry * wob[i] * np.sin(t[i])) for i in range(len(t))]
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return m.filter(ImageFilter.GaussianBlur(1.4))


def make(key, w, cache):
    rng = np.random.default_rng(11)
    src = Image.open(os.path.join(cache, w['file'])).convert('RGB')
    W, H = src.size
    x0, y0, x1, y1 = w['crop']
    im = src.crop((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)))
    k = w['width'] / im.width
    im = im.resize((w['width'], int(im.height * k)), Image.LANCZOS)
    if k > 1.05:
        im = im.filter(ImageFilter.UnsharpMask(1.6, 70, 2))
    a = etched(im)
    h, wd, _ = a.shape
    off = (0.006 * wd, -0.004 * wd)  # misregistration
    for (cx, cy, rx, ry, ink, seed) in w['shapes']:
        m = np.asarray(blob((wd, h), cx * wd + off[0], cy * h + off[1], rx * wd, ry * h, seed)).astype(np.float32) / 255
        al = np.clip(m * (0.72 + rng.normal(0, 0.09, (h, wd)).astype(np.float32)), 0, 1)[..., None]
        a = a * (1 - al + al * (np.array(INKS[ink], np.float32) / 255))
    a = np.clip(a + rng.normal(0, 5.0, (h, wd, 1)).astype(np.float32), 0, 255)
    Image.fromarray(a.astype(np.uint8)).save(os.path.join(OUT, f'{key}.jpg'), quality=90)
    return {'file': f'source/art/{key}.jpg', 'width': wd, 'height': h, **w['credit']}


def print_all(cache):
    os.makedirs(OUT, exist_ok=True)
    credits = {}
    for key, w in WORKS.items():
        try:
            Image.open(os.path.join(cache, w['file'])).verify()
        except Exception:
            print('missing or not an image:', key, '- run fetch first')
            continue
        credits[key] = make(key, w, cache)
        print('printed', key, credits[key]['width'], 'x', credits[key]['height'])
    with open(os.path.join(OUT, 'credits.json'), 'w') as f:
        json.dump(credits, f, indent=2, ensure_ascii=False)


if __name__ == '__main__':
    {'fetch': fetch, 'print': print_all}[sys.argv[1]](sys.argv[2])
