import Link from "next/link";
import {Button} from "@/components/ui/button";
import HeaderAuth from "@/components/utils/header-auth";
import {ThemeSwitcher} from "@/components/utils/theme-switcher";
import {ReactNode} from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
    return(
        <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col gap-20 items-center">
                <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                    <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                        <div className="flex gap-5 items-center font-semibold">
                            <Link href={"/"}>Smart Calendar</Link>
                            <div className="flex items-center gap-2">
                                <Button variant='outline'>Start</Button>
                            </div>
                        </div>
                        <HeaderAuth />
                    </div>
                </nav>
                <div className="flex flex-col gap-20 max-w-5xl p-5">
                    {children}
                </div>
                <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
                    <p>
                        Powered by{" "}
                        <a
                            href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                            target="_blank"
                            className="font-bold hover:underline"
                            rel="noreferrer"
                        >
                            Supabase
                        </a>
                    </p>
                    <ThemeSwitcher />
                </footer>
            </div>
        </main>
    )
}