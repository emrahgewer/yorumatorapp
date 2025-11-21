"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
  imageUrl?: string;
  images?: string[];
};

type Review = {
  id: string;
  author: string;
  rating: number;
  content: string;
  createdAt: string;
  createdAtDate?: Date;
};

function StarRating({ rating, size = "xl" }: { rating: number; size?: "xl" | "base" }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const sizeClass = size === "base" ? "!text-base !leading-none" : "!text-xl";

  return (
    <div className="flex items-center text-accent">
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className={`material-symbols-outlined ${sizeClass}`}>
          star
        </span>
      ))}
      {hasHalfStar && (
        <span className={`material-symbols-outlined ${sizeClass}`}>star_half</span>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <span
          key={`empty-${i}`}
          className={`material-symbols-outlined ${sizeClass} text-slate-300 dark:text-slate-600`}
        >
          star
        </span>
      ))}
    </div>
  );
}

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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filterRating, setFilterRating] = useState("all");

  const fetchReviews = useCallback(async () => {
    if (!productId) return;

    setLoadingReviews(true);
    try {
      const reviewsRef = collection(firestore, "reviews");
      const reviewsQuery = query(reviewsRef, where("productId", "==", productId));
      const snapshot = await getDocs(reviewsQuery);
      const items: Review[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        let createdAt: Date;
        if (data.createdAt?.toDate && typeof data.createdAt.toDate === "function") {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt?.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt;
        } else {
          createdAt = new Date();
        }
        return {
          id: doc.id,
          author: data.author ?? "Anonim kullanıcı",
          rating: data.rating ?? 0,
          content: data.content ?? "",
          createdAt: createdAt.toLocaleDateString("tr-TR"),
          createdAtDate: createdAt,
        };
      });
      setReviews(items);
    } catch (error) {
      console.error("Yorumlar alınırken hata:", error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

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
            imageUrl: data.imageUrl,
            images: data.images ?? [],
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
  }, [productId, router, user, fetchReviews]);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return product?.average_rating ?? 0;
    }
    const sum = reviews.reduce((acc, review) => acc + (review.rating ?? 0), 0);
    return parseFloat((sum / reviews.length).toFixed(1));
  }, [reviews, product?.average_rating]);

  const filteredAndSortedReviews = useMemo(() => {
    let filtered = [...reviews];

    // Rating filtresi
    if (filterRating !== "all") {
      const ratingNum = parseInt(filterRating);
      filtered = filtered.filter((review) => Math.floor(review.rating) === ratingNum);
    }

    // Sıralama
    if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const dateA = a.createdAtDate?.getTime() ?? new Date(a.createdAt.split(".").reverse().join("-")).getTime();
        const dateB = b.createdAtDate?.getTime() ?? new Date(b.createdAt.split(".").reverse().join("-")).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => {
        const dateA = a.createdAtDate?.getTime() ?? new Date(a.createdAt.split(".").reverse().join("-")).getTime();
        const dateB = b.createdAtDate?.getTime() ?? new Date(b.createdAt.split(".").reverse().join("-")).getTime();
        return dateA - dateB;
      });
    } else if (sortBy === "highest") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }, [reviews, sortBy, filterRating]);

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const reviewDate = typeof date === "string" 
      ? new Date(date.split(".").reverse().join("-"))
      : date;
    const diffMs = now.getTime() - reviewDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Bugün";
    if (diffDays === 1) return "1 gün önce";
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`;
    return `${Math.floor(diffDays / 365)} yıl önce`;
  };

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError("Yorum yapmak için giriş yapmalısınız.");
      router.push(`/login?redirect=/products/${productId}`);
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
        userId: user.uid,
        author: user.displayName || user.email || "Anonim kullanıcı",
        rating: formState.rating,
        content: formState.content.trim(),
        createdAt: serverTimestamp(),
      });

      setFormState({ rating: 4, content: "" });
      setShowReviewForm(false);
      await fetchReviews();
    } catch (error) {
      console.error("Yorum eklenirken hata:", error);
      setFormError("Yorum kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !productId) {
      if (!user) {
        router.push(`/login?redirect=/products/${productId}`);
      }
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
      <div className="relative flex min-h-screen w-full flex-col">
        <div className="h-96 animate-pulse bg-slate-200" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-6">
        <p className="text-lg text-slate-600">Bu ürün bulunamadı veya kaldırıldı.</p>
        <Link href="/products" className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm">
          Ürün listesine dön
        </Link>
      </div>
    );
  }

  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : product.imageUrl 
    ? [product.imageUrl] 
    : [];

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-md flex-1 flex-col">
          <header className="absolute top-0 left-0 z-10 flex w-full items-center justify-between p-4">
            <button
              onClick={() => router.back()}
              className="flex size-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm dark:bg-slate-800/80"
            >
              <span className="material-symbols-outlined text-text-light dark:text-text-dark">
                arrow_back
              </span>
            </button>
            <button
              onClick={handleToggleFavorite}
              className="flex size-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm dark:bg-slate-800/80"
            >
              <span className="material-symbols-outlined text-text-light dark:text-text-dark">
                {isFavorite ? "favorite" : "favorite_border"}
              </span>
            </button>
          </header>

          <main className="flex flex-1 flex-col">
            <div className="relative w-full">
              <div
                className="flex overflow-x-auto snap-x scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {productImages.length > 0 ? (
                  productImages.map((image, index) => (
                    <div key={index} className="w-full flex-shrink-0 snap-center">
                      <div
                        className="aspect-square w-full bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url("${image}")` }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="w-full flex-shrink-0 snap-center">
                    <div className="flex aspect-square w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                      <span className="material-symbols-outlined text-6xl text-slate-400">
                        image
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 p-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold text-primary">{product.brand}</p>
                <h1 className="text-3xl font-bold tracking-tight">{product.model}</h1>
                <div className="flex items-center gap-2">
                  <StarRating rating={averageRating} />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {averageRating.toFixed(1)} ({reviews.length} yorum)
                  </p>
                </div>
              </div>

              {product.summary && (
                <div className="flex flex-col gap-4">
                  <div className="border-b border-slate-200 dark:border-slate-700">
                    <h2 className="inline-block border-b-2 border-primary pb-2 text-lg font-bold">
                      Açıklama
                    </h2>
                  </div>
                  <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                    {product.summary}
                  </p>
                </div>
              )}

              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="border-b border-slate-200 dark:border-slate-700">
                    <h2 className="pb-2 text-lg font-bold">Teknik Özellikler</h2>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <li key={key} className="flex justify-between">
                        <span className="font-medium text-text-light dark:text-text-dark">
                          {key}:
                        </span>
                        <span>{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h2 className="text-lg font-bold">Kullanıcı Yorumları</h2>
                </div>

                {!showReviewForm && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-background-light text-sm focus:border-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-800"
                      >
                        <option value="newest">En Yeni</option>
                        <option value="oldest">En Eski</option>
                        <option value="highest">En Beğenilen</option>
                      </select>
                      <select
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-background-light text-sm focus:border-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-800"
                      >
                        <option value="all">Tüm Puanlar</option>
                        <option value="5">5 Yıldız</option>
                        <option value="4">4 Yıldız</option>
                        <option value="3">3 Yıldız</option>
                        <option value="2">2 Yıldız</option>
                        <option value="1">1 Yıldız</option>
                      </select>
                    </div>
                  </div>
                )}

                {showReviewForm ? (
                  <form
                    onSubmit={handleSubmitReview}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4"
                  >
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Puan
                      <input
                        type="number"
                        min={1}
                        max={5}
                        step={0.5}
                        value={formState.rating}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, rating: Number(event.target.value) }))
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </label>
                    <textarea
                      placeholder="Deneyimini birkaç cümleyle paylaş"
                      value={formState.content}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, content: event.target.value }))
                      }
                      className="h-24 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    />
                    {formError && <p className="text-sm text-rose-500">{formError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent/90 disabled:opacity-60"
                      >
                        Gönder
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {loadingReviews ? (
                      <div className="space-y-3">
                        {Array.from({ length: 2 }).map((_, index) => (
                          <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
                        ))}
                      </div>
                    ) : filteredAndSortedReviews.length > 0 ? (
                      filteredAndSortedReviews.map((review) => (
                        <div key={review.id} className="flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            <div className="size-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-base">
                                account_circle
                              </span>
                            </div>
                            <div className="flex flex-col w-full">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-bold">{review.author}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatTimeAgo(review.createdAtDate ?? review.createdAt)}
                                  </p>
                                </div>
                                <StarRating rating={review.rating} size="base" />
                              </div>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            {review.content}
                          </p>
                          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                            <button className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-primary dark:hover:text-white">
                              <span className="material-symbols-outlined !text-lg !font-light">thumb_up</span>
                              <span>0</span>
                            </button>
                            <button className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-primary dark:hover:text-white">
                              <span className="material-symbols-outlined !text-lg !font-light">thumb_down</span>
                              <span>0</span>
                            </button>
                            <button className="flex items-center gap-1.5 ml-auto text-xs font-medium transition-colors hover:text-primary dark:hover:text-white">
                              <span className="material-symbols-outlined !text-lg !font-light">reply</span>
                              Yanıtla
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
                        Bu filtreye uygun yorum bulunamadı.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>

          {!showReviewForm && (
            <footer className="sticky bottom-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <button
                onClick={() => {
                  if (!user) {
                    router.push(`/login?redirect=/products/${productId}`);
                  } else {
                    setShowReviewForm(true);
                  }
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-bold text-white"
              >
                <span className="material-symbols-outlined">edit</span>
                Yorum Yap
              </button>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
