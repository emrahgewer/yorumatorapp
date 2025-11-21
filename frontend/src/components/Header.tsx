import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-slate-900">
          Yorumator
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/products?view=categories" className="transition hover:text-slate-900">
            Kategoriler
          </Link>
          <Link href="/products" className="transition hover:text-slate-900">
            Ürünler
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="hidden rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 md:inline-flex"
          >
            Hesabım
          </Link>
        </div>
      </div>
    </header>
  );
}

