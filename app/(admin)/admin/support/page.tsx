export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminSupportShell from "./_components/AdminSupportShell";
import SupportTicketsSection from "./_components/SupportTicketsSection";
import SupportTicketsSkeleton from "./_components/SupportTicketsSkeleton";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminSupportPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  // Matches the old client default ("new" tickets first) rather than "all".
  const status = typeof sp.status === "string" ? sp.status : "new";
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);

  return (
    <AdminSupportShell status={status}>
      <Suspense key={`${page}-${status}`} fallback={<SupportTicketsSkeleton />}>
        <SupportTicketsSection page={page} pageSize={PAGE_SIZE} status={status} emailConfigured={emailConfigured} />
      </Suspense>
    </AdminSupportShell>
  );
}
