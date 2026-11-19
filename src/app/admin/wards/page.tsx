import { redirect } from 'next/navigation';

export default function WardsRedirectPage() {
  redirect('/admin/ward-management');
}
