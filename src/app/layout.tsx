
"use client"
// import { Provider } from "react-redux";
import "./globals.css";
import { WalletProvider } from "bitcoin-wallet-adapter";
import { ReactNode } from "react";
import Header from "../component/Layout/Header";
// import { SocketProvider } from "@/components/providers/socket";

type AuthViewProps = {
  isAuthorized: boolean;
  setIsAuthorized: React.Dispatch<React.SetStateAction<boolean>>;
  children: ReactNode;
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <WalletProvider>
        {/* <SocketProvider> */}
          <html lang="en">
            <body className="bg-primary text-light_gray relative small-scrollbar ">
              <main className=" max-w-screen-2xl mx-auto no-scrollbar relative pb-16 lg:pb-24">
                <Header />
                
                <div className="lg:p-8 p-4 mt-20">{children}</div>
              </main>
            </body>
          </html>
        {/* </SocketProvider> */}
      </WalletProvider>
  );
}
