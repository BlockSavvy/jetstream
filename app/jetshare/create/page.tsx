import { redirect } from 'next/navigation';

// Prevent static generation of this page
export const dynamic = 'force-dynamic';

export default function CreateRedirect() {
  redirect('/jetshare/offer');
} 