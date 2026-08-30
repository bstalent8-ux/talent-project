export const runtime = 'edge';

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import AdminEmailsShell from "./_components/AdminEmailsShell";
import EmailLogSection from "./_components/EmailLogSection";
import EmailLogSkeleton from "./_components/EmailLogSkeleton";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminEmailsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);

  return (
    <AdminEmailsShell emailConfigured={emailConfigured}>
      <Suspense key={page} fallback={<EmailLogSkeleton />}>
        <EmailLogSection page={page} pageSize={PAGE_SIZE} />
      </Suspense>
    </AdminEmailsShell>
  );
}
