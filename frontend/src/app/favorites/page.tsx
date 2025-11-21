"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

type FavoriteItem = {
  id: string;
  productId: string;
  brand: string;
  model: string;
  priceRange?: string;
  addedAt?: string;
};

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/favorites");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const favoritesRef = collection(firestore, "favorites");
        const favoritesQuery = query(
          favoritesRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(favoritesQuery);
        const mappedFavorites: FavoriteItem[] = await Promise.all(
          snapshot.docs.map(async (favoriteDoc) => {
            const data = favoriteDoc.data();
            let brand = "";
            let model = "";
            let priceRange;
            if (data.productId) {
              const productDoc = await getDoc(doc(firestore, "products", data.productId));
              if (productDoc.exists()) {
                const productData = productDoc.data();
                brand = productData.brand ?? "";
                model = productData.model ?? productData.name ?? "Ürün";
                priceRange = productData.priceRange ?? productData.price;
              }
            }
            return {
              id: favoriteDoc.id,
              productId: data.productId ?? favoriteDoc.id,
              brand,
              model,
              priceRange,
              addedAt: data.createdAt?.toDate
                ? data.createdAt.toDate().toLocaleDateString("tr-TR")
                : undefined,
            };
          })
        );
        setFavorites(mappedFavorites.filter(Boolean));
      } catch (error) {
        console.error("Favoriler alınırken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleRemove = async (favorite: FavoriteItem) => {
    if (!user) {
      return;
    }
    try {
      await deleteDoc(doc(firestore, "favorites", favorite.id));
      setFavorites((prev) => prev.filter((item) => item.id !== favorite.id));
    } catch (error) {
      console.error("Favori silinirken hata:", error);
    }
  };

  const title = useMemo(() => {
    if (!user) return "Favorilerim";
    return `${user.displayName || user.email?.split("@")[0] || "Favorilerim"} • Favoriler`;
  }, [user]);

  if (authLoading || (!user && typeof window !== "undefined")) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="rounded-3xl bg-gradient-to-r from-rose-500 to-pink-500 px-10 py-12 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">Favoriler</p>
        <h1 className="mt-4 text-4xl font-semibold">{title}</h1>
        <p className="mt-3 text-lg text-white/90">Sevdiklerini tek ekranda takip et, fiyat ve yorum değişikliklerini kaçırma.</p>
      </section>

      <section className="mt-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : favorites.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {favorites.map((favorite) => (
              <article key={favorite.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-rose-500">{favorite.brand}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{favorite.model}</h2>
                {favorite.priceRange && (
                  <p className="mt-1 text-sm text-slate-500">{favorite.priceRange}</p>
                )}
                {favorite.addedAt && (
                  <p className="mt-2 text-xs text-slate-400">Eklendi: {favorite.addedAt}</p>
                )}
                <div className="mt-6 flex gap-3">
                  <Link
                    href={{ pathname: "/products/[id]", query: { id: favorite.productId } }}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                  >
                    İncele
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(favorite)}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                  >
                    Çıkar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            Henüz favori ürün eklememişsin. Ürün detay sayfalarındaki “Favorilere ekle” butonunu kullanabilirsin.
            <div className="mt-4">
              <Link
                href="/products"
                className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-400 hover:text-rose-500"
              >
                Ürünlere göz at
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

