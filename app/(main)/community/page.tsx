export const runtime = 'edge';

import CommunityClient from "./_components/CommunityClient";
// ComingSoonOverlay temporarily removed for local review of the Jobs->
// Community restructure — re-add before this ships/launches.
// import ComingSoonOverlay from "@/components/ComingSoonOverlay";

export const metadata = {
  title: "المجتمع - أسئلة وأجوبة",
  description: "اطرح سؤالك وتواصل مع كبار البراندات والمواهب في منصتنا المخصصة للعمل الحر والصناعة الإبداعية.",
};

export default function CommunityPage() {
  return (
    <div id="talents-app-root" className="min-h-screen flex flex-col">
      <main className="grow">
        <CommunityClient />
      </main>
    </div>
  );
}