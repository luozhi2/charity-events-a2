# -*- coding: utf-8 -*-
"""
Generates the three diagrams used in the report as SVG files, then converts
them into native, editable Word DrawingML shapes (not pictures).

The report therefore contains real vector diagrams that can be clicked and
edited in Word, rather than ASCII art or flat images.

  python tools/make_diagrams.py

Outputs:
  tools/diagrams/figure1-architecture.svg
  tools/diagrams/figure2-wireframes.svg
  tools/diagrams/figure3-entity-relationship.svg
"""
import os
import re

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'diagrams')
os.makedirs(OUT, exist_ok=True)

# Colours (kept in step with the website palette)
NAVY = '#0F3C66'
NAVY_D = '#0A2A48'
BLUE_L = '#EAF1F7'
BLUE_B = '#9DBBD6'
TEAL = '#17998F'
TEAL_L = '#E3F4F1'
AMBER = '#E08A2F'
AMBER_L = '#FDF1E0'
PURPLE = '#6B3FA0'
PURPLE_L = '#F1EAF8'
GREY = '#5A6B78'
GREY_L = '#F2F5F8'
GREY_B = '#C4D0DA'
INK = '#16232E'
WHITE = '#FFFFFF'


def esc(t):
    return (str(t).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def rect(x, y, w, h, fill=WHITE, stroke=GREY_B, sw=1.5, rx=0):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')


def line(x1, y1, x2, y2, stroke=GREY, sw=2, dash=None, arrow=False, arrow_start=False):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    a = ' marker-end="url(#arrow)"' if arrow else ''
    b = ' marker-start="url(#arrowStart)"' if arrow_start else ''
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" '
            f'stroke-width="{sw}"{d}{a}{b}/>')


def text(x, y, s, size=15, fill=INK, bold=False, anchor='start', italic=False,
         family='Arial, Helvetica, sans-serif'):
    w = ' font-weight="bold"' if bold else ''
    i = ' font-style="italic"' if italic else ''
    return (f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
            f'fill="{fill}" text-anchor="{anchor}"{w}{i}>{esc(s)}</text>')


