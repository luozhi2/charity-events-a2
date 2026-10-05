# -*- coding: utf-8 -*-
"""
Converts 操作手册-从这里开始.md into a readable Word document with proper
Chinese font handling (w:eastAsia is required, otherwise Word shows boxes).

  python tools/make_manual_docx.py
"""
import os
import re
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '操作手册-从这里开始.md')
DST = os.path.join(ROOT, '操作手册-从这里开始.docx')

# Arial for Latin, 微软雅黑 for Chinese - both specified so nothing renders as boxes.
FONT = ('<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="\u5fae\u8f6f\u96c5\u9ed1" '
        'w:cs="Arial"/>')


def esc(t):
    return (t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def runs(text):
    """**bold** -> bold runs; `code` -> monospace runs."""
    out = []
    # split on bold first
    for i, part in enumerate(re.split(r'\*\*', text)):
        if part == '':
            continue
        bold = i % 2 == 1
        # then split on inline code
        for j, chunk in enumerate(re.split(r'`([^`]*)`', part)):
            if chunk == '':
                continue
            if j % 2 == 1:
                rpr = ('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:eastAsia="\u5fae\u8f6f\u96c5\u9ed1"/>'
                       '<w:shd w:val="clear" w:color="auto" w:fill="F0F3F6"/>'
                       '<w:sz w:val="20"/>')
            else:
                rpr = FONT + ('<w:b/>' if bold else '') + '<w:sz w:val="21"/>'
            out.append(f'<w:r><w:rPr>{rpr}</w:rPr><w:t xml:space="preserve">{esc(chunk)}</w:t></w:r>')
    return ''.join(out)


def para(content, after=100, line=300, indent=0, jc=None, keep=False):
    ind = f'<w:ind w:left="{indent}"/>' if indent else ''
    j = f'<w:jc w:val="{jc}"/>' if jc else ''
    k = '<w:keepNext/>' if keep else ''
    return (f'<w:p><w:pPr>{k}<w:spacing w:after="{after}" w:line="{line}" w:lineRule="auto"/>'
            f'{ind}{j}<w:rPr>{FONT}<w:sz w:val="21"/></w:rPr></w:pPr>{content}</w:p>')


def heading(text, level):
    sizes = {1: 34, 2: 26, 3: 23}
    sz = sizes.get(level, 22)
    colour = "0F3C66" if level < 3 else "1D5B95"
    # Strip inline emphasis markers so a heading whose source text contains
    # **bold** does not print the asterisks. Headings are bold regardless.
    clean = text.replace('**', '').replace('`', '')
    return (f'<w:p><w:pPr><w:keepNext/><w:spacing w:before="{240 if level == 1 else 200}" '
            f'w:after="120" w:line="280" w:lineRule="auto"/>'
            f'<w:rPr>{FONT}<w:b/><w:sz w:val="{sz}"/>'
            f'<w:color w:val="{colour}"/></w:rPr></w:pPr>'
            f'<w:r><w:rPr>{FONT}<w:b/><w:sz w:val="{sz}"/>'
            f'<w:color w:val="{colour}"/></w:rPr>'
            f'<w:t xml:space="preserve">{esc(clean)}</w:t></w:r></w:p>')


def cell(text, width, header=False):
    fill = 'E4EBF1' if header else None
    shd = f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>' if fill else ''
    return (f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>{shd}'
            '<w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="90" w:type="dxa"/>'
            '<w:bottom w:w="60" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar>'
            '<w:vAlign w:val="top"/></w:tcPr>'
            f'<w:p><w:pPr><w:spacing w:after="20" w:line="260" w:lineRule="auto"/>'
            f'<w:rPr>{FONT}<w:sz w:val="19"/></w:rPr></w:pPr>'
            f'{runs(text)}</w:p></w:tc>')


def table(rows):
    ncols = max(len(r) for r in rows)
    width = int(9026 / ncols)
    widths = [width] * ncols
    borders = ('<w:tblBorders>'
               '<w:top w:val="single" w:sz="6" w:color="9AAAB8"/>'
               '<w:left w:val="single" w:sz="6" w:color="9AAAB8"/>'
               '<w:bottom w:val="single" w:sz="6" w:color="9AAAB8"/>'
               '<w:right w:val="single" w:sz="6" w:color="9AAAB8"/>'
               '<w:insideH w:val="single" w:sz="4" w:color="C4D0DA"/>'
               '<w:insideV w:val="single" w:sz="4" w:color="C4D0DA"/></w:tblBorders>')
    out = ['<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>' + borders +
           '<w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>' +
           ''.join(f'<w:gridCol w:w="{w}"/>' for w in widths) + '</w:tblGrid>']
    for ri, row in enumerate(rows):
        cells = list(row) + [''] * (ncols - len(row))
        out.append('<w:tr>' + ''.join(
            cell(c, widths[ci], header=(ri == 0)) for ci, c in enumerate(cells)) + '</w:tr>')
    out.append('</w:tbl>')
    out.append(para('', after=120))
    return ''.join(out)


def code_block(lines):
    out = []
    for line in lines:
        out.append(
            '<w:p><w:pPr><w:spacing w:after="0" w:line="250" w:lineRule="auto"/>'
            '<w:shd w:val="clear" w:color="auto" w:fill="F2F5F8"/>'
            '<w:ind w:left="240" w:right="200"/>'
            f'<w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:eastAsia="\u5fae\u8f6f\u96c5\u9ed1"/>'
            '<w:sz w:val="19"/></w:rPr></w:pPr>'
            f'<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:eastAsia="\u5fae\u8f6f\u96c5\u9ed1"/>'
            '<w:sz w:val="19"/></w:rPr>'
            f'<w:t xml:space="preserve">{esc(line) if line.strip() else " "}</w:t></w:r></w:p>')
    return ''.join(out) + para('', after=100)


def main():
    with open(SRC, 'r', encoding='utf-8') as f:
        lines = f.read().split('\n')

    body = []
    i = 0
    while i < len(lines):
        line = lines[i]

        # fenced code block
        if line.strip().startswith('```'):
            i += 1
            block = []
            while i < len(lines) and not lines[i].strip().startswith('```'):
                block.append(lines[i])
                i += 1
            i += 1
            body.append(code_block(block))
            continue

        # table
        if line.strip().startswith('|') and i + 1 < len(lines) and re.match(r'^\s*\|[\s:|-]+\|\s*$', lines[i + 1]):
            rows = []
            header = [c.strip() for c in line.strip().strip('|').split('|')]
            rows.append(header)
            i += 2
            while i < len(lines) and lines[i].strip().startswith('|'):
                rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')])
                i += 1
            body.append(table(rows))
            continue

        # headings
        m = re.match(r'^(#{1,4})\s+(.*)$', line)
        if m:
            body.append(heading(m.group(2).strip(), len(m.group(1))))
            i += 1
            continue

        # horizontal rule
        if re.match(r'^\s*---+\s*$', line):
            body.append('<w:p><w:pPr><w:spacing w:after="120"/>'
                        '<w:pBdr><w:bottom w:val="single" w:sz="6" w:color="C4D0DA"/></w:pBdr>'
                        '</w:pPr></w:p>')
            i += 1
            continue

        # blockquote (kept italic and indented; inline markers are still processed)
        if line.strip().startswith('>'):
            text = line.strip()[1:].strip()
            body.append(para('<w:r><w:rPr>' + FONT + '<w:i/><w:sz w:val="20"/>'
                             '<w:color w:val="4A5C6B"/></w:rPr>'
                             '<w:t xml:space="preserve">\u275d  </w:t></w:r>' + runs(text),
                             after=80, indent=240))
            i += 1
            continue

        # list items
        m = re.match(r'^(\s*)([-*]|\d+\.)\s+(.*)$', line)
        if m:
            indent = 240 + (len(m.group(1)) // 2) * 280
            bullet = '•  ' if m.group(2) in ('-', '*') else m.group(2) + ' '
            body.append(para('<w:r><w:rPr>' + FONT + '<w:sz w:val="21"/></w:rPr>'
                             f'<w:t xml:space="preserve">{esc(bullet)}</w:t></w:r>' + runs(m.group(3)),
                             after=50, indent=indent))
            i += 1
            continue

        # blank line
        if line.strip() == '':
            i += 1
            continue

        # normal paragraph
        body.append(para(runs(line.strip())))
        i += 1

    NS = ('xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" '
          'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
          'xmlns:o="urn:schemas-microsoft-com:office:office" '
          'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
          'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
          'xmlns:v="urn:schemas-microsoft-com:vml" '
          'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" '
          'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
          'xmlns:w10="urn:schemas-microsoft-com:office:word" '
          'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
          'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"')

    sectpr = ('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
              '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" '
              'w:header="720" w:footer="720" w:gutter="0"/><w:cols w:space="720"/></w:sectPr>')

    doc = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
           f'<w:document {NS}><w:body>' + ''.join(body) + sectpr + '</w:body></w:document>')

    styles = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
              f'<w:styles {NS}><w:docDefaults><w:rPrDefault><w:rPr>{FONT}'
              '<w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:rPrDefault>'
              '<w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="300" w:lineRule="auto"/>'
              '</w:pPr></w:pPrDefault></w:docDefaults>'
              '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/>'
              '<w:qFormat/></w:style></w:styles>')

    content_types = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                     '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                     '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                     '<Default Extension="xml" ContentType="application/xml"/>'
                     '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
                     '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
                     '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
                     '</Types>')

    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
            '</Relationships>')

    doc_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
                '</Relationships>')

    core = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
            'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            '<dc:title>PROG2002 A2 操作手册</dc:title>'
            '<dcterms:created xsi:type="dcterms:W3CDTF">2025-01-01T00:00:00Z</dcterms:created>'
            '</cp:coreProperties>')

    if os.path.exists(DST):
        os.remove(DST)
    with zipfile.ZipFile(DST, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('word/document.xml', doc)
        z.writestr('word/styles.xml', styles)
        z.writestr('word/_rels/document.xml.rels', doc_rels)
        z.writestr('docProps/core.xml', core)

    print('created:', DST)
    print('blocks :', len(body))


if __name__ == '__main__':
    main()
