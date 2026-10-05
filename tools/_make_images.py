# -*- coding: utf-8 -*-
"""
Generates the SVG artwork used by the Charity Events website:
  * 14 event card images   (1200 x 675, 16:9)
  * 3 organisation logos   (240 x 240)
  * 2 page hero banners    (1600 x 520)
Self-contained SVGs so the site works with no internet connection.
"""
import os

BASE = r'C:\Users\11757\Desktop\liangyuez\api\assets\images'
os.makedirs(BASE, exist_ok=True)

# ---------------------------------------------------------------------
# Icon paths (simple flat glyphs centred on a 0,0 origin, ~200 units wide)
# ---------------------------------------------------------------------
ICONS = {
    'run': '<circle cx="-52" cy="-58" r="20"/><path d="M-30 -30 L14 -44 L46 -6 L22 16 L56 52 L34 70 L-10 30 L-34 46 L-52 24 L-24 -6 Z"/>',
    'gala': '<path d="M-70 60 L-70 20 L-30 -40 L-30 -60 L30 -60 L30 -40 L70 20 L70 60 Z"/><rect x="-16" y="10" width="32" height="50"/>',
    'auction': '<rect x="-80" y="20" width="160" height="16" rx="6"/><path d="M-10 20 L-40 -50 L-10 -62 L20 8 Z"/><rect x="18" y="-70" width="52" height="18" rx="8" transform="rotate(35 44 -61)"/>',
    'concert': '<path d="M-30 60 L-30 -60 L60 -78 L60 42 L36 46 L36 -50 L-6 -42 L-6 60 Z"/><circle cx="-46" cy="58" r="18"/><circle cx="52" cy="46" r="16"/>',
    'market': '<path d="M-80 -30 L-64 -66 L64 -66 L80 -30 Z"/><rect x="-72" y="-30" width="144" height="96" rx="8"/><rect x="-44" y="6" width="88" height="60" rx="6"/>',
    'heart': '<path d="M0 62 C-70 10 -86 -30 -58 -56 C-34 -78 -6 -62 0 -40 C6 -62 34 -78 58 -56 C86 -30 70 10 0 62 Z"/>',
    'leaf': '<path d="M-60 60 C-70 -10 -20 -70 62 -74 C66 10 22 62 -60 60 Z"/><path d="M-60 60 C-30 20 10 -18 54 -50" stroke-width="10" fill="none" stroke="#ffffff" stroke-linecap="round"/>',
    'plate': '<circle cx="0" cy="0" r="74" fill="none" stroke="#ffffff" stroke-width="14"/><circle cx="0" cy="0" r="34" fill="none" stroke="#ffffff" stroke-width="10"/>',
}

def icon(name, cx, cy, scale, colour, opacity=1.0):
    return (f'<g transform="translate({cx} {cy}) scale({scale})" fill="{colour}" '
            f'opacity="{opacity}">{ICONS.get(name, ICONS["heart"])}</g>')

# ---------------------------------------------------------------------
# Event images: category -> (icon, gradient stop A, gradient stop B)
# ---------------------------------------------------------------------
PALETTES = {
    'run':      ('#0f4c81', '#2f9be0', 'run'),
    'gala':     ('#3d1a5b', '#8e44ad', 'gala'),
    'auction':  ('#0b3d3b', '#17998f', 'auction'),
    'concert':  ('#5a1030', '#d64570', 'concert'),
    'market':   ('#7a3b0a', '#e08a2f', 'market'),
    'care':     ('#124a52', '#3fa9a0', 'heart'),
    'green':    ('#14431f', '#4faa5a', 'leaf'),
    'kitchen':  ('#4a2d0c', '#c98b3a', 'plate'),
}

EVENT_IMAGES = [
    ('event-twilight-run.svg',      'run',     'Twilight Run'),
    ('event-gala-dinner.svg',       'gala',    'Gala Dinner'),
    ('event-silent-auction.svg',    'auction', 'Silent Auction'),
    ('event-coastal-walk.svg',      'green',   'Coastal Walk'),
    ('event-benefit-concert.svg',   'concert', 'Benefit Concert'),
    ('event-community-market.svg',  'market',  'Community Market'),
    ('event-art-auction.svg',       'auction', 'Art Auction'),
    ('event-sustainability-gala.svg','gala',   'Sustainability Gala'),
    ('event-run-for-supper.svg',    'run',     'Run for Your Supper'),
    ('event-family-fun-day.svg',    'care',    'Family Fun Day'),
    ('event-autumn-run.svg',        'run',     'Autumn Run'),
    ('event-beach-cleanup.svg',     'green',   'Beach Clean-Up'),
    ('event-winter-concert.svg',    'concert', 'Winter Concert'),
    ('event-raffle-night.svg',      'market',  'Raffle Night'),
]

