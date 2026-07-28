import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/theme-provider';

export const metadata: Metadata = {
  title: 'WorkChain - 完全匿名的企业信息共享社区',
  description: '无需登录或公开身份，匿名创建企业、补充资料、分享工作体验，并通过社区协作和 AI 分析了解真实的企业文化。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
