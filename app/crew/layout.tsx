import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pilots & Specialized Crews - JetStream",
  description: "Discover specialized pilots and crews who can create unique, memorable experiences during your private jet flights.",
};

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 