W, H = 1200, 675
for filename, palette_key, label in EVENT_IMAGES:
    c1, c2, icon_name = PALETTES[palette_key]
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="{label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="url(#bg)"/>
  <rect width="{W}" height="{H}" fill="url(#glow)"/>
  <g opacity="0.16" fill="#ffffff">
    <circle cx="140" cy="120" r="90"/>
    <circle cx="1060" cy="560" r="140"/>
    <circle cx="980" cy="130" r="48"/>
    <circle cx="220" cy="580" r="64"/>
  </g>
  <g opacity="0.22" stroke="#ffffff" stroke-width="3" fill="none">
    <path d="M0 540 Q 200 460 400 520 T 800 500 T 1200 470"/>
    <path d="M0 600 Q 220 520 440 580 T 880 560 T 1200 530"/>
  </g>
  {icon(icon_name, 600, 300, 1.45, '#ffffff', 0.95)}
  <text x="600" y="520" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="46" fill="#ffffff" opacity="0.92">{label}</text>
  <rect x="0" y="{H-14}" width="{W}" height="14" fill="#ffffff" opacity="0.35"/>
</svg>
'''
    with open(os.path.join(BASE, filename), 'w', encoding='utf-8') as f:
        f.write(svg)

# ---------------------------------------------------------------------
# Organisation logos
# ---------------------------------------------------------------------
LOGOS = [
    ('logo-harbour-lights.svg', '#0f4c81', '#2f9be0', 'HL', 'Harbour Lights'),
    ('logo-green-coast.svg',    '#14431f', '#4faa5a', 'GC', 'Green Coast'),
    ('logo-open-table.svg',     '#7a3b0a', '#e08a2f', 'OT', 'Open Table'),
]
for filename, c1, c2, initials, name in LOGOS:
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" role="img" aria-label="{name} logo">
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="54" fill="url(#lg)"/>
  <g opacity="0.25" fill="#ffffff">
    <circle cx="196" cy="44" r="34"/>
    <circle cx="46" cy="200" r="26"/>
  </g>
  <text x="120" y="150" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="86" font-weight="bold" fill="#ffffff">{initials}</text>
  <text x="120" y="196" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="22" fill="#ffffff" opacity="0.9">{name}</text>
</svg>
'''
    with open(os.path.join(BASE, filename), 'w', encoding='utf-8') as f:
        f.write(svg)

# ---------------------------------------------------------------------
# Page hero banners
# ---------------------------------------------------------------------
HEROES = [
    ('hero-home.svg',   '#0f4c81', '#2f9be0', 'Together we can do more'),
    ('hero-search.svg', '#3d1a5b', '#8e44ad', 'Find your next event'),
]
HW, HH = 1600, 520
for filename, c1, c2, label in HEROES:
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {HW} {HH}" width="{HW}" height="{HH}" role="img" aria-label="{label}">
  <defs>
    <linearGradient id="hg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <rect width="{HW}" height="{HH}" fill="url(#hg)"/>
  <g opacity="0.18" fill="#ffffff">
    <circle cx="180" cy="120" r="110"/>
    <circle cx="1380" cy="420" r="160"/>
    <circle cx="1200" cy="90" r="60"/>
  </g>
  <g opacity="0.20" stroke="#ffffff" stroke-width="4" fill="none">
    <path d="M0 400 Q 300 320 600 390 T 1200 360 T 1600 330"/>
    <path d="M0 470 Q 320 390 640 460 T 1280 430 T 1600 400"/>
  </g>
  <text x="80" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="#ffffff">{label}</text>
  <text x="84" y="312" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#ffffff" opacity="0.85">Charity Events Sydney &middot; PROG2002 Assessment 2</text>
</svg>
'''
    with open(os.path.join(BASE, filename), 'w', encoding='utf-8') as f:
        f.write(svg)

print('images generated:', len(os.listdir(BASE)))
for n in sorted(os.listdir(BASE)):
    print('  ', n)
