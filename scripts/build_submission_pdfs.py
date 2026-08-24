from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    CondPageBreak,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
CASE_MD = ROOT / "CASE_STUDY_RESPONSE.md"
PROCESS_MD = ROOT / "PROCESS_NOTES.md"
SOCIAL_IMAGE = ROOT / "social" / "madlen-pyp-unit-planner-social-post-1080.png"

CASE_PDF = OUTPUT_DIR / "Madlen_Growth_Intern_Case_Study_Response.pdf"
PROCESS_PDF = OUTPUT_DIR / "Madlen_Process_Notes_One_Page.pdf"

ORANGE = colors.HexColor("#C2541B")
ORANGE_LIGHT = colors.HexColor("#F7E4D2")
CREAM = colors.HexColor("#FBF6ED")
INK = colors.HexColor("#292721")
INK_MUTED = colors.HexColor("#625E54")
SAGE = colors.HexColor("#48634C")
SAGE_LIGHT = colors.HexColor("#E5ECE2")
LINE = colors.HexColor("#E7D8C5")
WHITE = colors.white


def register_fonts() -> tuple[str, str, str, str]:
    candidates = {
        "Body": Path(r"C:\Windows\Fonts\arial.ttf"),
        "BodyBold": Path(r"C:\Windows\Fonts\arialbd.ttf"),
        "Display": Path(r"C:\Windows\Fonts\georgia.ttf"),
        "DisplayBold": Path(r"C:\Windows\Fonts\georgiab.ttf"),
    }
    if all(path.exists() for path in candidates.values()):
        for name, path in candidates.items():
            pdfmetrics.registerFont(TTFont(name, str(path)))
        return "Body", "BodyBold", "Display", "DisplayBold"
    return "Helvetica", "Helvetica-Bold", "Times-Roman", "Times-Bold"


BODY_FONT, BODY_BOLD, DISPLAY_FONT, DISPLAY_BOLD = register_fonts()


def make_styles(compact: bool = False):
    base = getSampleStyleSheet()
    body_size = 8.3 if compact else 9.1
    leading = 11.0 if compact else 12.4
    return {
        "body": ParagraphStyle(
            "BodyCustom",
            parent=base["BodyText"],
            fontName=BODY_FONT,
            fontSize=body_size,
            leading=leading,
            textColor=INK,
            spaceAfter=5.5 if compact else 7,
            allowWidows=0,
            allowOrphans=0,
        ),
        "h1": ParagraphStyle(
            "H1Custom",
            parent=base["Heading1"],
            fontName=DISPLAY_BOLD,
            fontSize=23,
            leading=27,
            textColor=INK,
            spaceBefore=0,
            spaceAfter=13,
        ),
        "h2": ParagraphStyle(
            "H2Custom",
            parent=base["Heading2"],
            fontName=DISPLAY_BOLD,
            fontSize=16 if not compact else 13,
            leading=19 if not compact else 15,
            textColor=ORANGE,
            spaceBefore=9 if not compact else 5,
            spaceAfter=8 if not compact else 4,
            keepWithNext=1,
        ),
        "h3": ParagraphStyle(
            "H3Custom",
            parent=base["Heading3"],
            fontName=BODY_BOLD,
            fontSize=10.7 if not compact else 9.5,
            leading=13 if not compact else 11,
            textColor=SAGE,
            spaceBefore=7 if not compact else 3,
            spaceAfter=4,
            keepWithNext=1,
        ),
        "small": ParagraphStyle(
            "SmallCustom",
            parent=base["BodyText"],
            fontName=BODY_FONT,
            fontSize=7.2,
            leading=9.1,
            textColor=INK_MUTED,
        ),
        "table": ParagraphStyle(
            "TableCustom",
            parent=base["BodyText"],
            fontName=BODY_FONT,
            fontSize=7.15,
            leading=9.0,
            textColor=INK,
        ),
        "table_head": ParagraphStyle(
            "TableHeadCustom",
            parent=base["BodyText"],
            fontName=BODY_BOLD,
            fontSize=7.2,
            leading=8.8,
            textColor=WHITE,
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle",
            parent=base["Title"],
            fontName=DISPLAY_BOLD,
            fontSize=30,
            leading=34,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=13,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle",
            parent=base["BodyText"],
            fontName=BODY_FONT,
            fontSize=11,
            leading=15,
            textColor=INK_MUTED,
            spaceAfter=15,
        ),
        "quote": ParagraphStyle(
            "QuoteCustom",
            parent=base["BodyText"],
            fontName=DISPLAY_FONT,
            fontSize=12.5,
            leading=17,
            textColor=SAGE,
            leftIndent=12,
            borderColor=ORANGE,
            borderWidth=2,
            borderPadding=(4, 0, 4, 12),
            spaceBefore=8,
            spaceAfter=12,
        ),
    }


