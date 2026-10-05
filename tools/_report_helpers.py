# -*- coding: utf-8 -*-
"""
Builds the completed PROG2002 A2 report from the official template.

It keeps the template's cover paragraphs and section properties, replaces
the placeholder body with written content, and applies the formatting the
brief requires (Arial 12 pt, 1.5 line spacing) to every paragraph.

Output: PROG2002 A2 Report - COMPLETED.docx
"""
import zipfile, re, shutil, os

SRC = r'C:\Users\11757\Desktop\liangyuez\PROG2002 A2 Report.docx'
DST = r'C:\Users\11757\Desktop\liangyuez\PROG2002 A2 Report - COMPLETED.docx'

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
      'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" '
      'xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" '
      'xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml"')

ARIAL = '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>'
LINE15 = '<w:spacing w:after="120" w:line="360" w:lineRule="auto"/>'


def esc(text):
    """Escapes character data. Quotes are left alone so the text stays readable."""
    return (text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def esc_attr(text):
    """Escapes a value that will be placed inside a double-quoted XML attribute."""
    return esc(text).replace('"', '&quot;')


def runs(text):
    """Splits on **bold** markers and produces one <w:r> per fragment."""
    out = []
    for i, part in enumerate(re.split(r'\*\*', text)):
        if part == '':
            continue
        bold = '<w:b/>' if i % 2 == 1 else ''
        out.append(
            f'<w:r><w:rPr>{ARIAL}{bold}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>'
            f'<w:t xml:space="preserve">{esc(part)}</w:t></w:r>'
        )
    return ''.join(out)


def h1(text):
    return (f'<w:p><w:pPr>{LINE15}<w:keepNext/>'
            f'<w:rPr>{ARIAL}<w:b/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr></w:pPr>'
            f'<w:r><w:rPr>{ARIAL}<w:b/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr>'
            f'<w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>')


def h2(text):
    return (f'<w:p><w:pPr>{LINE15}<w:keepNext/>'
            f'<w:rPr>{ARIAL}<w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:pPr>'
            f'<w:r><w:rPr>{ARIAL}<w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr>'
            f'<w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>')


def h3(text):
    return (f'<w:p><w:pPr>{LINE15}<w:keepNext/>'
            f'<w:rPr>{ARIAL}<w:b/><w:i/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr>'
            f'<w:r><w:rPr>{ARIAL}<w:b/><w:i/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>'
            f'<w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>')


def p(text, after=120):
    return (f'<w:p><w:pPr><w:spacing w:after="{after}" w:line="360" w:lineRule="auto"/>'
            f'<w:rPr>{ARIAL}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr>'
            f'{runs(text)}</w:p>')


def bullet(text, level=0):
    return (f'<w:p><w:pPr><w:pStyle w:val="ListParagraph"/>'
            f'<w:numPr><w:ilvl w:val="{level}"/><w:numId w:val="1"/></w:numPr>'
            f'<w:spacing w:after="60" w:line="360" w:lineRule="auto"/>'
            f'<w:rPr>{ARIAL}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr>'
            f'{runs(text)}</w:p>')


def spacer():
    return (f'<w:p><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/>'
            f'<w:rPr>{ARIAL}<w:sz w:val="24"/></w:rPr></w:pPr></w:p>')


def pagebreak():
    return ('<w:p><w:pPr><w:spacing w:after="0"/></w:pPr>'
            '<w:r><w:br w:type="page"/></w:r></w:p>')


def code(lines):
    """Monospaced, shaded block for SQL / JSON / code excerpts."""
    out = []
    for line in lines:
        out.append(
            '<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/>'
            '<w:shd w:val="clear" w:color="auto" w:fill="F2F5F8"/>'
            '<w:ind w:left="200" w:right="200"/>'
            '<w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>'
            '<w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr></w:pPr>'
            '<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>'
            '<w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr>'
            f'<w:t xml:space="preserve">{esc(line) if line else " "}</w:t></w:r></w:p>'
        )
    return ''.join(out)


def cell(text, width, bold=False, fill=None, mono=False):
    b = '<w:b/>' if bold else ''
    shd = f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>' if fill else ''
    font = ('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>' if mono
            else ARIAL)
    size = '19' if mono else '21'
    return (
        f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>{shd}'
        '<w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="90" w:type="dxa"/>'
        '<w:bottom w:w="60" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tcMar>'
        '<w:vAlign w:val="top"/></w:tcPr>'
        f'<w:p><w:pPr><w:spacing w:after="40" w:line="240" w:lineRule="auto"/>'
        f'<w:rPr>{font}{b}<w:sz w:val="{size}"/><w:szCs w:val="{size}"/></w:rPr></w:pPr>'
        f'<w:r><w:rPr>{font}{b}<w:sz w:val="{size}"/><w:szCs w:val="{size}"/></w:rPr>'
        f'<w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p></w:tc>'
    )


def table(headers, rows, widths, mono_cols=()):
    grid = ''.join(f'<w:gridCol w:w="{w}"/>' for w in widths)
    borders = ('<w:tblBorders>'
               '<w:top w:val="single" w:sz="6" w:color="9AAAB8"/>'
               '<w:left w:val="single" w:sz="6" w:color="9AAAB8"/>'
               '<w:bottom w:val="single" w:sz="6" w:color="9AAAB8"/>'
               '<w:right w:val="single" w:sz="6" w:color="9AAAB8"/>'
               '<w:insideH w:val="single" w:sz="4" w:color="C4D0DA"/>'
               '<w:insideV w:val="single" w:sz="4" w:color="C4D0DA"/>'
               '</w:tblBorders>')
    out = [f'<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>{borders}'
           '<w:tblLayout w:type="fixed"/></w:tblPr>'
           f'<w:tblGrid>{grid}</w:tblGrid>']
    out.append('<w:tr><w:trPr><w:tblHeader/></w:trPr>' +
               ''.join(cell(h, widths[i], bold=True, fill="E4EBF1")
                       for i, h in enumerate(headers)) + '</w:tr>')
    for row in rows:
        out.append('<w:tr>' + ''.join(
            cell(value, widths[i], mono=(i in mono_cols))
            for i, value in enumerate(row)) + '</w:tr>')
    out.append('</w:tbl>')
    out.append(spacer())
    return ''.join(out)


def callout(title, body):
    """Single-cell shaded box used for figures / diagrams."""
    return (
        '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>'
        '<w:tblBorders>'
        '<w:top w:val="dashed" w:sz="6" w:color="8FA6B8"/>'
        '<w:left w:val="dashed" w:sz="6" w:color="8FA6B8"/>'
        '<w:bottom w:val="dashed" w:sz="6" w:color="8FA6B8"/>'
        '<w:right w:val="dashed" w:sz="6" w:color="8FA6B8"/>'
        '</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>'
        '<w:tblGrid><w:gridCol w:w="9026"/></w:tblGrid><w:tr>'
        '<w:tc><w:tcPr><w:tcW w:w="9026" w:type="dxa"/>'
        '<w:shd w:val="clear" w:color="auto" w:fill="F7FAFC"/>'
        '<w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/>'
        '<w:bottom w:w="120" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar>'
        '</w:tcPr>'
        f'<w:p><w:pPr><w:spacing w:after="80" w:line="240" w:lineRule="auto"/>'
        f'<w:rPr>{ARIAL}<w:b/><w:sz w:val="21"/></w:rPr></w:pPr>'
        f'<w:r><w:rPr>{ARIAL}<w:b/><w:sz w:val="21"/></w:rPr>'
        f'<w:t xml:space="preserve">{esc(title)}</w:t></w:r></w:p>'
        + ''.join(
            '<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/>'
            '<w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr></w:pPr>'
            '<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr>'
            f'<w:t xml:space="preserve">{esc(line) if line else " "}</w:t></w:r></w:p>'
            for line in body)
        + '</w:tc></w:tr></w:tbl>' + spacer()
    )
