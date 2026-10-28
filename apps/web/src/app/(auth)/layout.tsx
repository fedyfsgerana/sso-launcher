import type { ReactNode } from "react";
import { PendingToast } from "@/components/portal/pending-toast";
import { ToastProvider } from "@/components/portal/toast";

type AuthLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <ToastProvider>
      <PendingToast />
      {children}
    </ToastProvider>
  );
}
