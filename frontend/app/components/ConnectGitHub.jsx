
"use client";

import { signIn } from "next-auth/react";

export default function ConnectGitHub() {
  // const handleConnect = () => {
  //   signIn("github", { callbackUrl: "/" }, {
  //     prompt: "login",
  //   });
  // };
  const handleConnect = () => {
    signIn("github", {
      callbackUrl: "/",
      prompt: "login",
    });
  };
  
  return (
    <button
      type="button"
      onClick={handleConnect}
      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
    >
      Connect GitHub
    </button>
  );
}
