import { Metadata } from "next";
import { CrewPageClient } from "./components/crew-page-client";

export const metadata: Metadata = {
  title: "Pilots & Specialized Crews - JetStream",
  description: "Discover specialized pilots and crews who can create unique, memorable experiences during your private jet flights.",
};

export default function CrewPage() {
  return (
    <div className="pb-12">
      <CrewPageClient />
    </div>
  );
} 