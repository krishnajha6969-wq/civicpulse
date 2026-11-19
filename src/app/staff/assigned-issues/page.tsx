import { redirect } from 'next/navigation';

export default function AssignedIssuesRedirect() {
  redirect('/staff/issues');
}
