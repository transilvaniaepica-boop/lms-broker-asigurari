import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def create_doc_1():
    doc = docx.Document()
    
    # Margini
    for s in doc.sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)
        
    # Header Antet
    p_hdr = doc.add_paragraph()
    p_hdr.paragraph_format.space_after = Pt(2)
    r1 = p_hdr.add_run("PROFESSIONAL BROKER DE ASIGURARE S.R.L.\n")
    r1.bold = True
    r1.font.size = Pt(11)
    r1.font.color.rgb = RGBColor(12, 74, 110)
    
    r2 = p_hdr.add_run("Sediu Social: Mun. Sibiu, Str. Gheorghe Dima, Nr. 11, Parter, Ap. 1, Jud. Sibiu\nCUI: 16885685 | Nr. Reg. Com.: J32/1614/2004 | Cod Intermediar ASF: RBK-240")
    r2.font.size = Pt(8.5)
    r2.font.color.rgb = RGBColor(100, 116, 139)
    
    # Linie orizontala
    p_line = doc.add_paragraph()
    p_line.paragraph_format.space_after = Pt(14)
    p_line_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="1" w:color="0284C7"/></w:pBdr>')
    p_line._p.get_or_add_pPr().append(p_line_border)
    
    # Nr Inregistrare
    p_nr = doc.add_paragraph("Nr. Înreg.: 104 / 15.10.2026")
    p_nr.runs[0].font.size = Pt(9.5)
    p_nr.runs[0].bold = True
    
    # Destinatar
    table_to = doc.add_table(rows=2, cols=2)
    table_to.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_to.autofit = False
    
    hdr_cells = table_to.rows[0].cells
    hdr_cells[0].text = "CĂTRE:"
    hdr_cells[0].paragraphs[0].runs[0].bold = True
    hdr_cells[1].text = "Conducerea Executivă – În atenția Dlui. Ioan RUCĂREAN,\nDirector Executiv & Persoană Desemnată SBFT/AML"
    
    row2_cells = table_to.rows[1].cells
    row2_cells[0].text = "DE LA:"
    row2_cells[0].paragraphs[0].runs[0].bold = True
    row2_cells[1].text = "Stoicef ZLATI, Ofițer de Conformitate (Compliance Officer)"
    
    for row in table_to.rows:
        for cell in row.cells:
            set_cell_background(cell, "F8FAFC")
            cell.paragraphs[0].runs[0].font.size = Pt(9.5)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # Titlu
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(4)
    r_t = p_title.add_run("NOTĂ INTERNĂ / SOLICITARE")
    r_t.bold = True
    r_t.font.size = Pt(14)
    r_t.font.color.rgb = RGBColor(12, 74, 110)
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(14)
    r_s = p_sub.add_run("Privind: Propunerea de digitalizare, eficientizare și gestionare internă a procesului anual de instruire și examinare periodică SBFT/AML prin intermediul unei aplicații web dedicate (Full-Stack LMS Asigurări)")
    r_s.italic = True
    r_s.font.size = Pt(10)
    r_s.font.color.rgb = RGBColor(71, 85, 105)
    
    # Corp Document
    p1 = doc.add_paragraph()
    p1.paragraph_format.space_after = Pt(8)
    p1.paragraph_format.line_spacing = 1.15
    p1.add_run("Stimate Domnule Director Executiv,\n\nÎn calitatea mea de Ofițer de Conformitate al PROFESSIONAL BROKER DE ASIGURARE S.R.L., având în vedere obligațiile legale stricte ce ne revin în temeiul Legii nr. 129/2019 (art. 24), al Normei ASF nr. 13/2019 privind evaluarea riscurilor și cerințele de pregătire profesională continuă, precum și necesitatea asigurării unei piste de audit electronice pe o perioadă de minimum 10 ani, vă înaintez prezenta propunere prin care vă solicit aprobarea dezvoltării și implementării unei platforme interne de instruire și examinare online (LMS - Learning Management System), pe care mă angajez să o gestionez direct în calitate de Lector și Administrator tehnic.")
    
    p_f = doc.add_paragraph()
    p_f.paragraph_format.space_after = Pt(6)
    r_f = p_f.add_run("Descrierea Funcționalităților Aplicației Propuse:")
    r_f.bold = True
    r_f.font.size = Pt(11)
    r_f.font.color.rgb = RGBColor(2, 132, 199)
    
    points = [
        ("Controlul Securizat al Accesului (RBAC cu 4 roluri): ", "Separare completă între fluxul Angajaților (sediu) și cel al Colaboratorilor (agenți de teren). Panou dedicat de Lector Formator pentru administrare și panou Read-Only de Observator Audit pentru controalele ASF/audit extern."),
        ("Procesarea Integrală a Procedurilor (100% Text Păstrat): ", "Transformarea automată a procedurilor PDF/Word în module didactice fără rezumare sau omisiuni de articole, organizate estetic pe pagini (pag. 1, pag. 2) cu titluri boldate și fundal translucid."),
        ("Modul de Examinare & Prag 70%: ", "Generarea a 12 întrebări grilă distincte, ușoare, formulate strict din procedură, cu prag de promovare de minimum 9 răspunsuri corecte (70%). Posibilitate de reluare imediată nelimitată cu amestecarea întrebărilor în caz de eșec."),
        ("Săli Virtuale Live & Chat Q&A: ", "Monitorizarea prezenței în timp real prin WebSockets (Socket.io) și mesagerie integrată, cu alerte email automate prin Resend către Lector când cursanții adresează întrebări offline."),
        ("Gestiune Utilizatori & Blocare Fără Ștergere: ", "Import masiv din fișiere Excel cu trimiterea automată a parolelor inițiale prin Resend. Posibilitate de ascundere translucidă a cursurilor vechi și blocare a accesului utilizatorilor fără ștergerea istoricului."),
        ("Retenție pe 10 Ani & Rapoarte Excel: ", "Toate încercările la teste, timpii de studiu și logurile sunt păstrate garantat 10 ani în PostgreSQL, cu export direct în format Excel (.xlsx) pentru audit."),
        ("Automatizare Anuală la 1 Decembrie: ", "Scanare AI anuală a modificărilor legislative din România (Legea 129/2019, Norme ASF, Legea 236/2018, GDPR) și generarea automată a proiectelor de proceduri pentru noul an calendaristic.")
    ]
    
    for title, desc in points:
        p_pt = doc.add_paragraph()
        p_pt.paragraph_format.left_indent = Inches(0.25)
        p_pt.paragraph_format.space_after = Pt(4)
        p_pt.paragraph_format.line_spacing = 1.15
        r_pt1 = p_pt.add_run("• " + title)
        r_pt1.bold = True
        r_pt1.font.size = Pt(9.5)
        r_pt2 = p_pt.add_run(desc)
        r_pt2.font.size = Pt(9.5)
        
    p_end = doc.add_paragraph()
    p_end.paragraph_format.space_before = Pt(8)
    p_end.paragraph_format.space_after = Pt(16)
    p_end.paragraph_format.line_spacing = 1.15
    p_end.add_run("Adoptarea acestei soluții dezvoltate intern va reduce la zero costurile de logistică fizică, va garanta instruirea a 100% din personalul rețelei și ne va asigura un dosar electronic de conformitate inatacabil în fața autorităților de reglementare.\n\nCu deosebită stimă,")
    
    p_sign = doc.add_paragraph()
    p_sign.add_run("Stoicef ZLATI\nOfițer de Conformitate (Compliance Officer)\nPROFESSIONAL BROKER DE ASIGURARE S.R.L.").bold = True
    p_sign.runs[0].font.size = Pt(10)
    
    doc.save("1_Solicitare_Ofiter_Conformitate_Stoicef_Zlati.docx")

