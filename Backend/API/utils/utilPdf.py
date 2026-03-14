from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from io import BytesIO

def generate_attendance_pdf(session, students) -> BytesIO:
    """
    Generate a professional attendance PDF as a BytesIO buffer.

    :param session: dict with session info
    :param students: list of dicts with student info
    :return: BytesIO object containing the PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = []
    styles = getSampleStyleSheet()

    # HEADER
    elements.append(Paragraph("Attendance Sheet", styles['Title']))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Class: {session.get('class_name', '')}", styles['Normal']))
    elements.append(Paragraph(f"Subject: {session.get('subject', '')}", styles['Normal']))
    elements.append(Paragraph(f"Teacher: {session.get('teacher_name', '')}", styles['Normal']))
    elements.append(Paragraph(f"Room: {session.get('room', '')}", styles['Normal']))
    elements.append(Paragraph(f"Time: {session.get('time', '')}", styles['Normal']))
    if session.get("endSession"):
        elements.append(Paragraph(f"End Time: {session.get('endSession', '')}", styles['Normal']))
    elements.append(Spacer(1, 12))

    # TABLE
    table_data = [["No", "Name", "Matricule", "Status"]]
    for idx, s in enumerate(students, start=1):
        status = "PRESENT" if s.get("present") else "ABSENT"
        table_data.append([str(idx), s.get("name", ""), s.get("matricule", ""), status])

    table = Table(table_data, colWidths=[40, 200, 100, 80])
    table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f1f5f9")),
        ])
    )
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)
    return buffer