def svg(width, height, body, title):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" role="img" aria-label="{esc(title)}">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="{GREY}"/>
    </marker>
    <marker id="arrowStart" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 10 0 L 0 5 L 10 10 z" fill="{GREY}"/>
    </marker>
    <marker id="arrowAmber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="{AMBER}"/>
    </marker>
  </defs>
  <rect width="{width}" height="{height}" fill="{WHITE}"/>
{body}
</svg>
'''


def write(name, content):
    path = os.path.join(OUT, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('  wrote', name, f'({len(content)} bytes)')
    return path


# =====================================================================
#  FIGURE 1 - Three-tier architecture and the request/response cycle
# =====================================================================
def figure1():
    W, H = 940, 620
    b = []
    b.append(text(W / 2, 30, 'Three-tier architecture of Charity Events Sydney',
                  size=19, fill=NAVY_D, bold=True, anchor='middle'))

    # ---- Tier 1: client ----
    b.append(rect(40, 55, 580, 150, fill=BLUE_L, stroke=BLUE_B, rx=10))
    b.append(text(60, 82, '1. CLIENT TIER  —  the browser', size=13, fill=NAVY, bold=True))
    b.append(rect(62, 96, 168, 92, fill=WHITE, rx=6))
    b.append(text(146, 120, 'index.html', size=14, bold=True, anchor='middle'))
    b.append(text(146, 141, 'home.js', size=12, fill=GREY, anchor='middle'))
    b.append(text(146, 159, 'Home page', size=11, fill=GREY, anchor='middle'))
    b.append(text(146, 177, 'upcoming event feed', size=10, fill=GREY, anchor='middle'))

    b.append(rect(244, 96, 168, 92, fill=WHITE, rx=6))
    b.append(text(328, 120, 'search.html', size=14, bold=True, anchor='middle'))
    b.append(text(328, 141, 'search.js', size=12, fill=GREY, anchor='middle'))
    b.append(text(328, 159, 'Search page', size=11, fill=GREY, anchor='middle'))
    b.append(text(328, 177, '3 filter criteria', size=10, fill=GREY, anchor='middle'))

    b.append(rect(426, 96, 168, 92, fill=WHITE, rx=6))
    b.append(text(510, 120, 'event.html', size=14, bold=True, anchor='middle'))
    b.append(text(510, 141, 'event.js', size=12, fill=GREY, anchor='middle'))
    b.append(text(510, 159, 'Event detail page', size=11, fill=GREY, anchor='middle'))
    b.append(text(510, 177, '?eventId=3', size=10, fill=GREY, anchor='middle'))

    # shared client modules
    b.append(rect(640, 55, 260, 68, fill=WHITE, stroke=AMBER, rx=10))
    b.append(text(770, 79, 'Shared client modules', size=12, fill=AMBER, bold=True, anchor='middle'))
    b.append(text(770, 99, 'api.js (fetch + Promises)  ·  ui.js (DOM)', size=11, fill=GREY, anchor='middle'))
    b.append(text(770, 115, 'config.js (static content)', size=11, fill=GREY, anchor='middle'))

    b.append(rect(640, 133, 260, 72, fill=GREY_L, stroke=GREY_B, rx=10))
    b.append(text(770, 157, 'Browser storage', size=12, fill=NAVY, bold=True, anchor='middle'))
    b.append(text(770, 177, 'localStorage fallback for the', size=11, fill=GREY, anchor='middle'))
    b.append(text(770, 193, 'selected event id', size=11, fill=GREY, anchor='middle'))

    # ---- arrow: request ----
    b.append(line(330, 213, 330, 258, stroke=AMBER, sw=2.5, arrow=True))
    b.append(rect(346, 220, 470, 30, fill=AMBER_L, stroke=AMBER, rx=6))
    b.append(text(581, 240, 'HTTP GET  ·  /api/events/search?city=Sydney&categoryId=1  ·  Accept: application/json',
                  size=11, fill='#8A5713', anchor='middle'))

    # ---- Tier 2: server ----
    b.append(rect(40, 262, 860, 176, fill=TEAL_L, stroke=TEAL, rx=10))
    b.append(text(60, 289, '2. SERVER TIER  —  Node.js 18 + ExpressJS (api/server.js)', size=13, fill='#0E6B62', bold=True))

    b.append(rect(62, 302, 190, 56, fill=WHITE, rx=6))
    b.append(text(157, 325, 'Express middleware', size=12, bold=True, anchor='middle'))
    b.append(text(157, 344, 'CORS · JSON · logger', size=10, fill=GREY, anchor='middle'))

    b.append(rect(268, 302, 300, 112, fill=WHITE, rx=6))
    b.append(text(418, 325, 'Route handlers', size=12, bold=True, anchor='middle'))
    b.append(text(418, 346, 'routes/events.js', size=11, fill=NAVY, anchor='middle'))
    b.append(text(418, 364, 'GET /api/events', size=10, fill=GREY, anchor='middle'))
    b.append(text(418, 380, 'GET /api/events/search', size=10, fill=GREY, anchor='middle'))
    b.append(text(418, 396, 'GET /api/events/:id', size=10, fill=GREY, anchor='middle'))
    b.append(text(418, 411, '+ categories.js · organisations.js', size=10, fill=GREY, anchor='middle'))

    b.append(rect(586, 302, 292, 56, fill=WHITE, rx=6))
    b.append(text(732, 325, 'utils/eventMapper.js + dateUtils.js', size=12, bold=True, anchor='middle'))
    b.append(text(732, 344, 'row → JSON contract, upcoming/past, progress %', size=10, fill=GREY, anchor='middle'))

    b.append(rect(586, 370, 292, 44, fill=WHITE, stroke=TEAL, rx=6))
    b.append(text(732, 398, 'event_db.js  ·  mysql2 connection pool', size=12, fill='#0E6B62', bold=True, anchor='middle'))

    b.append(rect(62, 370, 190, 44, fill=WHITE, rx=6))
    b.append(text(157, 398, 'Central error handler', size=12, bold=True, anchor='middle'))

    # ---- arrow: query ----
    b.append(line(732, 438, 732, 480, stroke=NAVY, sw=2.5, arrow=True))
    b.append(rect(748, 444, 152, 30, fill=WHITE, stroke=NAVY_B if False else BLUE_B, rx=6))
    b.append(text(824, 464, 'parameterised SQL ( ? )', size=11, fill=NAVY, anchor='middle'))

    # ---- Tier 3: data ----
    b.append(rect(40, 484, 860, 112, fill=PURPLE_L, stroke=PURPLE, rx=10))
    b.append(text(60, 511, '3. DATA TIER  —  MySQL 8  ·  database  charityevents_db', size=13, fill=PURPLE, bold=True))

    b.append(rect(90, 524, 180, 52, fill=WHITE, rx=6))
    b.append(text(180, 547, 'organisations', size=13, bold=True, anchor='middle'))
    b.append(text(180, 565, 'PK organisation_id', size=10, fill=GREY, anchor='middle'))

    b.append(rect(380, 524, 180, 52, fill=WHITE, stroke=PURPLE, sw=2, rx=6))
    b.append(text(470, 547, 'events', size=13, bold=True, anchor='middle'))
    b.append(text(470, 565, 'PK event_id · 2 FK', size=10, fill=GREY, anchor='middle'))

    b.append(rect(670, 524, 180, 52, fill=WHITE, rx=6))
    b.append(text(760, 547, 'categories', size=13, bold=True, anchor='middle'))
    b.append(text(760, 565, 'PK category_id', size=10, fill=GREY, anchor='middle'))

    b.append(line(272, 550, 376, 550, stroke=PURPLE, sw=2, arrow=True))
    b.append(text(324, 543, '1 : M', size=10, fill=PURPLE, anchor='middle'))
    b.append(line(564, 550, 666, 550, stroke=PURPLE, sw=2, arrow_start=True))
    b.append(text(615, 543, 'M : 1', size=10, fill=PURPLE, anchor='middle'))

    # ---- response arrow back up ----
    b.append(line(230, 484, 230, 445, stroke=TEAL, sw=2.5, arrow=True))
    b.append(rect(96, 604, 748, 0, fill=WHITE, stroke=WHITE))

    # response label on the right of the client tier
    b.append(rect(600, 220, 0, 0, fill=WHITE, stroke=WHITE))
    b.append(text(60, 612, 'Response path: MySQL rows  →  eventMapper (JSON contract)  →  Express res.json()  →  Promise resolves  →  renderEventCard() writes the DOM  →  the user sees the cards.',
                  size=11, fill=GREY))

    write('figure1-architecture.svg', svg(W, H, '\n'.join(b), 'Three-tier architecture'))


# =====================================================================
#  FIGURE 2 - Wireframes of the three pages
# =====================================================================
def figure2():
    W, H = 940, 560
    b = []
    b.append(text(W / 2, 28, 'Wireframes of the three required pages (low fidelity)',
                  size=19, fill=NAVY_D, bold=True, anchor='middle'))

    def frame(x, y, w, h, title, caption):
        out = [rect(x, y, w, h, fill=WHITE, stroke=NAVY, sw=2, rx=6)]
        out.append(rect(x, y, w, 28, fill=NAVY, stroke=NAVY, sw=2, rx=6))
        out.append(rect(x, y + 16, w, 12, fill=NAVY, stroke=NAVY, sw=0))
        out.append(text(x + w / 2, y + 19, title, size=13, fill=WHITE, bold=True, anchor='middle'))
        out.append(text(x + w / 2, y + h + 20, caption, size=11, fill=GREY, anchor='middle', italic=True))
        return out

    def block(x, y, w, h, label, fill=GREY_L, stroke=GREY_B, size=10, sub=None):
        out = [rect(x, y, w, h, fill=fill, stroke=stroke, rx=4)]
        if sub:
            out.append(text(x + w / 2, y + h / 2 - 2, label, size=size, fill=INK, bold=True, anchor='middle'))
            out.append(text(x + w / 2, y + h / 2 + 13, sub, size=9, fill=GREY, anchor='middle'))
        else:
            out.append(text(x + w / 2, y + h / 2 + 4, label, size=size, fill=INK, anchor='middle'))
        return out

    # ---------- Home ----------
    x, y, w, h = 30, 50, 275, 440
    b += frame(x, y, w, h, 'HOME  index.html', 'Static organisation info + dynamic event listing (API)')
    b.append(rect(x + 8, y + 34, w - 16, 22, fill=BLUE_L, stroke=BLUE_B, rx=3))
    b.append(text(x + 16, y + 49, 'LOGO', size=9, bold=True))
    b.append(text(x + w - 16, y + 49, 'Home · Search · About', size=8, fill=GREY, anchor='end'))
    b += block(x + 8, y + 62, w - 16, 64, 'HERO', BLUE_L, BLUE_B, 11, 'mission + "Browse events" CTA')
    b.append(rect(x + 8, y + 130, 80, 26, fill=WHITE, stroke=GREY_B, rx=3))
    b.append(text(x + 48, y + 141, '10', size=11, bold=True, anchor='middle'))
    b.append(text(x + 48, y + 152, 'upcoming', size=7, fill=GREY, anchor='middle'))
    b.append(rect(x + 94, y + 130, 80, 26, fill=WHITE, stroke=GREY_B, rx=3))
    b.append(text(x + 134, y + 141, '5', size=11, bold=True, anchor='middle'))
    b.append(text(x + 134, y + 152, 'categories', size=7, fill=GREY, anchor='middle'))
    b.append(rect(x + 180, y + 130, 87, 26, fill=WHITE, stroke=GREY_B, rx=3))
    b.append(text(x + 223, y + 141, '$186,850', size=11, bold=True, anchor='middle'))
    b.append(text(x + 223, y + 152, 'raised', size=7, fill=GREY, anchor='middle'))
    b += block(x + 8, y + 162, w - 16, 34, 'MISSION  ·  3 value cards', GREY_L, GREY_B)
    b.append(text(x + 12, y + 206, 'UPCOMING EVENTS  —  GET /api/events', size=9, bold=True, fill=NAVY))
    for i in range(3):
        cx = x + 8 + i * 87
        b.append(rect(cx, y + 214, 79, 106, fill=WHITE, stroke=GREY_B, rx=4))
        b.append(rect(cx + 4, y + 218, 71, 34, fill=BLUE_L, stroke=BLUE_B, rx=3))
        b.append(text(cx + 39, y + 238, 'image', size=7, fill=GREY, anchor='middle'))
        b.append(text(cx + 6, y + 264, 'Event name', size=7, bold=True))
        b.append(text(cx + 6, y + 275, 'summary text', size=6, fill=GREY))
        b.append(text(cx + 6, y + 292, 'date · venue', size=6, fill=GREY))
        b.append(rect(cx + 6, y + 298, 67, 6, fill=GREY_B, rx=3))
        b.append(rect(cx + 6, y + 298, 40, 6, fill=TEAL, rx=3))
        b.append(text(cx + 6, y + 314, '$45.00   View →', size=6, fill=NAVY))
    b.append(rect(x + 8, y + 328, w - 16, 22, fill=WHITE, stroke=GREY_B, rx=3))
    b.append(text(x + w / 2, y + 342, 'Show past events  (toggle)', size=8, fill=GREY, anchor='middle'))
    b += block(x + 8, y + 356, w - 16, 40, 'ORGANISATIONS  —  GET /api/organisations', GREY_L, GREY_B, 8)
    b += block(x + 8, y + 402, w - 16, 40, 'CONTACT  (static, hard-coded)', GREY_L, GREY_B, 8)
    b.append(rect(x + 8, y + 448, w - 16, 34, fill=NAVY_D, stroke=NAVY_D, rx=3))
    b.append(text(x + w / 2, y + 468, 'footer', size=8, fill=WHITE, anchor='middle'))

    # ---------- Search ----------
    x, y, w, h = 332, 50, 275, 440
    b += frame(x, y, w, h, 'SEARCH  search.html', 'Three criteria, combinable, with validation (API)')
    b.append(rect(x + 8, y + 34, w - 16, 22, fill=PURPLE_L, stroke=PURPLE, rx=3))
    b.append(text(x + 16, y + 49, 'LOGO', size=9, bold=True))
    b.append(text(x + w - 16, y + 49, 'Home · Search · About', size=8, fill=GREY, anchor='end'))
    b.append(rect(x + 8, y + 62, w - 16, 34, fill=PURPLE_L, stroke=PURPLE, rx=3))
    b.append(text(x + 16, y + 80, 'BANNER  Search charity events', size=9, fill=PURPLE, bold=True))
    b.append(rect(x + 8, y + 102, 118, 270, fill=GREY_L, stroke=GREY_B, rx=4))
    b.append(text(x + 16, y + 118, 'FILTER EVENTS', size=9, bold=True))
    b.append(text(x + 16, y + 134, '1. DATE', size=7, fill=NAVY, bold=True))
    b.append(rect(x + 16, y + 139, 50, 15, fill=WHITE, stroke=GREY_B, rx=2))
    b.append(text(x + 20, y + 150, 'From', size=6, fill=GREY))
    b.append(rect(x + 70, y + 139, 48, 15, fill=WHITE, stroke=GREY_B, rx=2))
    b.append(text(x + 74, y + 150, 'To', size=6, fill=GREY))
    b.append(text(x + 16, y + 166, '● Anytime  ○ 30d  ○ 90d', size=6, fill=GREY))
    b.append(text(x + 16, y + 186, '2. LOCATION', size=7, fill=NAVY, bold=True))
    b.append(rect(x + 16, y + 191, 102, 15, fill=WHITE, stroke=GREY_B, rx=2))
    b.append(text(x + 20, y + 202, 'city / suburb  (datalist)', size=6, fill=GREY))
    b.append(text(x + 16, y + 220, '3. EVENT CATEGORY', size=7, fill=NAVY, bold=True))
    b.append(rect(x + 16, y + 225, 102, 15, fill=WHITE, stroke=GREY_B, rx=2))
    b.append(text(x + 20, y + 236, 'drop-down ▾  (from API)', size=6, fill=GREY))
    b.append(text(x + 16, y + 254, '4. TIME FRAME', size=7, fill=NAVY, bold=True))
    b.append(text(x + 16, y + 266, '● Upcoming only', size=6, fill=GREY))
    b.append(text(x + 16, y + 276, '○ Include past   ○ Past only', size=6, fill=GREY))
    b.append(rect(x + 16, y + 288, 102, 20, fill=AMBER, rx=10))
    b.append(text(x + 67, y + 302, 'Search events', size=8, fill=WHITE, bold=True, anchor='middle'))
    b.append(rect(x + 16, y + 313, 102, 20, fill=WHITE, stroke=GREY_B, rx=10))
    b.append(text(x + 67, y + 327, 'Clear filters  (DOM reset)', size=7, fill=NAVY, anchor='middle'))
    b.append(text(x + 16, y + 348, 'error / message area', size=6, fill='#8C2137', italic=True))
    b.append(text(x + 134, y + 118, 'RESULTS', size=9, bold=True))
    b.append(text(x + 134, y + 132, '3 events found', size=7, fill=GREY))
    b.append(rect(x + 134, y + 138, 60, 14, fill=TEAL_L, stroke=TEAL, rx=7))
    b.append(text(x + 164, y + 148, 'chip: Fun Run', size=6, fill='#0E6B62', anchor='middle'))
    for r in range(2):
        for c in range(2):
            cx = x + 134 + c * 68
            cy = y + 158 + r * 92
            b.append(rect(cx, cy, 62, 84, fill=WHITE, stroke=GREY_B, rx=3))
            b.append(rect(cx + 3, cy + 3, 56, 26, fill=BLUE_L, stroke=BLUE_B, rx=2))
            b.append(text(cx + 6, cy + 40, 'Event name', size=6, bold=True))
            b.append(text(cx + 6, cy + 50, 'summary', size=5, fill=GREY))
            b.append(text(cx + 6, cy + 62, 'date · venue', size=5, fill=GREY))
            b.append(rect(cx + 6, cy + 68, 50, 5, fill=GREY_B, rx=2))
            b.append(rect(cx + 6, cy + 68, 30, 5, fill=TEAL, rx=2))
            b.append(text(cx + 6, cy + 81, '$45   View →', size=5, fill=NAVY))
    b.append(rect(x + 8, y + 448, w - 16, 34, fill=NAVY_D, stroke=NAVY_D, rx=3))
    b.append(text(x + w / 2, y + 468, 'footer', size=8, fill=WHITE, anchor='middle'))

    # ---------- Event detail ----------
    x, y, w, h = 634, 50, 275, 440
    b += frame(x, y, w, h, 'EVENT DETAIL  event.html', 'One event, passed as ?eventId=3 (API)')
    b.append(rect(x + 8, y + 34, w - 16, 22, fill=NAVY_D, stroke=NAVY_D, rx=3))
    b.append(text(x + 16, y + 49, 'LOGO', size=9, fill=WHITE, bold=True))
    b.append(text(x + w - 16, y + 49, 'Home · Search · About', size=8, fill=GREY_L, anchor='end'))
    b.append(rect(x + 8, y + 62, w - 16, 40, fill=NAVY_D, stroke=NAVY_D, rx=3))
    b.append(text(x + 16, y + 78, 'Home › Search › Event name', size=6, fill=GREY_L))
    b.append(text(x + 16, y + 92, 'EVENT TITLE  + date / venue / goal', size=9, fill=WHITE, bold=True))
    b.append(rect(x + 8, y + 108, 160, 66, fill=BLUE_L, stroke=BLUE_B, rx=4))
    b.append(text(x + 88, y + 145, 'event image', size=8, fill=GREY, anchor='middle'))
    b.append(rect(x + 178, y + 108, 89, 66, fill=NAVY, stroke=NAVY, rx=4))
    b.append(text(x + 222, y + 126, 'TICKET', size=6, fill=GREY_L, anchor='middle'))
    b.append(text(x + 222, y + 142, '$45.00', size=11, fill=WHITE, bold=True, anchor='middle'))
    b.append(rect(x + 184, y + 150, 77, 16, fill=AMBER, rx=8))
    b.append(text(x + 222, y + 162, 'REGISTER', size=7, fill=WHITE, bold=True, anchor='middle'))
    b += block(x + 8, y + 182, 160, 46, 'ABOUT THIS EVENT', GREY_L, GREY_B, 8, 'full description')
    b.append(rect(x + 8, y + 232, 160, 52, fill=TEAL_L, stroke=TEAL, rx=4))
    b.append(text(x + 14, y + 246, 'GOAL vs. PROGRESS', size=7, fill='#0E6B62', bold=True))
    b.append(text(x + 14, y + 258, 'purpose statement', size=6, fill=GREY))
    b.append(rect(x + 14, y + 264, 148, 7, fill=WHITE, stroke=GREY_B, rx=3))
    b.append(rect(x + 14, y + 264, 88, 7, fill=TEAL, rx=3))
    b.append(text(x + 14, y + 280, '$28,450 raised  ·  goal $60,000', size=6, fill=GREY))
    b += block(x + 8, y + 288, 160, 62, 'EVENT DETAILS', GREY_L, GREY_B, 8, 'date · venue · category · tickets')
    b.append(rect(x + 178, y + 182, 89, 66, fill=WHITE, stroke=GREY_B, rx=4))
    b.append(text(x + 222, y + 198, 'HOSTED BY', size=6, fill=NAVY, bold=True, anchor='middle'))
    b.append(rect(x + 186, y + 204, 24, 24, fill=BLUE_L, stroke=BLUE_B, rx=4))
    b.append(text(x + 222, y + 220, 'org logo', size=5, fill=GREY, anchor='middle'))
    b.append(text(x + 222, y + 238, 'organisation + contact', size=6, fill=GREY, anchor='middle'))
    b.append(rect(x + 178, y + 254, 89, 18, fill=WHITE, stroke=GREY_B, rx=3))
    b.append(text(x + 222, y + 266, '← Back to search', size=6, fill=NAVY, anchor='middle'))
    b.append(rect(x + 178, y + 276, 89, 18, fill=WHITE, stroke=GREY_B, rx=3))
    b.append(text(x + 222, y + 288, '← Back to home', size=6, fill=NAVY, anchor='middle'))
    b.append(rect(x + 178, y + 300, 89, 50, fill=AMBER_L, stroke=AMBER, rx=4))
    b.append(text(x + 222, y + 316, 'MODAL on Register', size=6, fill='#8A5713', bold=True, anchor='middle'))
    b.append(text(x + 222, y + 330, '"This feature is', size=6, fill='#8A5713', anchor='middle'))
    b.append(text(x + 222, y + 341, 'currently under construction."', size=5, fill='#8A5713', anchor='middle'))
    b.append(rect(x + 8, y + 358, w - 16, 44, fill=GREY_L, stroke=GREY_B, rx=3))
    b.append(text(x + w / 2, y + 376, 'Loading state: skeleton cards', size=7, fill=GREY, anchor='middle'))
    b.append(text(x + w / 2, y + 390, 'Error state: DOM message + retry', size=7, fill=GREY, anchor='middle'))
    b.append(rect(x + 8, y + 448, w - 16, 34, fill=NAVY_D, stroke=NAVY_D, rx=3))
    b.append(text(x + w / 2, y + 468, 'footer', size=8, fill=WHITE, anchor='middle'))

    # shared notes
    b.append(text(30, 512, 'Shared across all three pages:', size=11, fill=NAVY, bold=True))
    b.append(text(30, 530, 'identical sticky navigation with the current page highlighted  ·  breadcrumbs on inner pages  ·  responsive single-column layout below 760 px  ·  ARIA landmarks and live regions.',
                  size=10, fill=GREY))
    b.append(text(30, 548, 'Card anatomy: image and status badge  |  event name  |  summary  |  date, venue and category  |  fundraising progress bar  |  ticket price and detail link.',
                  size=10, fill=GREY))

    write('figure2-wireframes.svg', svg(W, H, '\n'.join(b), 'Wireframes'))


# =====================================================================
#  FIGURE 3 - Entity relationship diagram
# =====================================================================
def figure3():
    W, H = 940, 730
    b = []
    b.append(text(W / 2, 28, 'Entity relationship diagram — charityevents_db',
                  size=19, fill=NAVY_D, bold=True, anchor='middle'))

    def entity(x, y, w, name, rows, accent=NAVY):
        out = [rect(x, y, w, 34 + len(rows) * 22, fill=WHITE, stroke=accent, sw=2, rx=6)]
        out.append(rect(x, y, w, 30, fill=accent, stroke=accent, sw=2, rx=6))
        out.append(rect(x, y + 18, w, 12, fill=accent, stroke=accent, sw=0))
        out.append(text(x + w / 2, y + 21, name, size=14, fill=WHITE, bold=True, anchor='middle'))
        for i, (key, label) in enumerate(rows):
            ry = y + 34 + i * 22
            if i % 2 == 1:
                out.append(rect(x + 1, ry, w - 2, 22, fill=GREY_L, stroke=GREY_L, sw=0))
            colour = AMBER if key == 'PK' else (TEAL if key == 'FK' else GREY)
            out.append(text(x + 10, ry + 15, key, size=9, fill=colour, bold=True))
            out.append(text(x + 46, ry + 15, label, size=10, fill=INK))
        return out

    # organisations (left)
    b += entity(40, 70, 250, 'organisations', [
        ('PK', 'organisation_id  INT AI'),
        ('UQ', 'name  VARCHAR(120)'),
        ('', 'mission_statement'),
        ('', 'about_text  TEXT'),
        ('', 'email  VARCHAR(120)'),
        ('', 'phone  VARCHAR(30)'),
        ('', 'website  VARCHAR(200)'),
        ('', 'city  VARCHAR(80)'),
        ('', 'logo_url  VARCHAR(300)'),
        ('', 'created_at  TIMESTAMP'),
    ], NAVY)

    # events (centre, highlighted)
    b += entity(360, 70, 250, 'events', [
        ('PK', 'event_id  INT AI'),
        ('FK', 'organisation_id'),
        ('FK', 'category_id'),
        ('', 'event_name'),
        ('', 'short_summary'),
        ('', 'full_description  TEXT'),
        ('', 'purpose  VARCHAR(500)'),
        ('', 'event_date  DATE'),
        ('', 'start_time / end_time'),
        ('', 'location_name / address'),
        ('', 'suburb / city'),
        ('', 'ticket_price  DECIMAL(8,2)'),
        ('', 'is_free  TINYINT(1)'),
        ('', 'goal_amount  DECIMAL(10,2)'),
        ('', 'raised_amount  DECIMAL(10,2)'),
        ('', 'capacity  INT'),
        ('', 'image_url  VARCHAR(300)'),
        ('', 'status  ENUM(active/suspended/cancelled)'),
        ('', 'created_at / updated_at'),
    ], '#1D5B95')

    # categories (right)
    b += entity(680, 70, 220, 'categories', [
        ('PK', 'category_id  INT AI'),
        ('UQ', 'category_name'),
        ('', 'description  VARCHAR(255)'),
    ], PURPLE)

    # relationships
    b.append(line(290, 200, 356, 200, stroke=NAVY, sw=2.5))
    b.append(text(323, 180, '1', size=13, fill=NAVY, bold=True, anchor='middle'))
    b.append(text(323, 222, 'M', size=13, fill=NAVY, bold=True, anchor='middle'))
    b.append(text(323, 246, 'hosts', size=11, fill=GREY, anchor='middle', italic=True))

    b.append(line(614, 200, 676, 200, stroke=PURPLE, sw=2.5))
    b.append(text(645, 180, 'M', size=13, fill=PURPLE, bold=True, anchor='middle'))
    b.append(text(645, 222, '1', size=13, fill=PURPLE, bold=True, anchor='middle'))
    b.append(text(645, 246, 'classifies', size=11, fill=GREY, anchor='middle', italic=True))

    # constraints panel
    b.append(rect(40, 590, 860, 118, fill=GREY_L, stroke=GREY_B, rx=8))
    b.append(text(58, 612, 'Referential integrity and constraints', size=12, fill=NAVY, bold=True))
    b.append(text(58, 634, 'fk_events_organisation    events.organisation_id  →  organisations.organisation_id        ON UPDATE CASCADE    ON DELETE RESTRICT', size=10, fill=INK))
    b.append(text(58, 652, 'fk_events_category        events.category_id  →  categories.category_id                         ON UPDATE CASCADE    ON DELETE RESTRICT', size=10, fill=INK))
    b.append(text(58, 670, 'chk_events_amounts    goal_amount ≥ 0  AND  raised_amount ≥ 0            chk_events_ticket    ticket_price ≥ 0', size=10, fill=INK))
    b.append(text(58, 688, 'UNIQUE    organisations.name,  categories.category_name            INDEX    event_date, city, status, category_id, organisation_id', size=10, fill=INK))
    b.append(text(58, 706, 'PK = primary key   ·   FK = foreign key   ·   UQ = unique   ·   AI = AUTO_INCREMENT        Engine: InnoDB        Charset: utf8mb4', size=9, fill=GREY, italic=True))

    # A3 extension panel
    b.append(rect(672, 200, 228, 116, fill=AMBER_L, stroke=AMBER, rx=6))
    b.append(text(786, 222, 'Assessment 3 extension', size=11, fill='#8A5713', bold=True, anchor='middle'))
    b.append(text(786, 244, 'users  (1)', size=10, fill=INK, anchor='middle'))
    b.append(text(786, 260, '↓', size=12, fill=GREY, anchor='middle'))
    b.append(text(786, 278, 'registrations  (M)', size=10, fill=INK, anchor='middle'))
    b.append(text(786, 294, 'ticket purchases and', size=9, fill=GREY, anchor='middle'))
    b.append(text(786, 308, 'donations against events', size=9, fill=GREY, anchor='middle'))

    # suspended-event note
    b.append(rect(672, 336, 228, 88, fill='#FDEAEE', stroke='#F2C2CD', rx=6))
    b.append(text(786, 358, 'Policy enforcement', size=11, fill='#8C2137', bold=True, anchor='middle'))
    b.append(text(786, 378, 'status = "suspended"', size=10, fill=INK, anchor='middle'))
    b.append(text(786, 394, 'is retained for audit but', size=9, fill=GREY, anchor='middle'))
    b.append(text(786, 408, 'filtered out by the API, so it', size=9, fill=GREY, anchor='middle'))
    b.append(text(786, 422, 'never reaches the website', size=9, fill=GREY, anchor='middle'))

    write('figure3-entity-relationship.svg', svg(W, H, '\n'.join(b), 'Entity relationship diagram'))


if __name__ == '__main__':
    print('Generating diagrams...')
    figure1()
    figure2()
    figure3()
    print('done')
