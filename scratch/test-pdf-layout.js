const fs = require('fs');
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
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const writeStream = fs.createWriteStream('scratch/test-layout.pdf');
    doc.pipe(writeStream);

    const isApproved = data.status === "approved";
    const accentColor = isApproved ? "#008556" : "#dc2626";

    // 1. Logo area / Kop Surat
    doc.lineWidth(1.5).rect(50, 50, 60, 60).strokeColor("#000000").stroke();
    
    // LPPM Logo mark representation
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#008556").text("UA", 62, 68);

    doc.fontSize(14).font("Helvetica-Bold").fillColor("#000000")
       .text("UNIVERSITAS ANDALAS", 120, 53, { align: "center", width: 410 });
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000")
       .text("Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)", 120, 72, { align: "center", width: 410 });
    doc.fontSize(8).font("Helvetica").fillColor("#374151")
       .text("Kampus Unand Limau Manis, Padang 25163 | lppm@unand.ac.id | lppm.unand.ac.id", 120, 90, { align: "center", width: 410 });

    doc.moveTo(50, 122).lineTo(545, 122).lineWidth(2).strokeColor("#000000").stroke();

    // 2. Title & Number
    const padId = String(data.id).padStart(3, "0");
    const year = new Date(data.created_at || new Date()).getFullYear();
    const docNumber = `${padId}/PKM-AI/KNY/VI/${year}`;

    doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000")
       .text(isApproved ? "SURAT PERNYATAAN KESEDIAAN KEANGGOTAAN" : "SURAT PERNYATAAN PENOLAKAN KEANGGOTAAN", 50, 140, { align: "center", width: 495 });
    doc.fontSize(10).font("Helvetica").fillColor("#000000")
       .text(`Nomor: ${docNumber}`, 50, 155, { align: "center", width: 495 });

    // 3. Opening text
    doc.fontSize(10).font("Helvetica").fillColor("#000000")
       .text("Yang bertanda tangan di bawah ini:", 50, 185);

    // 4. First Table (Member details)
    const startY1 = 205;
    const rowHeight = 20;
    const labels = [
      ["Nama", data.member_name],
      ["NIP / NIDN", `— / ${data.member_nidn || "-"}`],
      ["Jabatan", `${data.member_academic_rank || "Dosen"} — Universitas Andalas`],
      ["Email", data.member_email || "-"]
    ];

    labels.forEach((row, i) => {
      const y = startY1 + (i * rowHeight);
      doc.rect(50, y, 495, rowHeight).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#1e293b").text(row[0], 60, y + 6);
      doc.font("Helvetica").fontSize(9).fillColor("#334155").text(`: ${row[1]}`, 170, y + 6);
    });

    // 5. Body Paragraph
    const textY = startY1 + (labels.length * rowHeight) + 15;
    doc.fontSize(10).font("Helvetica").fillColor("#000000")
       .text("Dengan ini menyatakan ", 50, textY, { continued: true, align: "justify", width: 495, lineGap: 4 });

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

    // 6. Second Table (Activity details)
    const startY2 = doc.y + 20;
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
      doc.rect(50, y, 495, rowHeight).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#1e293b").text(row[0], 60, y + 6);
      if (row[0] === "Keputusan") {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(accentColor).text(`: ${row[1]}`, 170, y + 6);
      } else {
        doc.font("Helvetica").fontSize(9).fillColor("#334155").text(`: ${row[1]}`, 170, y + 6);
      }
    });

    // 7. Closing Text
    const startY3 = startY2 + (activityFields.length * rowHeight) + 15;
    doc.font("Helvetica").fontSize(10).fillColor("#000000")
       .text("Demikian surat pernyataan ini dibuat dengan sebenar-benarnya.", 50, startY3);

    // 8. Signatures
    const signedDate = data.responded_at ? new Date(data.responded_at) : new Date();
    const signedDateStr = signedDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const placeDateStr = `Padang, ${signedDateStr}`;

    const sigY = startY3 + 35;
    const colWidth = 200;
    const leftX = 50;
    const rightX = 345;

    // Left Column
    doc.font("Helvetica").fontSize(10).fillColor("#000000")
       .text(placeDateStr, leftX, sigY, { width: colWidth, align: "center" })
       .text("Yang Menyatakan,", leftX, sigY + 15, { width: colWidth, align: "center" });
    doc.font("Helvetica-Bold")
       .text(data.member_name, leftX, sigY + 80, { width: colWidth, align: "center" });
    doc.font("Helvetica")
       .text(`NIP / NIDN. — / ${data.member_nidn || "-"}`, leftX, sigY + 95, { width: colWidth, align: "center" });

    // Right Column
    doc.font("Helvetica").fontSize(10).fillColor("#000000")
       .text(placeDateStr, rightX, sigY, { width: colWidth, align: "center" })
       .text("Ketua Pelaksana,", rightX, sigY + 15, { width: colWidth, align: "center" });
    doc.font("Helvetica-Bold")
       .text(data.creator_name, rightX, sigY + 80, { width: colWidth, align: "center" });
    doc.font("Helvetica")
       .text(`NIP / NIDN. — / ${data.creator_nidn || "-"}`, rightX, sigY + 95, { width: colWidth, align: "center" });

    // 9. Fine Print / Footer
    const footerY = doc.page.height - 45;
    doc.moveTo(50, footerY - 5).lineTo(545, footerY - 5).lineWidth(0.5).strokeColor("#cbd5e1").stroke();

    const printDateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "2-digit", year: "numeric" });
    const footerText = `Diterbitkan otomatis oleh Sistem Pengabdian Masyarakat Universitas Andalas | No. Dok: ${docNumber} | Dicetak: ${printDateStr} | Dokumen sah tanpa tanda tangan basah. Verifikasi: lppm.unand.ac.id`;
    doc.font("Helvetica").fontSize(7).fillColor("#94a3b8")
       .text(footerText, 50, footerY, { align: "center", width: 495 });

    doc.end();

    writeStream.on('finish', () => {
      console.log("PDF generation test finished successfully! Saved to scratch/test-layout.pdf");
      process.exit(0);
    });
  } catch (err) {
    console.error("PDF generation test failed:", err);
    process.exit(1);
  }
}

testPdf();
