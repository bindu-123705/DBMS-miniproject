import './globals.css';
import Nav from '@/components/Nav';
export const metadata = { title: 'EvePort', description: 'Club and event portal' };
export default function RootLayout({ children }) {
  return (<html lang="en"><body><Nav /><main>{children}</main></body></html>);
}
