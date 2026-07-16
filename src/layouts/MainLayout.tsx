import type { PropsWithChildren } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollProgress } from '@/components/ScrollProgress';

export function MainLayout({ children }: PropsWithChildren) {
  return (
    <div id="top" className="relative min-h-screen overflow-x-hidden ">
      <ScrollProgress />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
