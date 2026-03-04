"""
Email Service
Handles sending emails via SMTP
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import Config
import logging

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def send_device_verification_email(to_email, code, device_name="Unknown Device"):
        """Send device verification email with 6-character code"""
        try:
            subject = "Xác thực thiết bị mới - Smart Travel"
            
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #5FCBC4;">Xác thực thiết bị mới</h2>
                        <p>Chúng tôi phát hiện bạn đang cố gắng đăng nhập từ một thiết bị mới:</p>
                        <p><strong>Thiết bị:</strong> {device_name}</p>
                        <p>Để xác thực thiết bị này, vui lòng nhập mã sau:</p>
                        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; font-family: 'Courier New', monospace;">
                            {code}
                        </div>
                        <p style="color: #666; font-size: 14px;">⏰ Mã này sẽ hết hạn sau 15 phút.</p>
                        <p style="color: #e74c3c; font-size: 14px; background-color: #fee; padding: 10px; border-radius: 5px;">
                            ⚠️ <strong>Lưu ý:</strong> Khi xác thực thiết bị mới, tất cả các thiết bị cũ sẽ bị xóa khỏi tài khoản của bạn.
                        </p>
                        <p style="color: #666; font-size: 14px;">Nếu bạn không thực hiện hành động này, vui lòng bỏ qua email này và đổi mật khẩu ngay lập tức.</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">Smart Travel - Your Travel Companion</p>
                    </div>
                </body>
            </html>
            """
            
            text_body = f"""
Xác thực thiết bị mới - Smart Travel

Chúng tôi phát hiện bạn đang cố gắng đăng nhập từ một thiết bị mới: {device_name}

Để xác thực thiết bị này, vui lòng nhập mã sau:

{code}

⏰ Mã này sẽ hết hạn sau 15 phút.

⚠️ LƯU Ý: Khi xác thực thiết bị mới, tất cả các thiết bị cũ sẽ bị xóa khỏi tài khoản của bạn.

Nếu bạn không thực hiện hành động này, vui lòng bỏ qua email này và đổi mật khẩu ngay lập tức.

---
Smart Travel - Your Travel Companion
            """
            
            return EmailService._send_email(to_email, subject, html_body, text_body)
            
        except Exception as e:
            logger.error(f"Error sending device verification email: {e}")
            return False
    
    @staticmethod
    def send_password_reset_email(to_email, code):
        """Send password reset email with 6-character code"""
        try:
            subject = "Đặt lại mật khẩu - Smart Travel"

            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #5FCBC4;">Đặt lại mật khẩu</h2>
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                        <p>Để tiếp tục, vui lòng nhập mã xác thực sau:</p>
                        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; font-family: 'Courier New', monospace;">
                            {code}
                        </div>
                        <p style="color: #666; font-size: 14px;">⏰ Mã này sẽ hết hạn sau 15 phút.</p>
                        <p style="color: #666; font-size: 14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">Smart Travel - Your Travel Companion</p>
                    </div>
                </body>
            </html>
            """

            text_body = f"""
Đặt lại mật khẩu - Smart Travel

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

Để tiếp tục, vui lòng nhập mã xác thực sau:

{code}

⏰ Mã này sẽ hết hạn sau 15 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

---
Smart Travel - Your Travel Companion
            """

            return EmailService._send_email(to_email, subject, html_body, text_body)

        except Exception as e:
            logger.error(f"Error sending password reset email: {e}")
            return False

    @staticmethod
    def _send_email(to_email, subject, html_body, text_body):
        """Internal method to send email via SMTP"""
        try:
            # Check if SMTP is configured
            if not Config.SMTP_USERNAME or not Config.SMTP_PASSWORD:
                logger.warning("SMTP not configured. Email not sent.")
                logger.info(f"Would send email to {to_email} with subject: {subject}")
                logger.info(f"Text body:\n{text_body}")
                return True  # Return True for development
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = Config.SMTP_FROM_EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Attach both plain text and HTML versions
            part1 = MIMEText(text_body, 'plain', 'utf-8')
            part2 = MIMEText(html_body, 'html', 'utf-8')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
                server.starttls()
                server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
