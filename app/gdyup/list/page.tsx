'use client';

import React from 'react';
import GdyupClientLayout from '../components/GdyupClientLayout';
import JetShareOfferForm from '../components/offer-form/JetShareOfferForm';

export default function ListPage() {
  return (
    <GdyupClientLayout>
      <ListPageContent />
    </GdyupClientLayout>
  );
}

function ListPageContent() {
  return (
    <div className="min-h-screen gdyup-app">
      {/* Use the sophisticated modular offer form */}
      <JetShareOfferForm />
    </div>
  );
} 