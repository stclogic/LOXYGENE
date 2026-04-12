import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center">
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#00E5FF] bg-white/10 backdrop-blur-md border border-white/10 hover:border-[#00E5FF]/50 transition-all"
      >
        ← L&apos;OXYGÈNE
      </Link>
      <div className="text-center">
        <h1 className="text-3xl font-black text-white/20 tracking-widest">ADMIN</h1>
        <p className="text-white/20 mt-2">Coming Soon</p>
      </div>
    </div>
  );
}
