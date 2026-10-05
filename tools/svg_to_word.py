# -*- coding: utf-8 -*-
"""
Converts the SVG diagrams in tools/diagrams/ into native Word DrawingML
shapes so the report contains real, editable vector diagrams rather than
flat pictures or ASCII art.

Supported SVG subset (everything the generated diagrams use):
    <rect>  <line>  <text>        plus the <defs> arrow markers, which are
    translated into DrawingML line heads.
"""
import os
import re

EMU_PER_PX = 9525          # 1 px at 96 dpi
CONTENT_TWIPS = 9026       # usable page width in twips (A4, 1440 twip margins)


def esc(t):
    return (str(t).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            .replace('"', '&quot;'))


def emu(value):
    return int(round(value * EMU_PER_PX))


class Canvas:
    """Tracks the shape id counter and the running total height in EMU."""

    def __init__(self, scale):
        self.shape_id = 1
        self.scale = scale

    def next_id(self):
        self.shape_id += 1
        return self.shape_id


def _colour(value, default='000000'):
    if not value or value == 'none':
        return default
    value = value.strip().lstrip('#')
    if len(value) == 3:
        value = ''.join(c * 2 for c in value)
    return value.upper()


def rect_shape(shape_id, x, y, w, h, fill, stroke, sw, rx, scale):
    """<rect> -> wps:wsp with a prstGeom of roundRect (or rect)."""
    cx, cy = emu(x * scale), emu(y * scale)
    cw, ch = max(emu(w * scale), 1), max(emu(h * scale), 1)
    has_line = bool(stroke) and stroke != 'none' and sw
    geom = 'roundRect' if rx else 'rect'
    adj = ''
    if rx:
        # roundRect adjustment is a fraction of half the shorter side (val 0..50000)
        shorter = min(w, h)
        if shorter > 0:
            frac = min(0.5, rx / shorter)
            adj = f'<a:gd name="adj" fmla="val {int(frac * 100000)}"/>'

    line = ''
    if has_line:
        line = (f'<a:ln w="{max(int(round(sw * 12700 * scale)), 6350)}">'
                f'<a:solidFill><a:srgbClr val="{_colour(stroke)}"/></a:solidFill></a:ln>')
    else:
        line = '<a:ln><a:noFill/></a:ln>'

    return (
        f'<wps:wsp><wps:cNvPr id="{shape_id}" name="Rect {shape_id}"/><wps:cNvSpPr/>'
        f'<wps:spPr><a:xfrm><a:off x="{cx}" y="{cy}"/><a:ext cx="{cw}" cy="{ch}"/></a:xfrm>'
        f'<a:prstGeom prst="{geom}">{("<a:avLst>" + adj + "</a:avLst>") if adj else "<a:avLst/>"}</a:prstGeom>'
        f'<a:solidFill><a:srgbClr val="{_colour(fill, "FFFFFF")}"/></a:solidFill>'
        f'{line}</wps:spPr>'
        f'<wps:bodyPr rot="0" spcFirstLastPara="0" vertOverflow="overflow" horzOverflow="overflow" '
        f'vert="horz" wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr" anchorCtr="0">'
        f'<a:noAutofit/></wps:bodyPr></wps:wsp>'
    )


def text_shape(shape_id, x, y, s, size, fill, bold, italic, anchor, scale):
    """
    <text> -> wps:wsp text box.

    In SVG, x is the text anchor and y the baseline. The box is therefore
    centred vertically on (y - 0.35 * font-size) and widened to a generous
    estimate so Word does not wrap or clip the label.
    """
    fs = size * scale
    box_h = fs * 1.5
    box_w = max(len(s) * fs * 0.58 + 14, 24)

    centre_x = x
    if anchor == 'middle':
        box_left = centre_x - box_w / 2
    elif anchor == 'end':
        box_left = centre_x - box_w
    else:
        box_left = centre_x

    # SVG y is the text baseline; the box is centred slightly above it.
    box_top = y - size * 0.36 - box_h / 2

    cx, cy = emu(box_left), emu(box_top)
    cw, ch = max(emu(box_w), 1), max(emu(box_h), 1)

    b = ' b="1"' if bold else ''
    i = ' i="1"' if italic else ''

    return (
        f'<wps:wsp><wps:cNvPr id="{shape_id}" name="Text {shape_id}"/><wps:cNvSpPr txBox="1"/>'
        f'<wps:spPr><a:xfrm><a:off x="{cx}" y="{cy}"/><a:ext cx="{cw}" cy="{ch}"/></a:xfrm>'
        f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></wps:spPr>'
        f'<wps:txbx><w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/>'
        f'<w:jc w:val="{"center" if anchor == "middle" else ("right" if anchor == "end" else "left")}"/>'
        f'<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="{int(round(size * 2))}"/>'
        f'<w:color w:val="{_colour(fill)}"/>{("<w:b/>" if bold else "")}{("<w:i/>" if italic else "")}</w:rPr></w:pPr>'
        f'<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="{int(round(size * 2))}"/>'
        f'<w:color w:val="{_colour(fill)}"/>{("<w:b/>" if bold else "")}{("<w:i/>" if italic else "")}</w:rPr>'
        f'<w:t xml:space="preserve">{esc(s)}</w:t></w:r></w:p></wps:txbx>'
        f'<wps:bodyPr rot="0" spcFirstLastPara="0" vertOverflow="overflow" horzOverflow="overflow" '
        f'vert="horz" wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr" anchorCtr="0">'
        f'<a:noAutofit/></wps:bodyPr></wps:wsp>'
    )


