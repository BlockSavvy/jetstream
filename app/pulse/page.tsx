import PulseHero from "./components/PulseHero";
import PulseQuestionnaire from "./components/PulseQuestionnaire";
import TrendingFlights from "./components/TrendingFlights";
import ExclusiveFlights from "./components/ExclusiveFlights";
import PulseAlerts from "./components/PulseAlerts";

export const metadata = {
  title: "JetStream Pulse | Curated Flights, Unforgettable Experiences",
  description: "Discover trending private jet flights uniquely tailored to your lifestyle and interests."
};

export default function PulsePage() {
  return (
    <main className="flex flex-col items-center justify-center w-full min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      <div className="container px-4 md:px-6 pt-24 pb-12">
        <PulseHero />
        <PulseQuestionnaire />
        <TrendingFlights />
        <ExclusiveFlights />
        <PulseAlerts />
      </div>
    </main>
  );
} 