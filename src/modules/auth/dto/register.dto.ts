/**
 * Register DTO
 * Validates user registration data
 *
 * SECURITY: Role field intentionally omitted to prevent privilege escalation
 * New users are always assigned STUDENT role by the service
 */

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  // SECURITY: No role field - prevents users from self-assigning admin roles
  // Role is always set to STUDENT by the auth service
}