def line_shape(shape_id, x1, y1, x2, y2, stroke, sw, arrow, arrow_start, scale):
    """<line> -> wps:wsp straightConnector1, optionally with arrow heads."""
    left, top = min(x1, x2), min(y1, y2)
    width, height = abs(x2 - x1), abs(y2 - y1)
    flipH = ' flipH="1"' if x2 < x1 else ''
    flipV = ' flipV="1"' if y2 < y1 else ''

    head = ''
    if arrow:
        head += '<a:tailEnd type="triangle" w="med" len="med"/>'
    if arrow_start:
        head += '<a:headEnd type="triangle" w="med" len="med"/>'

    return (
        f'<wps:wsp><wps:cNvPr id="{shape_id}" name="Line {shape_id}"/><wps:cNvSpPr/>'
        f'<wps:spPr><a:xfrm{flipH}{flipV}>'
        f'<a:off x="{emu(left * scale)}" y="{emu(top * scale)}"/>'
        f'<a:ext cx="{max(emu(width * scale), 1)}" cy="{max(emu(height * scale), 1)}"/></a:xfrm>'
        f'<a:prstGeom prst="straightConnector1"><a:avLst/></a:prstGeom>'
        f'<a:ln w="{max(int(round(sw * 12700 * scale)), 6350)}">'
        f'<a:solidFill><a:srgbClr val="{_colour(stroke)}"/></a:solidFill>'
        f'{head}</a:ln></wps:spPr>'
        f'<wps:bodyPr rot="0" spcFirstLastPara="0" vertOverflow="overflow" horzOverflow="overflow" '
        f'vert="horz" wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr" anchorCtr="0">'
        f'<a:noAutofit/></wps:bodyPr></wps:wsp>'
    )


ATTR = re.compile(r'([a-zA-Z-]+)="([^"]*)"')
TAG = re.compile(r'<(rect|line|text)\b([^>]*?)(/>|>(.*?)</text>)', re.S)


def svg_to_drawingml(svg_text, target_width_inches=6.25):
    """
    Returns (drawing_xml, height_inches) for one SVG diagram.
    """
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg_text)
    svg_w, svg_h = float(m.group(1)), float(m.group(2))

    # 1 px at 96 dpi -> inches; scale so the diagram fits the text column.
    native_inches = svg_w / 96.0
    scale = (target_width_inches / native_inches) if native_inches > target_width_inches else 1.0
    height_inches = (svg_h / 96.0) * scale
    width_inches = (svg_w / 96.0) * scale

    canvas = Canvas(scale)
    shapes = []

    for tag in TAG.finditer(svg_text):
        kind, attrs_text, closer, inner = tag.group(1), tag.group(2), tag.group(3), tag.group(4)
        a = dict(ATTR.findall(attrs_text))
        sid = canvas.next_id()

        if kind == 'rect':
            shapes.append(rect_shape(
                sid,
                float(a.get('x', 0)), float(a.get('y', 0)),
                float(a.get('width', 0)), float(a.get('height', 0)),
                a.get('fill', '#FFFFFF'), a.get('stroke', 'none'),
                float(a.get('stroke-width', 0) or 0), float(a.get('rx', 0) or 0), scale
            ))
        elif kind == 'line':
            shapes.append(line_shape(
                sid,
                float(a.get('x1', 0)), float(a.get('y1', 0)),
                float(a.get('x2', 0)), float(a.get('y2', 0)),
                a.get('stroke', '#000000'), float(a.get('stroke-width', 2) or 2),
                'marker-end' in attrs_text, 'marker-start' in attrs_text, scale
            ))
        elif kind == 'text':
            text_value = re.sub(r'<[^>]+>', '', inner or '')
            text_value = (text_value.replace('&amp;', '&').replace('&lt;', '<')
                          .replace('&gt;', '>').replace('&quot;', '"'))
            if not text_value.strip():
                continue
            shapes.append(text_shape(
                sid,
                float(a.get('x', 0)), float(a.get('y', 0)), text_value,
                float(a.get('font-size', 12) or 12), a.get('fill', '#000000'),
                'bold' in attrs_text, 'italic' in attrs_text,
                a.get('text-anchor', 'start'), scale
            ))

    drawing = (
        '<w:p><w:pPr><w:spacing w:after="120" w:line="240" w:lineRule="auto"/>'
        '<w:jc w:val="center"/></w:pPr>'
        '<w:r><w:drawing>'
        '<wp:inline distT="0" distB="0" distL="0" distR="0">'
        f'<wp:extent cx="{emu(width_inches * 96)}" cy="{emu(height_inches * 96)}"/>'
        '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
        f'<wp:docPr id="{canvas.shape_id + 100}" name="Diagram"/>'
        '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>'
        '<a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup">'
        '<wpg:wgp>'
        f'<wpg:cNvGrpSpPr/><wpg:grpSpPr><a:xfrm><a:off x="0" y="0"/>'
        f'<a:ext cx="{emu(width_inches * 96)}" cy="{emu(height_inches * 96)}"/>'
        '<a:chOff x="0" y="0"/>'
        f'<a:chExt cx="{emu(width_inches * 96)}" cy="{emu(height_inches * 96)}"/>'
        '</a:xfrm></wpg:grpSpPr>'
        + ''.join(shapes) +
        '</wpg:wgp></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
    )

    return drawing, height_inches


def load_diagram(name, diagrams_dir, target_width_inches=6.25):
    path = os.path.join(diagrams_dir, name)
    with open(path, 'r', encoding='utf-8') as f:
        return svg_to_drawingml(f.read(), target_width_inches)
