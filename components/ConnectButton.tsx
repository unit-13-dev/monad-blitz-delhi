"use client"

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useWalletUser } from "@/hooks/use-wallet-user";

export default function ConnectButton() {
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { balance: walletBalance } = useWalletUser();
    const [copied, setCopied] = useState(false);
    const {user} = useWalletUser();

    // Format address to show: 0x1234...5678
    const formatAddress = (addr: string | undefined) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Copy address to clipboard
    const handleCopy = async () => {
        if (!address) return;
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy address:", err);
        }
    };

    // Format balance from wei to ETH
    const formatBalance = (balanceWei: string | undefined) => {
        if (!balanceWei || balanceWei === "0") return "0.0000";
        try {
            const balanceEth = parseFloat(balanceWei) / 1e18;
            return balanceEth.toFixed(4);
        } catch {
            return "0.0000";
        }
    };

    // If not connected, show connect button
    if (!isConnected || !address) {
        return (
            <Button 
                className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                onClick={() => open()}
            >
                <Wallet className="h-4 w-4 mr-2" />
                CONNECT
            </Button>
        );
    }

    // If connected, show wallet info
    return (
        <div className="flex items-center gap-3">
            <Card className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 bg-white">
                <div className="flex items-center gap-3">
                    <h1 className="font-bold">
                    {user?.username ? `@${user.username}` : formatAddress(address)}
                    </h1>
                </div>
            </Card>
            <Button 
                className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-3 py-2" 
                onClick={() => open()}
            >
                DISCONNECT
            </Button>
        </div>
    );
}
