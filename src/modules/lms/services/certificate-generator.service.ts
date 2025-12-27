/**
 * Certificate PDF Generator Service
 * Generates PDF certificates for course completion using pdfkit
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

interface CertificateData {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  instructorName: string;
  issuedAt: Date;
  verificationHash: string;
}

@Injectable()
export class CertificateGeneratorService {
  private readonly uploadsDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
    this.baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3000';

    // Ensure certificates directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async generateCertificatePDF(
    data: CertificateData,
  ): Promise<{ filePath: string; pdfUrl: string }> {
    const fileName = `certificate-${data.certificateNumber}.pdf`;
    const filePath = path.join(this.uploadsDir, fileName);
    const verifyUrl = `${this.baseUrl}/lms/certificates/verify/${data.verificationHash}`;

    await this.createPDF(data, filePath, verifyUrl);

    return {
      filePath: `/uploads/certificates/${fileName}`,
      pdfUrl: `/uploads/certificates/${fileName}`,
    };
  }

  private createPDF(data: CertificateData, filePath: string, verifyUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Background
      doc.rect(0, 0, pageWidth, pageHeight).fill('#f8fafc');

      // Decorative border
      doc
        .lineWidth(3)
        .strokeColor('#6366f1')
        .rect(30, 30, pageWidth - 60, pageHeight - 60)
        .stroke();

      // Inner border
      doc
        .lineWidth(1)
        .strokeColor('#a5b4fc')
        .rect(40, 40, pageWidth - 80, pageHeight - 80)
        .stroke();

      // Top decorative line
      doc
        .lineWidth(4)
        .strokeColor('#6366f1')
        .moveTo(50, 50)
        .lineTo(pageWidth - 50, 50)
        .stroke();

      // Title
      doc
        .fontSize(42)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text('Certificate of Completion', 0, 80, { align: 'center' });

      // Subtitle
      doc
        .fontSize(14)
        .fillColor('#64748b')
        .font('Helvetica')
        .text('This is to certify that', 0, 140, { align: 'center' });

      // Student name
      doc
        .fontSize(36)
        .fillColor('#6366f1')
        .font('Helvetica-Bold')
        .text(data.studentName, 0, 170, { align: 'center' });

      // Underline for name
      const nameWidth = doc.widthOfString(data.studentName);
      const nameX = (pageWidth - nameWidth) / 2;
      doc
        .lineWidth(2)
        .strokeColor('#6366f1')
        .moveTo(nameX, 215)
        .lineTo(nameX + nameWidth, 215)
        .stroke();

      // Completion text
      doc
        .fontSize(14)
        .fillColor('#64748b')
        .font('Helvetica')
        .text('has successfully completed the course', 0, 235, { align: 'center' });

      // Course name
      doc
        .fontSize(28)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text(data.courseName, 50, 265, { align: 'center', width: pageWidth - 100 });

      // Footer section
      const footerY = pageHeight - 120;

      // Instructor signature line
      doc.lineWidth(1).strokeColor('#334155').moveTo(100, footerY).lineTo(280, footerY).stroke();

      doc
        .fontSize(12)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text(data.instructorName, 100, footerY + 10, { width: 180, align: 'center' });

      doc
        .fontSize(10)
        .fillColor('#64748b')
        .font('Helvetica')
        .text('Course Instructor', 100, footerY + 28, { width: 180, align: 'center' });

      // Date and certificate number
      const formattedDate = data.issuedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      doc
        .fontSize(11)
        .fillColor('#64748b')
        .font('Helvetica')
        .text(`Date: ${formattedDate}`, pageWidth - 300, footerY + 5, {
          width: 200,
          align: 'right',
        });

      doc
        .fontSize(10)
        .text(`Certificate #: ${data.certificateNumber}`, pageWidth - 300, footerY + 22, {
          width: 200,
          align: 'right',
        });

      doc
        .fontSize(9)
        .fillColor('#6366f1')
        .text(`Verify: ${verifyUrl}`, pageWidth - 300, footerY + 39, {
          width: 200,
          align: 'right',
        });

      // Branding
      doc
        .fontSize(10)
        .fillColor('#94a3b8')
        .text('WordPress Node LMS', 0, pageHeight - 60, { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });
  }
}
