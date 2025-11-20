import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="rounded-3xl bg-white p-10 shadow-xl">
        <p className="text-sm uppercase tracking-widest text-emerald-600">Yorumator</p>
        <h1 className="mt-4 text-4xl font-bold">Güvenilir elektronik ürün yorumları</h1>
        <p className="mt-4 text-lg text-slate-600">
          Doğrulanmış kullanıcı yorumları, gelişmiş filtreleme ve NLP destekli özetlerle
          satın alma sürecini hızlandırın.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/products" className="rounded-full bg-emerald-600 px-6 py-3 text-white">
            Ürünleri keşfet
          </Link>
          <Link href="/(auth)/register" className="rounded-full border border-slate-200 px-6 py-3">
            Hesap oluştur
          </Link>
        </div>
      </section>
    </main>
  );
}
