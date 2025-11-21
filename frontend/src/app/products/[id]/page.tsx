"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import RatingStars from "@/components/RatingStars";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  setDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type Product = {
  id: string;
  brand: string;
  model: string;
  summary?: string;
  highlights?: string[];
  priceRange?: string;
  specs?: Record<string, string>;
  average_rating?: number;
};

type Review = {
  id: string;
  author: string;
  rating: number;
  content: string;
  createdAt: string;
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [formState, setFormState] = useState({ rating: 4, content: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) {
      router.replace("/products");
      return;
    }

    const fetchProduct = async () => {
      setLoadingProduct(true);
      try {
        const productRef = doc(firestore, "products", productId);
        const snapshot = await getDoc(productRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProduct({
            id: snapshot.id,
            brand: data.brand ?? "Markasız",
            model: data.model ?? "Model",
            summary: data.summary,
            highlights: data.highlights ?? [],
            priceRange: data.priceRange,
            specs: data.specs ?? {},
            average_rating: data.average_rating,
          });
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Ürün bilgisi alınırken hata:", error);
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    };

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const reviewsRef = collection(firestore, "reviews");
        const reviewsQuery = query(
          reviewsRef,
          where("productId", "==", productId),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(reviewsQuery);
        const items: Review[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt ?? new Date();
          return {
            id: doc.id,
            author: data.author ?? "Anonim kullanıcı",
            rating: data.rating ?? 0,
            content: data.content ?? "",
            createdAt: new Date(createdAt).toLocaleDateString("tr-TR"),
          };
        });
        setReviews(items);
      } catch (error) {
        console.error("Yorumlar alınırken hata:", error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    const checkFavorite = async () => {
      if (!user || !productId) {
        setIsFavorite(false);
        return;
      }
      try {
        const favoriteDoc = await getDoc(doc(firestore, "favorites", `${user.uid}_${productId}`));
        setIsFavorite(favoriteDoc.exists());
      } catch (error) {
        console.error("Favori kontrolü sırasında hata:", error);
        setIsFavorite(false);
      }
    };

    fetchProduct();
    fetchReviews();
    checkFavorite();
  }, [productId, router, user]);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return product?.average_rating ?? 0;
    }
    const sum = reviews.reduce((acc, review) => acc + (review.rating ?? 0), 0);
    return parseFloat((sum / reviews.length).toFixed(1));
  }, [reviews, product?.average_rating]);

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError("Yorum yapmak için giriş yapmalısınız.");
      return;
    }
    if (!formState.content.trim()) {
      setFormError("Lütfen deneyiminizi birkaç cümleyle paylaşın.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, "reviews"), {
        productId,
        author: user.displayName || user.email || "Anonim kullanıcı",
        rating: formState.rating,
        content: formState.content.trim(),
        createdAt: serverTimestamp(),
      });

      setFormState({ rating: 4, content: "" });

      setReviews((prev) => [
        {
          id: `temp-${Date.now()}`,
          author: user.displayName || user.email || "Anonim kullanıcı",
          rating: formState.rating,
          content: formState.content.trim(),
          createdAt: new Date().toLocaleDateString("tr-TR"),
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Yorum eklenirken hata:", error);
      setFormError("Yorum kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !productId) {
      setFormError("Favori eklemek için giriş yapmalısınız.");
      return;
    }

    const favoriteRef = doc(firestore, "favorites", `${user.uid}_${productId}`);
    try {
      if (isFavorite) {
        await deleteDoc(favoriteRef);
        setIsFavorite(false);
      } else {
        await setDoc(favoriteRef, {
          userId: user.uid,
          productId,
          createdAt: serverTimestamp(),
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Favori güncellenirken hata:", error);
      setFormError("Favori işlemi sırasında bir hata oluştu.");
    }
  };

  if (loadingProduct) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
        <div className="mt-6 h-24 animate-pulse rounded-2xl bg-slate-200" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 text-center">
        <p className="text-lg text-slate-600">Bu ürün bulunamadı veya kaldırıldı.</p>
        <Link href="/products" className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm">
          Ürün listesine dön
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">{product.brand}</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <h1 className="text-4xl font-semibold text-slate-900">{product.model}</h1>
          <RatingStars rating={averageRating} />
          <span className="text-sm text-slate-500">{reviews.length} yorum</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
              isFavorite
                ? "bg-rose-100 text-rose-600"
                : "border border-rose-200 text-rose-500 hover:bg-rose-50"
            }`}
          >
            {isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
          </button>
        </div>
        {product.summary && <p className="mt-4 text-slate-600">{product.summary}</p>}
        {product.priceRange && (
          <div className="mt-6 inline-flex rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            {product.priceRange}
          </div>
        )}
        {product.highlights && product.highlights.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
            {product.highlights.map((highlight) => (
              <li key={highlight} className="rounded-full bg-slate-100 px-3 py-1">
                {highlight}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Teknik Özellikler</h2>
          {product.specs && Object.keys(product.specs).length ? (
            <dl className="mt-4 grid gap-3 text-sm text-slate-600">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <dt className="font-medium text-slate-500">{key}</dt>
                  <dd className="text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Bu ürün için teknik bilgiler yakında eklenecek.</p>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Yorumlar</h2>
              <p className="text-sm text-slate-500">Deneyimini paylaşarak topluluğa katkı sağla</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              {reviews.length} yorum
            </span>
          </div>

          <form onSubmit={handleSubmitReview} className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <label className="text-sm font-medium text-slate-700">
              Puan
              <input
                type="number"
                min={1}
                max={5}
                step={0.5}
                value={formState.rating}
                onChange={(event) => setFormState((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </label>
            <textarea
              placeholder="Deneyimini birkaç cümleyle paylaş"
              value={formState.content}
              onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
              className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
            {formError && <p className="text-sm text-rose-500">{formError}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
            >
              Yorum gönder
            </button>
          </form>

          <div className="mt-6 space-y-4">
            {loadingReviews ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : reviews.length ? (
              reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{review.author}</p>
                    <span className="text-xs text-slate-500">{review.createdAt}</span>
                  </div>
                  <div className="mt-1 text-sm text-emerald-600">{review.rating.toFixed(1)} / 5</div>
                  <p className="mt-2 text-sm text-slate-600">{review.content}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Bu ürün için henüz yorum yapılmamış. İlk yorumu sen ekle!
              </p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}

