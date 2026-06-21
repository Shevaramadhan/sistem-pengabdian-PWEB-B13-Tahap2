const fs = require('fs');
const PDFDocument = require('pdfkit');

// Mock data matching the real database query result
const data = {
  id: 0,
  member_role: 'Anggota',
  status: 'approved',
  responded_at: new Date('2026-06-10T04:39:56.000Z'),
  created_at: new Date('2026-06-03T17:50:05.000Z'),
  service_title: 'Pengabdian Masyarakat Pengenalan AI',
  description: 'memberikan pengenalan kepada masyarakat tentang sebuah teknolofi informasi yg terlah berkembang pesat saat ini yaitu ai',
  start_date: new Date('2026-06-14T17:00:00.000Z'),
  end_date: null,
  location: 'Padang Pariaman, Nagari Pauh',
  creator_name: 'Dr. Sheva Ramadhan',
  member_name: 'Athaya Nasywa Mahira',
  member_email: 'athaya@pengabdian.ac.id'
};

async function testPdf() {
  try {
    const doc = new PDFDocument({ margin: 60, size: "A4" });
    const writeStream = fs.createWriteStream('scratch/test.pdf');
    doc.pipe(writeStream);

    const isApproved = data.status === "approved";
    const accentColor = isApproved ? "#008556" : "#dc2626";
    const statusLabel = isApproved ? "DISETUJUI" : "DITOLAK";

    // Header bar
    doc.rect(0, 0, doc.page.width, 8).fill(accentColor);

    // Logo area / Title
    doc.moveDown(1);
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#1e293b")
      .text("BUKTI KEANGGOTAAN PENGABDIAN MASYARAKAT", { align: "center" });
    doc.fontSize(11).font("Helvetica").fillColor("#64748b")
      .text("Universitas Andalas — Sistem Pengabdian", { align: "center" });

    // Status badge
    doc.moveDown(1);
    doc.roundedRect(doc.page.width / 2 - 70, doc.y, 140, 32, 6).fill(isApproved ? "#ecfdf5" : "#fef2f2");
    doc.fontSize(13).font("Helvetica-Bold").fillColor(accentColor)
      .text(statusLabel, doc.page.width / 2 - 70, doc.y - 28, { width: 140, align: "center" });

    doc.moveDown(2);

    // Divider
    doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
    doc.moveDown(1);

    // Section: Informasi Pengabdian
    const drawSection = (title, fields) => {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(accentColor).text(title);
      doc.moveDown(0.4);
      fields.forEach(([label, value]) => {
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#374151").text(label + ":", { continued: true, width: 180 });
        doc.font("Helvetica").fillColor("#1e293b").text("  " + (value || "-"));
      });
      doc.moveDown(0.8);
    };

    drawSection("Informasi Pengabdian", [
      ["Judul Kegiatan", data.service_title],
      ["Lokasi", data.location],
      ["Tanggal Mulai", data.start_date ? new Date(data.start_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-"],
      ["Tanggal Selesai", data.end_date ? new Date(data.end_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-"],
      ["Ketua Pengabdian", data.creator_name],
    ]);

    doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
    doc.moveDown(1);

    drawSection("Informasi Anggota", [
      ["Nama Dosen", data.member_name],
      ["Email", data.member_email],
      ["Peran / Jabatan", data.member_role],
      ["Status Keanggotaan", statusLabel],
      ["Tanggal Undangan", new Date(data.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })],
      ["Tanggal Diproses", data.responded_at ? new Date(data.responded_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"],
    ]);

    doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
    doc.moveDown(1.5);

    // Keterangan
    doc.fontSize(9).font("Helvetica").fillColor("#94a3b8")
      .text(
        "Dokumen ini diterbitkan secara otomatis oleh Sistem Pengabdian Universitas Andalas sebagai bukti resmi " +
        (isApproved ? "persetujuan" : "penolakan") +
        " keanggotaan dalam kegiatan pengabdian masyarakat. Dokumen ini sah tanpa tanda tangan basah.",
        { align: "center" }
      );

    doc.moveDown(0.5);
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b")
      .text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, { align: "center" });

    // Footer bar
    doc.rect(0, doc.page.height - 8, doc.page.width, 8).fill(accentColor);

    doc.end();

    writeStream.on('finish', () => {
      console.log("PDF generation test finished successfully! Saved to scratch/test.pdf");
      process.exit(0);
    });
  } catch (err) {
    console.error("PDF generation test failed:", err);
    process.exit(1);
  }
}

testPdf();
