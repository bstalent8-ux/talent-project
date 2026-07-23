"use client";

import dynamic from "next/dynamic";

const GlobalChat = dynamic(() => import("./GlobalChat"), {
  ssr: false,
  loading: () => null,
});

export default function LazyGlobalChat() {
  return <GlobalChat />;
}
