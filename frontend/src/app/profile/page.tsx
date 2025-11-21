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
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

type Comment = {
  id: string;
  productName: string;
  rating: number;
  content: string;
  createdAt: string;
};

type FavoriteProduct = {
  id: string;
  name: string;
  brand: string;
  priceRange?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/profile");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchUserData = async () => {
      try {
        const reviewsRef = collection(firestore, "reviews");
        const reviewsQuery = query(
          reviewsRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const reviewSnapshot = await getDocs(reviewsQuery);
        const mappedReviews: Comment[] = await Promise.all(
          reviewSnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            let productName = "Bilinmeyen ürün";
            if (data.productId) {
              try {
                const productDoc = await getDoc(doc(firestore, "products", data.productId));
                if (productDoc.exists()) {
                  const productData = productDoc.data();
                  productName = `${productData.brand ?? ""} ${productData.model ?? ""}`.trim();
                }
              } catch (error) {
                console.error("Ürün adı alınırken hata:", error);
              }
            }
            const createdAt = data.createdAt?.toDate
              ? data.createdAt.toDate()
              : data.createdAt
                ? new Date(data.createdAt)
                : new Date();
            return {
              id: docSnapshot.id,
              productName,
              rating: data.rating ?? 0,
              content: data.content ?? "",
              createdAt: createdAt.toLocaleDateString("tr-TR"),
            };
          })
        );
        setComments(mappedReviews);

        const favoritesRef = collection(firestore, "favorites");
        const favoritesQuery = query(favoritesRef, where("userId", "==", user.uid));
        const favoritesSnapshot = await getDocs(favoritesQuery);
        const mappedFavorites: FavoriteProduct[] = await Promise.all(
          favoritesSnapshot.docs.map(async (favoriteDoc) => {
            const data = favoriteDoc.data();
            if (!data.productId) {
              return {
                id: favoriteDoc.id,
                name: "Tanımsız ürün",
                brand: "",
              };
            }
            const productDoc = await getDoc(doc(firestore, "products", data.productId));
            if (productDoc.exists()) {
              const productData = productDoc.data();
              return {
                id: data.productId,
                name: productData.model ?? productData.name ?? "Ürün",
                brand: productData.brand ?? "",
                priceRange: productData.priceRange ?? productData.price,
              };
            }
            return {
              id: data.productId,
              name: "Ürün bulunamadı",
              brand: "",
            };
          })
        );
        setFavorites(mappedFavorites.filter(Boolean));
      } catch (error) {
        console.error("Profil verileri alınırken hata:", error);
      }
    };

    fetchUserData();
  }, [user]);

  const stats = useMemo(
    () => [
      { label: "Toplam yorum", value: comments.length },
      { label: "Favoriler", value: favorites.length },
      {
        label: "Üyelik yılı",
        value: user?.metadata?.creationTime
          ? new Date(user.metadata.creationTime).getFullYear()
          : "—",
      },
    ],
    [comments.length, favorites.length, user?.metadata?.creationTime]
  );

  if (authLoading || (!user && typeof window !== "undefined")) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="h-48 animate-pulse rounded-3xl bg-slate-100" />
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-10 py-12 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Hesap Merkezi</p>
        <h1 className="mt-4 text-4xl font-semibold">
          {user?.displayName || user?.email?.split("@")[0] || "Misafir"}
        </h1>
        <p className="mt-2 text-emerald-100">{user?.email}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-emerald-100">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Üyelik yılı</p>
            <p className="text-lg font-medium">{stats[2].value}</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-slate-100"
          >
            Profil bilgilerini düzenle
          </button>
          <Link
            href="/products"
            className="rounded-full border border-white/60 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Ürünleri keşfet
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.slice(0, 2).map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Yorum geçmişi</h2>
              <p className="text-sm text-slate-500">Yaptığın tüm incelemeleri yönet</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              Toplam {comments.length}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {comments.length ? (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <strong className="text-slate-900">{comment.productName}</strong>
                    <span>{comment.createdAt}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{comment.content}</p>
                  <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {comment.rating.toFixed(1)} / 5
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Henüz yorum eklememişsin. Ürün detay sayfasından deneyimini paylaşabilirsin.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Favori ürünler</h2>
              <p className="text-sm text-slate-500">Tek tıkla listeden çıkar veya detayına git</p>
            </div>
            <Link href="/products" className="text-sm font-semibold text-emerald-600 underline">
              Yeni ürün ekle
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {favorites.length ? (
              favorites.map((favorite) => (
                <div key={favorite.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{favorite.brand}</p>
                    <p className="text-lg font-semibold text-slate-900">{favorite.name}</p>
                    {favorite.priceRange && <p className="text-sm text-slate-500">{favorite.priceRange}</p>}
                  </div>
                  <Link
                    href={{ pathname: "/products/[id]", query: { id: favorite.id } }}
                    className="rounded-full border border-emerald-600 px-4 py-1 text-sm font-semibold text-emerald-700"
                  >
                    İncele
                  </Link>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Henüz favori ürün eklemedin.
              </p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}

