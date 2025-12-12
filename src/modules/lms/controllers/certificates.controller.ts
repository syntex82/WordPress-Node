/**
 * Certificates Controller for LMS Module
 * Handles certificate management and verification
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CertificatesService } from '../services/certificates.service';

@Controller('api/lms')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // Public verification endpoint
  @Get('certificates/verify/:hash')
  async verify(@Param('hash') hash: string) {
    return this.certificatesService.verify(hash);
  }

  // Student endpoints
  @Get('my-certificates')
  @UseGuards(JwtAuthGuard)
  async getMyCertificates(@Request() req) {
    return this.certificatesService.findByUser(req.user.id);
  }

  @Get('certificates/:id')
  @UseGuards(JwtAuthGuard)
  async getCertificate(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @Post('courses/:courseId/certificate')
  @UseGuards(JwtAuthGuard)
  async requestCertificate(@Param('courseId') courseId: string, @Request() req) {
    return this.certificatesService.issueCertificate(courseId, req.user.id);
  }

  // Admin endpoints
  @Put('admin/certificates/:id/revoke')
  @UseGuards(JwtAuthGuard)
  async revokeCertificate(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.certificatesService.revoke(id, body.reason);
  }
}

