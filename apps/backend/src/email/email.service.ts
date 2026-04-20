import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.get<string>('GMAIL_USER'),
      to,
      subject: 'Your CampusExchange verification code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Verify your FAU email</h2>
          <p>Use the code below to verify your CampusExchange account:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px; background: #f4f4f4; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 16px;">This code expires soon. If you did not sign up for CampusExchange, ignore this email.</p>
        </div>
      `,
    });
  }
}
