// Force dynamic rendering to prevent redirect during static generation
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { redirect } from 'next/navigation';

export default function CreateRedirect() {
  redirect('/jetshare/offer');
} 