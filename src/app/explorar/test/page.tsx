import type { Metadata } from "next";
import { Runner } from "@/features/assessment/runner";

export const metadata: Metadata = { title: "Explorando" };

export default function Page() {
  return <Runner />;
}
