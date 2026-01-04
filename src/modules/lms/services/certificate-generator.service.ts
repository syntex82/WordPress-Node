/**
 * Certificate PDF Generator Service
 * Generates PDF certificates for course completion using pdfkit
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
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

interface CertificateTemplate {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  titleFont: string;
  bodyFont: string;
  titleFontSize: number;
  nameFontSize: number;
  courseFontSize: number;
  bodyFontSize: number;
  titleText: string;
  subtitleText: string;
  completionText: string;
  brandingText: string;
  showBorder: boolean;
  showLogo: boolean;
  showBranding: boolean;
  borderWidth: number;
  borderStyle: string;
}

@Injectable()
export class CertificateGeneratorService {
  private readonly uploadsDir: string;
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
    this.baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3000';

    // Ensure certificates directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async generateCertificatePDF(
    data: CertificateData,
    templateId?: string,
  ): Promise<{ filePath: string; pdfUrl: string }> {
    const fileName = `certificate-${data.certificateNumber}.pdf`;
    const filePath = path.join(this.uploadsDir, fileName);
    const verifyUrl = `${this.baseUrl}/lms/certificates/verify/${data.verificationHash}`;

    // Get template (use provided ID or default)
    let template: CertificateTemplate;
    if (templateId) {
      const dbTemplate = await this.prisma.certificateTemplate.findUnique({
        where: { id: templateId },
      });
      if (dbTemplate) {
        template = dbTemplate as any;
      } else {
        template = await this.getDefaultTemplate();
      }
    } else {
      template = await this.getDefaultTemplate();
    }

    await this.createPDF(data, filePath, verifyUrl, template);

    return {
      filePath: `/uploads/certificates/${fileName}`,
      pdfUrl: `/uploads/certificates/${fileName}`,
    };
  }

  private async getDefaultTemplate(): Promise<CertificateTemplate> {
    const dbTemplate = await this.prisma.certificateTemplate.findFirst({
      where: { isDefault: true },
    });

    if (dbTemplate) {
      return dbTemplate as any;
    }

    // Return hardcoded default if no template exists
    return {
      primaryColor: '#6366f1',
      secondaryColor: '#a5b4fc',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      accentColor: '#6366f1',
      titleFont: 'Helvetica-Bold',
      bodyFont: 'Helvetica',
      titleFontSize: 42,
      nameFontSize: 36,
      courseFontSize: 28,
      bodyFontSize: 14,
      titleText: 'Certificate of Completion',
      subtitleText: 'This is to certify that',
      completionText: 'has successfully completed the course',
      brandingText: 'NodePress LMS',
      showBorder: true,
      showLogo: false,
      showBranding: true,
      borderWidth: 3,
      borderStyle: 'double',
    };
  }

  private createPDF(
    data: CertificateData,
    filePath: string,
    verifyUrl: string,
    template: CertificateTemplate,
  ): Promise<void> {
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
      doc.rect(0, 0, pageWidth, pageHeight).fill(template.backgroundColor);

      // Decorative border (if enabled)
      if (template.showBorder) {
        if (template.borderStyle === 'double') {
          // Outer border
          doc
            .lineWidth(template.borderWidth)
            .strokeColor(template.primaryColor)
            .rect(30, 30, pageWidth - 60, pageHeight - 60)
            .stroke();

          // Inner border
          doc
            .lineWidth(1)
            .strokeColor(template.secondaryColor)
            .rect(40, 40, pageWidth - 80, pageHeight - 80)
            .stroke();
        } else {
          // Single border
          doc
            .lineWidth(template.borderWidth)
            .strokeColor(template.primaryColor)
            .rect(30, 30, pageWidth - 60, pageHeight - 60)
            .stroke();
        }

        // Top decorative line
        doc
          .lineWidth(template.borderWidth + 1)
          .strokeColor(template.primaryColor)
          .moveTo(50, 50)
          .lineTo(pageWidth - 50, 50)
          .stroke();
      }

      // Logo (if enabled and provided)
      let currentY = 80;
      if (template.showLogo && template.logoUrl) {
        try {
          const logoPath = path.join(process.cwd(), 'public', template.logoUrl);
          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, pageWidth / 2 - 50, currentY, { width: 100, align: 'center' });
            currentY += 120;
          }
        } catch (error) {
          console.error('Failed to load logo:', error);
        }
      }

      // Title
      doc
        .fontSize(template.titleFontSize)
        .fillColor(template.textColor)
        .font(template.titleFont)
        .text(template.titleText, 0, currentY, { align: 'center' });

      currentY += template.titleFontSize + 20;

      // Subtitle
      doc
        .fontSize(template.bodyFontSize)
        .fillColor(template.textColor)
        .font(template.bodyFont)
        .text(template.subtitleText, 0, currentY, { align: 'center' });

      currentY += template.bodyFontSize + 20;

      // Student name
      doc
        .fontSize(template.nameFontSize)
        .fillColor(template.accentColor)
        .font(template.titleFont)
        .text(data.studentName, 0, currentY, { align: 'center' });

      // Underline for name
      const nameWidth = doc.widthOfString(data.studentName);
      const nameX = (pageWidth - nameWidth) / 2;
      currentY += template.nameFontSize + 5;
      doc
        .lineWidth(2)
        .strokeColor(template.accentColor)
        .moveTo(nameX, currentY)
        .lineTo(nameX + nameWidth, currentY)
        .stroke();

      currentY += 20;

      // Completion text
      doc
        .fontSize(template.bodyFontSize)
        .fillColor(template.textColor)
        .font(template.bodyFont)
        .text(template.completionText, 0, currentY, { align: 'center' });

      currentY += template.bodyFontSize + 20;

      // Course name
      doc
        .fontSize(template.courseFontSize)
        .fillColor(template.textColor)
        .font(template.titleFont)
        .text(data.courseName, 50, currentY, { align: 'center', width: pageWidth - 100 });

      // Footer section
      const footerY = pageHeight - 120;

      // Instructor signature line
      doc
        .lineWidth(1)
        .strokeColor(template.textColor)
        .moveTo(100, footerY)
        .lineTo(280, footerY)
        .stroke();

      doc
        .fontSize(12)
        .fillColor(template.textColor)
        .font(template.titleFont)
        .text(data.instructorName, 100, footerY + 10, { width: 180, align: 'center' });

      doc
        .fontSize(10)
        .fillColor(template.textColor)
        .font(template.bodyFont)
        .text('Course Instructor', 100, footerY + 28, { width: 180, align: 'center' });

      // Date and certificate number
      const formattedDate = data.issuedAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      doc
        .fontSize(11)
        .fillColor(template.textColor)
        .font(template.bodyFont)
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
        .fillColor(template.accentColor)
        .text(`Verify: ${verifyUrl}`, pageWidth - 300, footerY + 39, {
          width: 200,
          align: 'right',
        });

      // Branding (if enabled)
      if (template.showBranding) {
        doc
          .fontSize(10)
          .fillColor(template.textColor)
          .text(template.brandingText, 0, pageHeight - 60, { align: 'center' });
      }

      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });
  }
}
