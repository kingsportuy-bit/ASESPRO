import type { Metadata } from "next";

import { AdminPanel } from "./AdminPanel";

export const metadata: Metadata = {
  title: "Panel admin",
  description: "Panel interno de ASESPRO para gestionar publicaciones.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage(): JSX.Element {
  return <AdminPanel />;
}
