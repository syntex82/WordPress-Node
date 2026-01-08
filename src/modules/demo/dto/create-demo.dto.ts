import { IsEmail, IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateDemoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
  })
  preferredSubdomain?: string;
}

export class DemoAccessDto {
  @IsString()
  accessToken: string;
}

export class ExtendDemoDto {
  @IsOptional()
  hours?: number;
}

