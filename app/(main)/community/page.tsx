export const runtime = 'edge';

import CommunityClient from "./_components/CommunityClient";

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