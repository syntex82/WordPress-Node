/**
 * Certificate Templates Controller
 * Admin endpoints for managing certificate templates
 */
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CertificateTemplateService } from '../services/certificate-template.service';
import {
  CreateCertificateTemplateDto,
  UpdateCertificateTemplateDto,
} from '../dto/certificate-template.dto';

@Controller('api/lms/admin/certificate-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EDITOR)
export class CertificateTemplatesController {
  constructor(private certificateTemplateService: CertificateTemplateService) {}

  @Post()
  create(@Body() dto: CreateCertificateTemplateDto) {
    return this.certificateTemplateService.create(dto);
  }

  @Get()
  findAll() {
    return this.certificateTemplateService.findAll();
  }

  @Get('default')
  getDefault() {
    return this.certificateTemplateService.getDefault();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.certificateTemplateService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCertificateTemplateDto) {
    return this.certificateTemplateService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.certificateTemplateService.delete(id);
  }

  @Patch(':id/set-default')
  setDefault(@Param('id') id: string) {
    return this.certificateTemplateService.setDefault(id);
  }
}
