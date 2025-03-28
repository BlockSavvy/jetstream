import JetShareOfferForm from '../components/JetShareOfferForm';

export const metadata = {
  title: 'Create Flight Share Offer | JetShare',
  description: 'Offer a portion of your private jet flight to offset costs and connect with verified travelers.',
};

export default function OfferCreationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create a Flight Share Offer</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        Share your private jet flight and offset your costs by offering a portion to other verified travelers.
      </p>
      
      <div className="max-w-2xl mx-auto">
        <JetShareOfferForm />
      </div>
    </div>
  );
} 