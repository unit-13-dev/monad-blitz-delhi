"use client";

import { createAppKit } from "@reown/appkit/react";
import { Ethers5Adapter } from "@reown/appkit-adapter-ethers5";
import { mainnet, arbitrum, monadTestnet } from "@reown/appkit/networks";

// 1. Get projectId at https://dashboard.reown.com
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;

// 2. Create a metadata object
const metadata = {
  name: "My Website",
  description: "My Website description",
  url: "https://mywebsite.com", // origin must match your domain & subdomain
  icons: ["https://avatars.mywebsite.com/"],
};

// 3. Create the AppKit instance
createAppKit({
  adapters: [new Ethers5Adapter()],
  metadata: metadata,
  networks: [mainnet, arbitrum, monadTestnet],
  projectId,
  features: {
    analytics: true, 
  },
});

export function AppKit({ children }: { children: React.ReactNode }) {
  return (
   <>
    {children}
   </>
  );
}