def create_doc_2():
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)
        
    p_hdr = doc.add_paragraph()
    p_hdr.paragraph_format.space_after = Pt(2)
    r1 = p_hdr.add_run("PROFESSIONAL BROKER DE ASIGURARE S.R.L.\n")
    r1.bold = True
    r1.font.size = Pt(11)
    r1.font.color.rgb = RGBColor(12, 74, 110)
    r2 = p_hdr.add_run("Sediu Social: Mun. Sibiu, Str. Gheorghe Dima, Nr. 11, Parter, Ap. 1, Jud. Sibiu\nCUI: 16885685 | Nr. Reg. Com.: J32/1614/2004 | Cod Intermediar ASF: RBK-240")
    r2.font.size = Pt(8.5)
    r2.font.color.rgb = RGBColor(100, 116, 139)
    
    p_line = doc.add_paragraph()
    p_line.paragraph_format.space_after = Pt(14)
    p_line_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="1" w:color="0284C7"/></w:pBdr>')
    p_line._p.get_or_add_pPr().append(p_line_border)
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(2)
    r_t = p_title.add_run("DECIZIA ADMINISTRATORULUI / DIRECTORULUI EXECUTIV")
    r_t.bold = True
    r_t.font.size = Pt(13)
    r_t.font.color.rgb = RGBColor(12, 74, 110)
    
    p_nr = doc.add_paragraph("Nr. 48 din data de 20.10.2026")
    p_nr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_nr.paragraph_format.space_after = Pt(12)
    p_nr.runs[0].bold = True
    p_nr.runs[0].font.size = Pt(10)
    
    p_body = doc.add_paragraph()
    p_body.paragraph_format.space_after = Pt(8)
    p_body.paragraph_format.line_spacing = 1.15
    p_body.add_run("Subsemnatul, Ioan RUCĂREAN, în calitate de Director Executiv și Persoană Desemnată în relația cu Oficiul Național de Prevenire și Combatere a Spălării Banilor (ONPCSB) și Autoritatea de Supraveghere Financiară (ASF) în cadrul PROFESSIONAL BROKER DE ASIGURARE S.R.L.,\n\nAvând în vedere prevederile art. 24 alin. (1) din Legea nr. 129/2019, dispozițiile Normei ASF nr. 13/2019 și Normei ASF nr. 19/2018, precum și solicitarea înregistrată sub nr. 104/15.10.2026 înaintată de dl. Stoicef Zlati, Ofițer de Conformitate, privind digitalizarea instruirii periodice și asigurarea retenției datelor de audit pe 10 ani,")
    
    p_dec = doc.add_paragraph()
    p_dec.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dec.paragraph_format.space_after = Pt(8)
    r_d = p_dec.add_run("DECID:")
    r_d.bold = True
    r_d.font.size = Pt(12)
    
    articles = [
        ("Art. 1. ", "Se aprobă demararea proiectului intern de dezvoltare a platformei digitale de învățare și examinare periodică, denumită „LMS Asigurări – Professional Broker”, destinată instruirii obligatorii a personalului propriu (sediu central și puncte de lucru) și a rețelei naționale de asistenți în brokeraj/colaboratori."),
        ("Art. 2. ", "Aplicația solicitată va fi construită ca un sistem web Full-Stack modern, găzduit în cloud pe Render cu bază de date PostgreSQL, respectând următoarele specificații obligatorii:\n"
                     "a) Securitate RBAC cu separarea fluxurilor pentru Angajați și Colaboratori, panou Lector și panou Observator Audit (Read-Only);\n"
                     "b) Preluarea integrală a textului procedurilor interne (100% din conținut păstrat, fără rezumare), structurat didactic pe pagini (pag. 1, pag. 2 etc.) cu titluri boldate și fundal translucid;\n"
                     "c) Modul de examinare de 12 întrebări grilă cu prag de promovare de minimum 70% (9 răspunsuri corecte), cu posibilitatea retestării imediate nelimitate în caz de respingere;\n"
                     "d) Sală virtuală de curs cu prezență live (Socket.io) și chat asincron cu alerte email prin Resend API;\n"
                     "e) Retenția garantată a tuturor încercărilor de test, sesiunilor de studiu și logurilor de audit pe o perioadă de minimum 10 ani, cu rapoarte exportabile în format Excel;\n"
                     "f) Scheduler automat pentru data de 1 Decembrie a fiecărui an, destinat scanării modificărilor legislative (Legea 129/2019, Norme ASF, GDPR) și pregătirii procedurilor pentru noul an."),
        ("Art. 3. ", "Se desemnează dl. Stoicef Zlati, Ofițer de Conformitate, ca responsabil de proiect pentru supervizarea dezvoltării, configurarea fluxurilor didactice și calibrarea cerințelor de conformitate."),
        ("Art. 4. ", "Prezenta decizie se comunică responsabilului de proiect și se consemnează în registrul de decizii al societății.")
    ]
    
    for art, text in articles:
        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_after = Pt(6)
        p_a.paragraph_format.line_spacing = 1.15
        r_a1 = p_a.add_run(art)
        r_a1.bold = True
        p_a.add_run(text)
        
    p_sign = doc.add_paragraph()
    p_sign.paragraph_format.space_before = Pt(14)
    p_sign.add_run("Ioan RUCĂREAN\nDirector Executiv & Persoană Desemnată SBFT/AML\nPROFESSIONAL BROKER DE ASIGURARE S.R.L.").bold = True
    
    doc.save("2_Decizie_Administrator_Solicitare_Creare_LMS.docx")