def inline_markup(text: str) -> str:
    text = text.replace(" - ", " - ")
    protected: list[str] = []

    def protect_link(match: re.Match[str]) -> str:
        label, url = match.group(1), match.group(2)
        token = f"@@LINK{len(protected)}@@"
        protected.append(f'<a href="{html.escape(url, quote=True)}" color="#C2541B"><u>{html.escape(label)}</u></a>')
        return token

    text = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", protect_link, text)
    text = html.escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`([^`]+)`", rf'<font name="{BODY_BOLD}">\1</font>', text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", text)
    for index, link in enumerate(protected):
        text = text.replace(f"@@LINK{index}@@", link)
    return text


def parse_table(lines: list[str], start: int, styles, available_width: float):
    rows: list[list[str]] = []
    index = start
    while index < len(lines) and lines[index].strip().startswith("|"):
        row = [cell.strip() for cell in lines[index].strip().strip("|").split("|")]
        rows.append(row)
        index += 1
    if len(rows) < 2:
        return [], start + 1
    rows.pop(1)
    cols = len(rows[0])
    if cols == 2:
        widths = [available_width * 0.30, available_width * 0.70]
    elif cols == 3:
        widths = [available_width * 0.28, available_width * 0.25, available_width * 0.47]
    elif cols == 4:
        widths = [available_width * 0.18, available_width * 0.37, available_width * 0.14, available_width * 0.31]
    else:
        widths = [available_width / cols] * cols
    data = []
    for row_index, row in enumerate(rows):
        style = styles["table_head"] if row_index == 0 else styles["table"]
        data.append([Paragraph(inline_markup(cell), style) for cell in row])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), SAGE),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("BACKGROUND", (0, 1), (-1, -1), WHITE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, CREAM]),
                ("GRID", (0, 0), (-1, -1), 0.45, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return [Spacer(1, 3), KeepTogether([table]), Spacer(1, 8)], index


def markdown_flowables(path: Path, styles, available_width: float, include_social: bool = False):
    lines = path.read_text(encoding="utf-8").splitlines()
    story = []
    i = 0
    first_title_skipped = False
    while i < len(lines):
        raw = lines[i].rstrip()
        stripped = raw.strip()
        if not stripped:
            i += 1
            continue
        if stripped.startswith("# ") and not first_title_skipped:
            first_title_skipped = True
            i += 1
            continue
        if stripped.startswith("## "):
            heading = stripped[3:]
            if re.match(r"[1-5]\.", heading):
                story.append(CondPageBreak(220 * mm))
            else:
                story.append(CondPageBreak(35 * mm))
            story.append(Paragraph(inline_markup(heading), styles["h2"]))
            i += 1
            continue
        if stripped.startswith("#### "):
            story.append(Paragraph(inline_markup(stripped[5:]), styles["h3"]))
            i += 1
            continue
        if stripped.startswith("### "):
            story.append(Paragraph(inline_markup(stripped[4:]), styles["h3"]))
            i += 1
            continue
        if stripped.startswith("|") and i + 1 < len(lines) and re.match(r"^\|?\s*:?-+", lines[i + 1].strip()):
            table_flow, i = parse_table(lines, i, styles, available_width)
            story.extend(table_flow)
            continue
        if stripped.startswith("- "):
            items = []
            while i < len(lines) and lines[i].strip().startswith("- "):
                items.append(
                    ListItem(
                        Paragraph(inline_markup(lines[i].strip()[2:]), styles["body"]),
                        leftIndent=10,
                    )
                )
                i += 1
            story.append(ListFlowable(items, bulletType="bullet", leftIndent=15, bulletFontName=BODY_FONT, bulletFontSize=6))
            story.append(Spacer(1, 3))
            continue
        if re.match(r"^\d+\.\s", stripped):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s", lines[i].strip()):
                content = re.sub(r"^\d+\.\s+", "", lines[i].strip())
                items.append(ListItem(Paragraph(inline_markup(content), styles["body"]), leftIndent=12))
                i += 1
            story.append(ListFlowable(items, bulletType="1", leftIndent=20, bulletFontName=BODY_BOLD, bulletFontSize=7.5))
            story.append(Spacer(1, 3))
            continue
        if include_social and stripped.startswith("**Final asset:**"):
            story.append(Paragraph(inline_markup(stripped), styles["body"]))
            story.append(Spacer(1, 8))
            story.append(Image(str(SOCIAL_IMAGE), width=118 * mm, height=118 * mm, hAlign="CENTER"))
            story.append(Paragraph("Final 1080 x 1080 social creative", styles["small"]))
            i += 1
            continue
        paragraph_lines = [stripped]
        i += 1
        while i < len(lines):
            candidate = lines[i].strip()
            if not candidate or candidate.startswith(("#", "- ", "|")) or re.match(r"^\d+\.\s", candidate):
                break
            paragraph_lines.append(candidate)
            i += 1
        text = " ".join(paragraph_lines)
        style = styles["quote"] if text.startswith("**Madlen turns") else styles["body"]
        story.append(Paragraph(inline_markup(text), style))
    return story


def draw_case_cover(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setStrokeColor(ORANGE)
    canvas.setLineWidth(1.2)
    canvas.roundRect(18 * mm, 18 * mm, width - 36 * mm, height - 36 * mm, 5 * mm, fill=0, stroke=1)
    canvas.setFont(BODY_BOLD, 20)
    canvas.setFillColor(ORANGE)
    canvas.drawString(24 * mm, height - 29 * mm, "madlen")
    canvas.setFont(BODY_BOLD, 7.5)
    canvas.setFillColor(INK_MUTED)
    canvas.drawRightString(width - 24 * mm, height - 27 * mm, "CANDIDATE CASE STUDY")
    canvas.setFont(BODY_FONT, 7.5)
    canvas.drawRightString(width - 24 * mm, 24 * mm, "24 AUGUST 2026")
    canvas.restoreState()


def draw_regular_page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, height - 17 * mm, width - 18 * mm, height - 17 * mm)
    canvas.setFont(BODY_BOLD, 7.2)
    canvas.setFillColor(ORANGE)
    canvas.drawString(18 * mm, height - 13 * mm, "MADLEN")
    canvas.setFillColor(INK_MUTED)
    canvas.drawRightString(width - 18 * mm, height - 13 * mm, "GROWTH INTERN CASE STUDY")
    canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
    canvas.setFont(BODY_FONT, 6.8)
    canvas.drawString(18 * mm, 9.5 * mm, "madlen-learning-loop-candidate.netlify.app")
    canvas.drawRightString(width - 18 * mm, 9.5 * mm, str(doc.page))
    canvas.restoreState()


def build_case_pdf():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    styles = make_styles(compact=False)
    margin = 18 * mm
    doc = SimpleDocTemplate(
        str(CASE_PDF),
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=22 * mm,
        bottomMargin=19 * mm,
        title="Madlen Growth Intern Case Study - Strategic Response",
        author="Candidate Prototype",
    )
    story = [
        Spacer(1, 49 * mm),
        Paragraph("GROWTH INTERN CASE STUDY", styles["h3"]),
        Paragraph("A defensible growth story,<br/>made tangible.", styles["cover_title"]),
        Paragraph(
            "Competitive analysis · Unique value proposition · 30-Day Classroom Proof Pilot · "
            "AI mini-product prototype · PYP Unit Planner social campaign",
            styles["cover_subtitle"],
        ),
        Spacer(1, 4 * mm),
        Table(
            [
                [Paragraph("LIVE PROTOTYPE", styles["table_head"]), Paragraph("SOURCE", styles["table_head"])],
                [
                    Paragraph('<a href="https://madlen-learning-loop-candidate.netlify.app" color="#C2541B"><u>Open public application</u></a>', styles["table"]),
                    Paragraph('<a href="https://github.com/cotkdms2k32/madlen-learning-loop-candidate" color="#C2541B"><u>View GitHub repository</u></a>', styles["table"]),
                ],
            ],
            colWidths=[78 * mm, 78 * mm],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), SAGE),
                    ("BACKGROUND", (0, 1), (-1, 1), WHITE),
                    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            ),
        ),
        Spacer(1, 17 * mm),
        Paragraph(
            "Core recommendation: compete on a curriculum-aware learning journey, not on tool count.",
            styles["quote"],
        ),
        PageBreak(),
    ]
    story.extend(markdown_flowables(CASE_MD, styles, A4[0] - 2 * margin, include_social=True))
    doc.build(story, onFirstPage=draw_case_cover, onLaterPages=draw_regular_page)


def draw_process_page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(ORANGE)
    canvas.rect(0, height - 12 * mm, width, 12 * mm, fill=1, stroke=0)
    canvas.setFont(BODY_BOLD, 7.5)
    canvas.setFillColor(WHITE)
    canvas.drawString(17 * mm, height - 7.8 * mm, "MADLEN · CANDIDATE PROTOTYPE")
    canvas.setStrokeColor(LINE)
    canvas.line(17 * mm, 13 * mm, width - 17 * mm, 13 * mm)
    canvas.setFont(BODY_FONT, 6.8)
    canvas.setFillColor(INK_MUTED)
    canvas.drawString(17 * mm, 8.5 * mm, "Process document · 1 page")
    canvas.drawRightString(width - 17 * mm, 8.5 * mm, "1 / 1")
    canvas.restoreState()


def build_process_pdf():
    styles = make_styles(compact=True)
    margin = 17 * mm
    doc = SimpleDocTemplate(
        str(PROCESS_PDF),
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=20 * mm,
        bottomMargin=17 * mm,
        title="Madlen Learning Loop - Process Notes",
        author="Candidate Prototype",
    )
    story = [Paragraph("Process Notes - Madlen Learning Loop", styles["h1"]), Spacer(1, 1 * mm)]
    story.extend(markdown_flowables(PROCESS_MD, styles, A4[0] - 2 * margin, include_social=False))
    doc.build(story, onFirstPage=draw_process_page, onLaterPages=draw_process_page)


if __name__ == "__main__":
    build_case_pdf()
    build_process_pdf()
    print(CASE_PDF)
    print(PROCESS_PDF)
