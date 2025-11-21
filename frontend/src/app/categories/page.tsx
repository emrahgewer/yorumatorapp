"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

type Category = {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  productCount?: number;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(firestore, "categories"));
        const docs: Category[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name ?? "İsimsiz kategori",
            description: data.description ?? "Bu kategoriye ait açıklama henüz eklenmedi.",
            coverImage: data.coverImage,
            productCount: data.productCount ?? data.count ?? undefined,
          };
        });
        setCategories(docs);
      } catch (error) {
        console.error("Firestore kategorileri alınırken hata oluştu:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-500 px-10 py-12 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">Katalog</p>
        <h1 className="mt-4 text-4xl font-semibold">Kategorileri keşfet</h1>
        <p className="mt-3 text-lg text-white/90">
          Televizyondan dizüstüne, kulaklıktan akıllı ev ürünlerine kadar tüm kategoriler tek ekranda.
        </p>
      </section>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : categories.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((category) => (
              <article key={category.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">Kategori</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{category.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{category.description}</p>
                {category.productCount !== undefined && (
                  <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">
                    {category.productCount} ürün
                  </p>
                )}
                <Link
                  href={`/products?view=categories&category=${category.id}`}
                  className="mt-6 inline-flex rounded-full border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                >
                  {category.name} ürünlerini gör
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            Henüz kategori bulunamadı.
          </div>
        )}
      </div>
    </main>
  );
}