def create_doc_3():
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)
        
    p_hdr = doc.add_paragraph()
    p_hdr.paragraph_format.space_after = Pt(2)
    r1 = p_hdr.add_run("PROFESSIONAL BROKER DE ASIGURARE S.R.L.\n")
    r1.bold = True
    r1.font.size = Pt(11)
    r1.font.color.rgb = RGBColor(12, 74, 110)
    r2 = p_hdr.add_run("Sediu Social: Mun. Sibiu, Str. Gheorghe Dima, Nr. 11, Parter, Ap. 1, Jud. Sibiu\nCUI: 16885685 | Nr. Reg. Com.: J32/1614/2004 | Cod Intermediar ASF: RBK-240")
    r2.font.size = Pt(8.5)
    r2.font.color.rgb = RGBColor(100, 116, 139)
    
    p_line = doc.add_paragraph()
    p_line.paragraph_format.space_after = Pt(14)
    p_line_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="1" w:color="0284C7"/></w:pBdr>')
    p_line._p.get_or_add_pPr().append(p_line_border)
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(2)
    r_t = p_title.add_run("HOTĂRÂREA ADMINISTRATORULUI / DIRECTORULUI EXECUTIV")
    r_t.bold = True
    r_t.font.size = Pt(13)
    r_t.font.color.rgb = RGBColor(12, 74, 110)
    
    p_nr = doc.add_paragraph("Nr. 52 din data de 24.11.2026")
    p_nr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_nr.paragraph_format.space_after = Pt(12)
    p_nr.runs[0].bold = True
    p_nr.runs[0].font.size = Pt(10)
    
    p_body = doc.add_paragraph()
    p_body.paragraph_format.space_after = Pt(8)
    p_body.paragraph_format.line_spacing = 1.15
    p_body.add_run("Subsemnatul, Ioan RUCĂREAN, în calitate de Director Executiv și Persoană Desemnată SBFT/AML al PROFESSIONAL BROKER DE ASIGURARE S.R.L.,\n\nLuând în considerare raportul de finalizare și recepție a aplicației informatice „LMS Asigurări – Professional Broker” prezentat de către dl. Stoicef Zlati, Ofițer de Conformitate, verificarea conformității tehnice și legislative a platformei cu cerințele Legii nr. 129/2019, Normei ASF nr. 13/2019 și Regulamentului (UE) 2016/679 (GDPR), precum și testarea cu succes a tuturor fluxurilor de instruire și examinare,")
    
    p_dec = doc.add_paragraph()
    p_dec.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dec.paragraph_format.space_after = Pt(8)
    r_d = p_dec.add_run("HOTĂRĂSC:")
    r_d.bold = True
    r_d.font.size = Pt(12)
    
    articles = [
        ("Art. 1. Aprobarea Oficială a Aplicației: ", "Se aprobă punerea în funcțiune în mediul de producție cloud (URL: https://asig-lms-app.onrender.com) a platformei „LMS Asigurări – Professional Broker” ca instrument unic și oficial al companiei pentru desfășurarea sesiunilor anuale și periodice de instruire și examinare profesională în domeniul Prevenirii și Combaterii Spălării Banilor și Finanțării Terorismului (SBFT/AML)."),
        ("Art. 2. Caracterul Obligatoriu al Examinării: ", "Începând cu data prezentei hotărâri, toți angajații societății cu atribuții operaționale, precum și toți asistenții în brokeraj (colaboratori persoane fizice sau juridice) au obligația de a parcurge anual cursul SBFT și de a promova examenul grilă asociat în termen de maximum 30 de zile de la alocarea credențialelor de acces."),
        ("Art. 3. Validarea Procedurii și Rezultatelor: ", "\n1. Promovarea examinării se atestă automat de către sistem la obținerea unui punctaj de cel puțin 70% (minimum 9 răspunsuri corecte din 12);\n2. Cursanții care obțin un scor sub 70% vor fi declarați „Respinși”, având dreptul și obligația de a relua testul până la promovare. Fiecare încercare, punctajul obținut, data și ora vor fi stocate permanent în baza de date."),
        ("Art. 4. Administrarea și Gestionarea Platformei: ", "Gestiunea completă a conținutului educațional, importul utilizatorilor, validarea testelor și emiterea rapoartelor de conformitate se încredințează d-lui Stoicef Zlati, în calitate de Lector Formator și Ofițer de Conformitate. Acesta are dreptul exclusiv de a valida procedurile, de a ascunde translucid cursurile din anii precedenți și de a bloca accesul utilizatorilor inactivi."),
        ("Art. 5. Pista de Audit și Arhivarea: ", "Evidențele electronice generate de platformă (durata de studiu monitorizată pe pagini, cataloagele de note, logurile de conectare și datele de audit) constituie documente justificative oficiale în relația cu ASF, ONPCSB și auditorii externi și vor fi păstrate în baza de date securizată pentru o perioadă de minimum 10 ani."),
        ("Art. 6. ", "Prezenta hotărâre intră în vigoare la data semnării și se aduce la cunoștința întregului personal și a colaboratorilor prin grija departamentului de conformitate.")
    ]
    
    for art, text in articles:
        p_a = doc.add_paragraph()
        p_a.paragraph_format.space_after = Pt(6)
        p_a.paragraph_format.line_spacing = 1.15
        r_a1 = p_a.add_run(art)
        r_a1.bold = True
        p_a.add_run(text)
        
    p_sign = doc.add_paragraph()
    p_sign.paragraph_format.space_before = Pt(14)
    p_sign.add_run("Emisă la Sibiu, astăzi, 24.11.2026.\n\nIoan RUCĂREAN\nDirector Executiv & Persoană Desemnată SBFT/AML\nPROFESSIONAL BROKER DE ASIGURARE S.R.L.").bold = True
    
    doc.save("3_Hotarare_Administrator_Aprobare_Utilizare_LMS.docx")

create_doc_1()
create_doc_2()
create_doc_3()
print("DOCX_GENERATED_SUCCESSFULLY")
