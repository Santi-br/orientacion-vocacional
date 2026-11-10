import type { Metadata } from "next";
import { ReportView } from "@/features/report/report-view";

export const metadata: Metadata = { title: "Tu informe" };

export default function Page() {
  return <ReportView />;
}
