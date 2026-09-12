import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const access = await requireAccess();
  return <div className="min-h-screen bg-[#f5f1e8]">
    <header className="border-b border-slate-900/15 bg-[#173f3a] text-white">
      <nav aria-label="Navegación principal" className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4 lg:px-8">
        <Link href="/app" prefetch={false} className="mr-auto text-lg font-black tracking-tight text-white no-underline">
          D+ <span className="font-normal text-[#e7c76e]">Base Curricular</span>
        </Link>
        <Link href="/app/library" prefetch={false} className="text-sm font-bold text-white decoration-[#e7c76e] decoration-2">Biblioteca</Link>
        <span className="text-xs text-white/70">{access.organizationName} · {access.role === "Admin" ? "Administrador" : "Colaborador"}</span>
        <form action={signOut}><button type="submit" className="border border-white/30 bg-transparent px-3 py-2 text-sm hover:bg-white/10">Cerrar sesión</button></form>
      </nav>
    </header>
    {children}
  </div>;
}
