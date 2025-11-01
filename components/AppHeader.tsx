import Link from "next/link";
import { Button } from "./ui/button";
import { Wallet } from "lucide-react";
import ConnectButton from "@/components/ConnectButton";

export default function AppHeader() {
    return (
        <header className="border-b-4 border-black  bg-yellow-400 p-4 sticky top-0 z-50">
            <div className="mx-auto max-w-6xl flex items-center justify-between">
                <Link
                    href="/"
                    className="text-2xl font-black uppercase tracking-tight hover:underline decoration-4 flex items-center gap-2"
                >
                    <div className="text-3xl"></div>
                    <span>TACHI</span>
                </Link>
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/live-event" className="font-bold uppercase text-sm hover:underline decoration-4">
                        LIVE EVENTS
                    </Link>
                    <Link href="/leaderboard" className="font-bold uppercase text-sm hover:underline decoration-4">
                        LEADERBOARD
                    </Link>
                    <Link href="/dashboard" className="font-bold uppercase text-sm hover:underline decoration-4">
                        DASHBOARD
                    </Link>
                    <Link href="/nfts" className="font-bold uppercase text-sm hover:underline decoration-4">
                        NFTS
                    </Link>
                </nav>
                <div>
                    <ConnectButton />
                </div>
            </div>
        </header>
    )
}