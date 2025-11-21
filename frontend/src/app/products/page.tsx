"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

const sampleProducts = [
  {
    id: "1",
    brand: "Samsung",
    model: "Neo QLED 65",
    average_rating: 4.7,
    reviewCount: 128,
    highlights: ["MiniLED", "Q-Symphony", "Dolby Vision"],
    summary: "Neo QLED paneli sayesinde 2000 nit parlaklığa ulaşan ve tüm HDMI 2.1 portlarıyla gelen premium TV.",
    priceRange: "64.999₺ - 72.499₺",
    tags: ["oyuncu modu", "kalibrasyon hazır", "akıllı kumanda"],
    pros: ["Siyah seviyesi ve kontrast çok iyi", "Reflektans filtresi başarılı", "Tizen ekosistemi gelişmiş"],
    cons: ["Panel kalınlığı duvara tam yaslanmıyor"],
  },
  {
    id: "2",
    brand: "Apple",
    model: "MacBook Air M4",
    average_rating: 4.8,
    reviewCount: 205,
    highlights: ["Pil ömrü", "Sessiz çalışma", "Liquid Retina"],
    summary: "Yeni M4 çipiyle 20 saat pil ve fan gerektirmeyen serin çalışma sunan ultra taşınabilir dizüstü.",
    priceRange: "58.999₺ - 62.999₺",
    tags: ["usb-c", "touch id", "wifi 7"],
    pros: ["Yeni 3nm M4 ciddi performans getiriyor", "MagSafe ile hızlı şarj", "True Tone ekran"],
    cons: ["Yalnızca iki USB-C portu var"],
  },
];

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return sampleProducts;
    }
    return sampleProducts.filter((product) => {
      const haystack = `${product.brand} ${product.model}`.toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 px-10 py-12 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Yorumator katalogu</p>
        <h1 className="mt-4 text-4xl font-semibold">Elektronik ürün kataloğu</h1>
        <p className="mt-3 text-lg text-slate-200">
          Doğrulanmış kullanıcı yorumları, mağaza fiyatları ve akıllı filtreler sayesinde en doğru ürünü seçin.
        </p>
        <div className="mt-8 grid gap-4 text-sm text-slate-200 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Toplam ürün</p>
            <p className="text-2xl font-semibold text-white">320+</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Doğrulanmış yorum</p>
            <p className="text-2xl font-semibold text-white">18.400</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Yapay zekâ özetleri</p>
            <p className="text-2xl font-semibold text-white">Her ürün için</p>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Marka veya model ara"
          className="w-full rounded-full border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <div className="flex items-center gap-2">
          <Link
            href="/products?view=categories"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
          >
            Kategoriler
          </Link>
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(true)}
            className="rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50"
          >
            Filtrele
          </button>
        </div>
      </div>

      {isFilterPanelOpen && (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4 text-sm text-emerald-900">
          <p className="font-medium">Filtreler</p>
          <p className="mt-1 text-emerald-800">
            Detaylı filtreleme seçenekleri çok yakında bu panelde görünecek.
          </p>
          <button
            type="button"
            onClick={() => setIsFilterPanelOpen(false)}
            className="mt-3 rounded-full border border-emerald-600 px-4 py-2 text-xs font-semibold text-emerald-600"
          >
            Kapat
          </button>
        </div>
      )}

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
        {!filteredProducts.length && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            Aramanızla eşleşen ürün bulunamadı.
          </div>
        )}
      </section>
    </main>
  );
}
