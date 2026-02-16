import { formatDurationVN } from '@/shared/utils/format-time';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

import * as dotenv from 'dotenv';
dotenv.config();

interface VerificationEmailTemplateProps {
  username: string;
  verificationUrl: string;
}

export const VerificationEmailTemplate = ({
  username,
  verificationUrl,
}: VerificationEmailTemplateProps) => {
  const TIME_EXPIRES = process.env.JWT_VERIFICATION_EXPIRES_IN;

  return (
    <Html>
      <Head />
      <Preview>Xác thực tài khoản We Connect của bạn</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>We Connect</Heading>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Heading as="h2" style={greeting}>
              Xin chào {username} 👋
            </Heading>
            <Text style={paragraph}>
              Cảm ơn bạn đã đăng ký tài khoản. Hãy nhấn nút bên dưới để xác thực
              email của bạn.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={verificationUrl}>
                Xác thực Email
              </Button>
            </Section>

            <Text style={note}>
              Link xác thực sẽ hết hạn sau{' '}
              <strong>{formatDurationVN(TIME_EXPIRES as string)}</strong>. Nếu
              bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
            </Text>

            {/* Fallback link */}
            <Section style={fallbackBox}>
              <Text style={fallbackLabel}>
                Nếu nút không hoạt động, copy link sau:
              </Text>
              <Text style={fallbackLink}>{verificationUrl}</Text>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © 2026 We Connect. Email này được gửi tự động, vui lòng không phản
              hồi.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main: React.CSSProperties = {
  backgroundColor: '#f4f7fa',
  fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '40px auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
};

const header: React.CSSProperties = {
  background: 'linear-gradient(135deg, #3d87c4,#246aa3)',
  padding: '32px',
  textAlign: 'center' as const,
};

const headerTitle: React.CSSProperties = {
  margin: 0,
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
};

const content: React.CSSProperties = {
  padding: '32px',
};

const greeting: React.CSSProperties = {
  margin: '0 0 8px',
  color: '#1e293b',
  fontSize: '20px',
};

const paragraph: React.CSSProperties = {
  color: '#64748b',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button: React.CSSProperties = {
  background: 'linear-gradient(135deg, #3d87c4,#246aa3)',
  color: '#ffffff',
  padding: '14px 40px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 600,
  textDecoration: 'none',
  letterSpacing: '0.3px',
};

const note: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 16px',
};

const fallbackBox: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '12px 16px',
  marginTop: '16px',
};

const fallbackLabel: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: '0 0 4px',
};

const fallbackLink: React.CSSProperties = {
  color: '#6366f1',
  fontSize: '12px',
  wordBreak: 'break-all',
  margin: 0,
};

const hr: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: 0,
};

const footer: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  padding: '20px 32px',
  textAlign: 'center' as const,
};

const footerText: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: 0,
};

// Test khi dev
VerificationEmailTemplate.PreviewProps = {
  username: 'Cường',
  verificationUrl: 'http://localhost:3000/verify-email?token=abc123',
} as VerificationEmailTemplateProps;

export default VerificationEmailTemplate;
