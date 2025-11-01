"use client"

import Link from "next/link";
import ConnectButton from "@/components/ConnectButton";

export default function LandingHeader() {
    return (
        <header className="border-b-4 rounded-b-3xl border-black bg-yellow-400 p-4 sticky top-0 z-50">
            <div className="mx-auto max-w-6xl flex items-center justify-between">
                <Link
                    href="/"
                    className="text-2xl font-black uppercase tracking-tight hover:underline decoration-4 flex items-center gap-2"
                >
                    <div className="text-3xl"></div>
                    <span>TACHI</span>
                </Link>
                <div>
                    <ConnectButton />
                </div>
            </div>
        </header>
    )
}