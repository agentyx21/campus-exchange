import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Strict rate limit: 5 registrations per minute per IP
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(201)
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // Strict rate limit: 5 login attempts per minute per IP
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Strict rate limit: 5 verification attempts per minute per IP.
  // Combined with the per-code attempt counter in auth.service, this makes
  // brute-forcing a 6-digit OTP (1M combinations) computationally hopeless.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}
