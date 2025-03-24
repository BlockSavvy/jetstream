import { CrewHero } from './components/crew-hero';
import { CrewListing } from './components/crew-listing';

export default function CrewPage() {
  return (
    <div className="container py-8 space-y-12">
      <CrewHero />
      <CrewListing />
    </div>
  );
} 