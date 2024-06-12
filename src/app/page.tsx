"use client";
import HomePage from "@/views/Home";
import { useWalletAddress } from "bitcoin-wallet-adapter";

export default function Home() {
  const walletDetails = useWalletAddress();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <HomePage/>
    </main>
  );
}
