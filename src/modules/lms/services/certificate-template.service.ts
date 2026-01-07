/**
 * Certificate Template Service
 * Manages certificate templates for customization
 */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateCertificateTemplateDto,
  UpdateCertificateTemplateDto,
} from '../dto/certificate-template.dto';

@Injectable()
export class CertificateTemplateService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new certificate template
   */
  async create(dto: CreateCertificateTemplateDto) {
    // If this template is set as default, unset all other defaults
    if (dto.isDefault) {
      await this.prisma.certificateTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.certificateTemplate.create({
      data: dto,
    });
  }

  /**
   * Get all certificate templates
   */
  async findAll() {
    return this.prisma.certificateTemplate.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get a single certificate template by ID
   */
  async findOne(id: string) {
    const template = await this.prisma.certificateTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Certificate template not found');
    }

    return template;
  }

  /**
   * Get the default certificate template
   */
  async getDefault() {
    let template = await this.prisma.certificateTemplate.findFirst({
      where: { isDefault: true },
    });

    // If no default template exists, create one
    if (!template) {
      template = await this.create({
        name: 'Default Template',
        isDefault: true,
      });
    }

    return template;
  }

  /**
   * Update a certificate template
   */
  async update(id: string, dto: UpdateCertificateTemplateDto) {
    const existing = await this.findOne(id);

    // If this template is being set as default, unset all other defaults
    if (dto.isDefault && !existing.isDefault) {
      await this.prisma.certificateTemplate.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.certificateTemplate.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete a certificate template
   */
  async delete(id: string) {
    const template = await this.findOne(id);

    // Prevent deletion of the default template
    if (template.isDefault) {
      throw new ConflictException('Cannot delete the default template');
    }

    await this.prisma.certificateTemplate.delete({
      where: { id },
    });

    return { message: 'Certificate template deleted successfully' };
  }

  /**
   * Set a template as default
   */
  async setDefault(id: string) {
    await this.findOne(id); // Ensure template exists

    // Unset all other defaults
    await this.prisma.certificateTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set this template as default
    return this.prisma.certificateTemplate.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}
