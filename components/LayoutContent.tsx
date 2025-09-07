"use client";

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  
  // 로그인 페이지에서는 네비게이션을 숨김
  const showNavigation = pathname !== '/login';

  return (
    <>
      {showNavigation && <Navigation />}
      {showNavigation && <div className="navigation-spacer"></div>}
      {children}
    </>
  );
}