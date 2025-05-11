import { ReactNode } from "react";
import TanStackProviders from "@/components/providers/tanstack-providers"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
      <TanStackProviders>
          {children}
      </TanStackProviders>
  );
}