import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'WorkChain - 区块链防篡改与AI语义分析 | Tamper-proof Corporate Review Ledger',
  description: 'WorkChain: 提供公司匿名员工评价、真实薪资统计、哈希防篡改链条校验、以及多维度AI职场文化深度分析报告。',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
