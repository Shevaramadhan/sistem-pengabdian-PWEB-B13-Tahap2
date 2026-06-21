const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Mock data matching the real database query result
const data = {
  id: 1,
  member_role: 'Anggota',
  status: 'approved',
  responded_at: new Date('2026-06-10T04:39:56.000Z'),
  created_at: new Date('2026-06-03T17:50:05.000Z'),
  service_title: 'Pengabdian Masyarakat Pengenalan AI',
  description: 'memberikan pengenalan kepada masyarakat tentang sebuah teknolofi informasi yg terlah berkembang pesat saat ini yaitu ai',
  start_date: new Date('2026-06-14T17:00:00.000Z'),
  end_date: null,
  location: 'Padang Pariaman, Nagari Pauh',
  funding_source: 'DIPA UNAND',
  creator_name: 'Dr. Sheva Ramadhan, M.Kom.',
  creator_nidn: '0001010001',
  creator_academic_rank: 'Asisten Ahli',
  member_name: 'Athaya Nasywa Mahira, S.T., M.T.',
  member_email: 'athaya@pengabdian.ac.id',
  member_nidn: '0001010002',
  member_academic_rank: 'Asisten Ahli'
};

async function testPdf() {
  try {
    // Set margins: bottom margin to 30 so that footer at height - 40 doesn't trigger page break
    const doc = new PDFDocument({ 
      size: "A4", 
      margins: { top: 50, bottom: 30, left: 50, right: 50 } 
    });
    const writeStream = fs.createWriteStream('scratch/test-singlepage.pdf');
    doc.pipe(writeStream);

    const isApproved = data.status === "approved";

    // 1. Logo area / Kop Surat
    const logoPath = path.join(__dirname, "../public/assets/images/logo-unand.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 42, { width: 55 });
    } else {
      doc.lineWidth(1.5).rect(50, 40, 55, 55).strokeColor("#000000").stroke();
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#008556").text("UA", 62, 58);
    }

    doc.fontSize(14).font("Helvetica-Bold").fillColor("#000000")
       .text("UNIVERSITAS ANDALAS", 120, 48, { align: "center", width: 410 });
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000")
       .text("Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)", 120, 67, { align: "center", width: 410 });
    doc.fontSize(8).font("Helvetica").fillColor("#374151")
       .text("Kampus Unand Limau Manis, Padang 25163 | lppm@unand.ac.id | lppm.unand.ac.id", 120, 85, { align: "center", width: 410 });

    doc.moveTo(50, 105).lineTo(545, 105).lineWidth(1.5).strokeColor("#000000").stroke();

    // 2. Title & Number
    const padId = String(data.id).padStart(3, "0");
    const year = new Date(data.created_at || new Date()).getFullYear();
    const docNumber = `${padId}/PKM-AI/KNY/VI/${year}`;

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#000000")
       .text(isApproved ? "SURAT PERNYATAAN KESEDIAAN KEANGGOTAAN" : "SURAT PERNYATAAN PENOLAKAN KEANGGOTAAN", 50, 120, { align: "center", width: 495 });
    doc.fontSize(9).font("Helvetica").fillColor("#000000")
       .text(`Nomor: ${docNumber}`, 50, 134, { align: "center", width: 495 });

    // 3. Opening text
    doc.fontSize(9.5).font("Helvetica").fillColor("#000000")
       .text("Yang bertanda tangan di bawah ini:", 50, 160);

    // 4. First Table (Member details) - Black & White
    const startY1 = 175;
    const rowHeight = 18;
    const labels = [
      ["Nama", data.member_name],
      ["NIP / NIDN", `— / ${data.member_nidn || "-"}`],
      ["Jabatan", `${data.member_academic_rank || "Dosen"} — Universitas Andalas`],
      ["Email", data.member_email || "-"]
    ];

    labels.forEach((row, i) => {
      const y = startY1 + (i * rowHeight);
      doc.rect(50, y, 495, rowHeight).lineWidth(0.5).strokeColor("#000000").stroke();
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000000").text(row[0], 60, y + 5);
      doc.font("Helvetica").fontSize(8.5).fillColor("#000000").text(`: ${row[1]}`, 170, y + 5);
    });

    // 5. Body Paragraph (Justified, word-spacing)
    const textY = startY1 + (labels.length * rowHeight) + 12;
    doc.fontSize(9.5).font("Helvetica").fillColor("#000000")
       .text("Dengan ini menyatakan ", 50, textY, { continued: true, align: "justify", width: 495, lineGap: 3 });

    if (isApproved) {
      doc.font("Helvetica-Bold").text("bersedia", { continued: true });
      doc.font("Helvetica").text(" menjadi anggota tim pelaksana kegiatan Pengabdian kepada Masyarakat berjudul ", { continued: true });
    } else {
      doc.font("Helvetica-Bold").text("tidak dapat menerima", { continued: true });
      doc.font("Helvetica").text(" undangan sebagai anggota tim pelaksana kegiatan Pengabdian kepada Masyarakat berjudul ", { continued: true });
    }

    doc.font("Helvetica-Bold").text(`"${data.service_title}"`, { continued: true });
    doc.font("Helvetica").text(" yang diketuai oleh ", { continued: true });
    doc.font("Helvetica-Bold").text(data.creator_name, { continued: true });

    if (isApproved) {
      doc.font("Helvetica").text(", dan siap menjalankan tugas sesuai ketentuan yang berlaku.");
    } else {
      doc.font("Helvetica").text(". Atas perhatian dan pengertian Ketua Pelaksana, disampaikan terima kasih.");
    }

    // 6. Second Table (Activity details) - Black & White, Decisions in black
    const startY2 = doc.y + 15;
    const startDateStr = data.start_date ? new Date(data.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";
    const endDateStr = data.end_date ? new Date(data.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : startDateStr;
    const periodStr = `${startDateStr} s.d. ${endDateStr}`;

    const activityFields = [
      ["Judul Kegiatan", data.service_title],
      ["Ketua Pelaksana", data.creator_name],
      ["Lokasi", data.location],
      ["Periode", periodStr],
      ["Skema", data.funding_source || "Reguler DIPA Universitas Andalas"],
      ["Keputusan", isApproved ? "BERSEDIA MENJADI ANGGOTA" : "MENOLAK UNDANGAN KEANGGOTAAN"]
    ];

    activityFields.forEach((row, i) => {
      const y = startY2 + (i * rowHeight);
      doc.rect(50, y, 495, rowHeight).lineWidth(0.5).strokeColor("#000000").stroke();
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000000").text(row[0], 60, y + 5);
      doc.font("Helvetica").fontSize(8.5).fillColor("#000000").text(`: ${row[1]}`, 170, y + 5);
    });

    // 7. Closing Text
    const startY3 = startY2 + (activityFields.length * rowHeight) + 12;
    doc.font("Helvetica").fontSize(9.5).fillColor("#000000")
       .text("Demikian surat pernyataan ini dibuat dengan sebenar-benarnya.", 50, startY3);

    // 8. Signatures (Single page layout)
    const signedDate = data.responded_at ? new Date(data.responded_at) : new Date();
    const signedDateStr = signedDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const placeDateStr = `Padang, ${signedDateStr}`;

    const sigY = startY3 + 30;
    const colWidth = 200;
    const leftX = 50;
    const rightX = 345;

    // Left Column
    doc.font("Helvetica").fontSize(9.5).fillColor("#000000")
       .text(placeDateStr, leftX, sigY, { width: colWidth, align: "center" })
       .text("Yang Menyatakan,", leftX, sigY + 14, { width: colWidth, align: "center" });
    doc.font("Helvetica-Bold")
       .text(data.member_name, leftX, sigY + 70, { width: colWidth, align: "center" });
    doc.font("Helvetica")
       .text(`NIP / NIDN. — / ${data.member_nidn || "-"}`, leftX, sigY + 84, { width: colWidth, align: "center" });

    // Right Column
    doc.font("Helvetica").fontSize(9.5).fillColor("#000000")
       .text(placeDateStr, rightX, sigY, { width: colWidth, align: "center" })
       .text("Ketua Pelaksana,", rightX, sigY + 14, { width: colWidth, align: "center" });
    doc.font("Helvetica-Bold")
       .text(data.creator_name, rightX, sigY + 70, { width: colWidth, align: "center" });
    doc.font("Helvetica")
       .text(`NIP / NIDN. — / ${data.creator_nidn || "-"}`, rightX, sigY + 84, { width: colWidth, align: "center" });

    // 9. Fine Print / Footer (Shifted up to be within limits, margins.bottom is 30)
    const footerY = doc.page.height - 40;
    doc.moveTo(50, footerY - 5).lineTo(545, footerY - 5).lineWidth(0.5).strokeColor("#cbd5e1").stroke();

    const printDateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "2-digit", year: "numeric" });
    const footerText = `Diterbitkan otomatis oleh Sistem Pengabdian Masyarakat Universitas Andalas | No. Dok: ${docNumber} | Dicetak: ${printDateStr} | Dokumen sah tanpa tanda tangan basah. Verifikasi: lppm.unand.ac.id`;
    doc.font("Helvetica").fontSize(7).fillColor("#94a3b8")
       .text(footerText, 50, footerY, { align: "center", width: 495 });

    doc.end();

    writeStream.on('finish', () => {
      console.log("PDF generation test finished successfully! Saved to scratch/test-singlepage.pdf");
      // Let's verify number of pages in the generated PDF
      // In pdfkit, doc.bufferedPageRange() returns total pages.
      // But we can check via pdf-reader or a simple search for "/Type /Page" count or skip it.
      process.exit(0);
    });
  } catch (err) {
    console.error("PDF generation test failed:", err);
    process.exit(1);
  }
}

testPdf();
