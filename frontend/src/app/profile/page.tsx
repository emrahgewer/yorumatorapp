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
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

type Comment = {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  rating: number;
  content: string;
  createdAt: string;
  createdAtDate?: Date;
};

function StarRating({ rating, size = "base" }: { rating: number; size?: "xl" | "base" }) {
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

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true);
      try {
        const reviewsRef = collection(firestore, "reviews");
        const reviewsQuery = query(reviewsRef, where("userId", "==", user.uid));
        const reviewSnapshot = await getDocs(reviewsQuery);
        const mappedReviews: Comment[] = await Promise.all(
          reviewSnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            let productName = "Bilinmeyen ürün";
            let productImage: string | undefined;
            if (data.productId) {
              try {
                const productDoc = await getDoc(doc(firestore, "products", data.productId));
                if (productDoc.exists()) {
                  const productData = productDoc.data();
                  productName = `${productData.brand ?? ""} ${productData.model ?? ""}`.trim();
                  productImage = productData.imageUrl || productData.images?.[0];
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
              productId: data.productId ?? "",
              productName,
              productImage,
              rating: data.rating ?? 0,
              content: data.content ?? "",
              createdAt: createdAt.toLocaleDateString("tr-TR"),
              createdAtDate: createdAt,
            };
          })
        );
        mappedReviews.sort((a, b) => {
          const dateA = a.createdAtDate?.getTime() ?? new Date(a.createdAt.split(".").reverse().join("-")).getTime();
          const dateB = b.createdAtDate?.getTime() ?? new Date(b.createdAt.split(".").reverse().join("-")).getTime();
          return dateB - dateA;
        });
        setComments(mappedReviews);
      } catch (error) {
        console.error("Profil verileri alınırken hata:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

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

  const lastCommentDate = useMemo(() => {
    if (comments.length === 0) return null;
    const lastComment = comments[0];
    return formatTimeAgo(lastComment.createdAtDate ?? lastComment.createdAt);
  }, [comments]);

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(firestore, "reviews", commentId));
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error("Yorum silinirken hata:", error);
      alert("Yorum silinirken bir hata oluştu.");
    }
  };

  if (authLoading || isLoading || (!user && typeof window !== "undefined")) {
    return (
      <div className="relative flex min-h-screen w-full flex-col">
        <div className="h-96 animate-pulse bg-slate-200" />
      </div>
    );
  }

  const userName = user?.displayName || user?.email?.split("@")[0] || "Kullanıcı";
  const userBadge = comments.length >= 10 ? "Deneyimli Yorumcu" : comments.length >= 5 ? "Aktif Yorumcu" : "Yeni Üye";

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-md flex-1 flex-col">
          <header className="flex items-center justify-between whitespace-nowrap p-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-primary text-2xl">
                <span className="material-symbols-outlined !text-4xl">memory</span>
              </div>
              <h1 className="text-xl font-bold tracking-[-0.015em]">Elektronik</h1>
            </Link>
            <button className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </header>

          <main className="flex flex-col gap-6 p-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="size-24 rounded-full border-4 border-white bg-slate-300 dark:border-slate-800 dark:bg-slate-700 shadow-md flex items-center justify-center">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={userName}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-6xl text-slate-600 dark:text-slate-300">
                      account_circle
                    </span>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white transition-colors hover:bg-blue-800 dark:border-slate-800">
                  <span className="material-symbols-outlined !text-base">edit</span>
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold">{userName}</h2>
                <div className="flex items-center justify-center gap-2 text-primary">
                  <span className="material-symbols-outlined !text-lg">military_tech</span>
                  <p className="text-sm font-semibold">{userBadge}</p>
                </div>
                {lastCommentDate && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Son Yorum: {lastCommentDate}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="text-slate-500 transition-colors hover:text-primary"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.67.88-.53 1.56-1.37 1.88-2.38-.83.49-1.74.85-2.7 1.03A4.5 4.5 0 0 0 16.46 4c-2.45 0-4.43 1.98-4.43 4.43 0 .35.04.69.12 1.02-3.68-.18-6.94-1.95-9.13-4.63-.38.65-.6 1.41-.6 2.22 0 1.54.78 2.89 1.97 3.68-.72-.02-1.4-.22-1.99-.55v.06c0 2.15 1.53 3.94 3.55 4.34-.37.1-.76.15-1.16.15-.28 0-.56-.03-.83-.08.57 1.76 2.21 3.05 4.16 3.08-1.52 1.19-3.44 1.9-5.52 1.9-.36 0-.71-.02-1.06-.06 1.96 1.26 4.3 2 6.79 2 8.15 0 12.6-6.75 12.6-12.6 0-.19 0-.38-.01-.57.86-.62 1.6-1.4 2.2-2.28z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-slate-500 transition-colors hover:text-primary"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 6a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0zm-1.87 1.625a3.625 3.625 0 1 0-7.25 0 3.625 3.625 0 0 0 7.25 0zM12 1.25C5.97 1.25 1.25 5.97 1.25 12S5.97 22.75 12 22.75 22.75 18.03 22.75 12 18.03 1.25 12 1.25zm0 19.5c-5.1 0-9.25-4.15-9.25-9.25S6.9 2.75 12 2.75 21.25 6.9 21.25 12s-4.15 9.25-9.25 9.25zm8.12-11.37a.937.937 0 1 1-1.87 0 .937.937 0 0 1 1.87 0z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-slate-500 transition-colors hover:text-primary"
                  onClick={(e) => e.preventDefault()}
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-bold">İstatistikler</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                    <span className="material-symbols-outlined">category</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Favori Kategori</p>
                    <p className="font-bold">Akıllı Telefon</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                    <span className="material-symbols-outlined">favorite</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Yorum</p>
                    <p className="font-bold">{comments.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800 col-span-1 sm:col-span-2">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                    <span className="material-symbols-outlined">visibility</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Yorum Görüntülenmesi</p>
                    <p className="font-bold">{comments.length * 12}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold">Yorum Geçmişi</h3>
              <div className="flex flex-col gap-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800"
                    >
                      <div className="flex gap-4">
                        <div
                          className="h-16 w-16 shrink-0 rounded-lg bg-cover bg-center bg-no-repeat bg-slate-100 dark:bg-slate-700"
                          style={{
                            backgroundImage: comment.productImage
                              ? `url("${comment.productImage}")`
                              : "none",
                          }}
                        >
                          {!comment.productImage && (
                            <div className="flex h-full items-center justify-center">
                              <span className="material-symbols-outlined text-2xl text-slate-400">
                                image
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold">{comment.productName}</p>
                          <StarRating rating={comment.rating} />
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined !text-lg text-green-500">
                              thumb_up
                            </span>
                            <span>0</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined !text-lg text-red-500">
                              thumb_down
                            </span>
                            <span>0</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/products/${comment.productId}`)}
                            className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <span className="material-symbols-outlined !text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex size-8 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <span className="material-symbols-outlined !text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                    Henüz yorum eklememişsin. Ürün detay sayfasından deneyimini paylaşabilirsin.
                  </div>
                )}
              </div>
            </div>
          </main>

          <nav className="sticky bottom-0 border-t border-slate-200 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)] dark:border-slate-700 dark:bg-slate-800">
            <div className="mx-auto flex h-16 max-w-md justify-around">
              <Link
                href="/"
                className="flex w-full flex-col items-center justify-center text-slate-500 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-primary"
              >
                <span className="material-symbols-outlined">home</span>
                <span className="text-xs">Ana Sayfa</span>
              </Link>
              <Link
                href="/products"
                className="flex w-full flex-col items-center justify-center text-slate-500 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-primary"
              >
                <span className="material-symbols-outlined">search</span>
                <span className="text-xs">Keşfet</span>
              </Link>
              <Link
                href="/profile"
                className="flex w-full flex-col items-center justify-center font-bold text-primary dark:text-accent"
              >
                <span className="material-symbols-outlined">person</span>
                <span className="text-xs">Profil</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
