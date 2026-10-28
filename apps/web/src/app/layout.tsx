import type { Metadata } from "next";
import { headers } from "next/headers";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";
import { PageTitle } from "@/components/layout/page-title";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  description:
    "Portal akses aplikasi terpusat dengan login tunggal (SSO), kontrol akses berbasis grup, dan audit trail.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("sso-theme");
    const preference = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const resolved = preference === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch {
    const resolved = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }
})();
`;

export default async function RootLayout({ children }: RootLayoutProps) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="id"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body>
        <PageTitle />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
