import { Metadata } from 'next';
import JetLayoutEditor from '../layout-editor';

export const metadata: Metadata = {
  title: 'Jet Seat Layout Editor',
  description: 'Configure custom seating layouts for jets',
};

export default function JetLayoutsPage() {
  return (
    <div className="container py-10">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="inline-block text-4xl font-bold tracking-tight lg:text-5xl">
            Jet Seat Layouts
          </h1>
          <p className="text-xl text-muted-foreground">
            Configure how seats are arranged in each jet for the JetShare mobile app.
          </p>
        </div>
      </div>
      <div className="py-8">
        <JetLayoutEditor />
      </div>
    </div>
  );
} 