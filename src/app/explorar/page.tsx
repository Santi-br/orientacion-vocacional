import type { Metadata } from "next";
import { Onboarding } from "@/features/assessment/onboarding";

export const metadata: Metadata = { title: "Empezar" };

export default function Page() {
  return <Onboarding />;
}
