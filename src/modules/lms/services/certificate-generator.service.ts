/**
 * Certificate PDF Generator Service
 * Generates PDF certificates for course completion
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

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

  async generateCertificatePDF(data: CertificateData): Promise<{ filePath: string; pdfUrl: string }> {
    const fileName = `certificate-${data.certificateNumber}.html`;
    const filePath = path.join(this.uploadsDir, fileName);
    const verifyUrl = `${this.baseUrl}/verify/${data.verificationHash}`;
    
    // Generate HTML certificate (can be converted to PDF with a headless browser)
    const html = this.generateCertificateHTML(data, verifyUrl);
    
    fs.writeFileSync(filePath, html);
    
    return {
      filePath: `/uploads/certificates/${fileName}`,
      pdfUrl: `${this.baseUrl}/uploads/certificates/${fileName}`,
    };
  }

  private generateCertificateHTML(data: CertificateData, verifyUrl: string): string {
    const formattedDate = data.issuedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion - ${data.courseName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Open Sans', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    
    .certificate {
      background: white;
      width: 900px;
      padding: 60px;
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
      position: relative;
      overflow: hidden;
    }
    
    .certificate::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .logo { font-size: 24px; color: #667eea; margin-bottom: 10px; }
    
    .title {
      font-family: 'Playfair Display', serif;
      font-size: 48px;
      color: #1a1a2e;
      margin-bottom: 10px;
    }
    
    .subtitle { color: #666; font-size: 18px; }
    
    .content { text-align: center; margin: 40px 0; }
    
    .presented-to { color: #888; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; }
    
    .student-name {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      color: #1a1a2e;
      margin: 20px 0;
      border-bottom: 3px solid #667eea;
      display: inline-block;
      padding-bottom: 10px;
    }
    
    .completion-text { color: #444; font-size: 18px; margin: 20px 0; }
    
    .course-name {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      color: #667eea;
      margin: 20px 0;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #eee;
    }
    
    .signature { text-align: center; }
    .signature-line { width: 200px; border-bottom: 2px solid #333; margin-bottom: 10px; }
    .signature-name { font-weight: 600; }
    .signature-title { color: #888; font-size: 12px; }
    
    .details { text-align: right; font-size: 12px; color: #888; }
    .cert-number { font-family: monospace; }
    
    .verify-link { color: #667eea; text-decoration: none; }
    
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">🎓 WordPress Node LMS</div>
      <h1 class="title">Certificate of Completion</h1>
      <p class="subtitle">This is to certify that</p>
    </div>
    
    <div class="content">
      <p class="presented-to">Presented to</p>
      <h2 class="student-name">${data.studentName}</h2>
      <p class="completion-text">has successfully completed the course</p>
      <h3 class="course-name">${data.courseName}</h3>
    </div>
    
    <div class="footer">
      <div class="signature">
        <div class="signature-line"></div>
        <p class="signature-name">${data.instructorName}</p>
        <p class="signature-title">Course Instructor</p>
      </div>
      
      <div class="details">
        <p>Date: ${formattedDate}</p>
        <p class="cert-number">Certificate #: ${data.certificateNumber}</p>
        <p><a href="${verifyUrl}" class="verify-link">Verify Certificate</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}

