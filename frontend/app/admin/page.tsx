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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminPage(): JSX.Element {
  return <AdminPanel />;
}
