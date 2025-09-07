import "../styles/globals.css";
import "../styles/components.css";
import "../styles/navigation.css";
import LayoutContent from "../components/LayoutContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mood Asset Platform",
  description: "AI 그래픽 생성 api를 활용한 아이콘 생성 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
