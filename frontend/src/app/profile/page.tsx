"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  price: string;
  badge?: string;
};

const mockUser = {
  name: "Emrah Gever",
  email: "emrah@example.com",
  memberSince: "2023",
  plan: "Pro Üyelik",
  badges: ["Teknoloji Avcısı", "Topluluk Destekçisi"],
};

const mockComments: Comment[] = [
  {
    id: "rev-101",
    productName: "Samsung Neo QLED 65",
    rating: 4.5,
    content: "Parlaklık ve oyun modundaki gecikme değerleri beklentimin üzerinde, yalnızca siyah dengesi biraz uğraş istiyor.",
    createdAt: "2 gün önce",
  },
  {
    id: "rev-102",
    productName: "Apple MacBook Air M4",
    rating: 4.8,
    content: "MacOS tarafında pil ömrü gerçek bir bonus. Fan olmadığı için uzun kullanımda bile serin kalıyor.",
    createdAt: "1 hafta önce",
  },
];

const mockFavorites: FavoriteProduct[] = [
  { id: "1", name: "Neo QLED 65", brand: "Samsung", price: "67.999₺", badge: "En Çok İncelenen" },
  { id: "2", name: "MacBook Air M4", brand: "Apple", price: "59.999₺" },
  { id: "3", name: "WH-1000XM6", brand: "Sony", price: "14.999₺", badge: "Yeni" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>(mockFavorites);
  const [newComment, setNewComment] = useState({ productName: "", content: "", rating: 4 });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login?redirect=/profile");
    } else {
      setIsReady(true);
    }
  }, [router]);

  const stats = useMemo(
    () => [
      { label: "Toplam yorum", value: comments.length },
      { label: "Favoriler", value: favorites.length },
      { label: "Rozetler", value: mockUser.badges.length },
    ],
    [comments.length, favorites.length]
  );

  const handleAddComment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newComment.productName.trim() || !newComment.content.trim()) {
      return;
    }
    setComments((prev) => [
      {
        id: `rev-${Date.now()}`,
        productName: newComment.productName,
        rating: newComment.rating,
        content: newComment.content,
        createdAt: "az önce",
      },
      ...prev,
    ]);
    setNewComment({ productName: "", content: "", rating: 4 });
  };

  const handleRemoveFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((favorite) => favorite.id !== id));
  };

  if (!isReady) {
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
        <h1 className="mt-4 text-4xl font-semibold">{mockUser.name}</h1>
        <p className="mt-2 text-emerald-100">{mockUser.email}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-emerald-100">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Üyelik</p>
            <p className="text-lg font-medium">{mockUser.plan}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Toplulukta</p>
            <p className="text-lg font-medium">{mockUser.memberSince}’ten beri</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {mockUser.badges.map((badge) => (
            <span key={badge} className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold">
              {badge}
            </span>
          ))}
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
        {stats.map((stat) => (
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

          <form onSubmit={handleAddComment} className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <input
              type="text"
              placeholder="Ürün adı"
              value={newComment.productName}
              onChange={(event) => setNewComment((prev) => ({ ...prev, productName: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
            <textarea
              placeholder="Deneyimini paylaş"
              value={newComment.content}
              onChange={(event) => setNewComment((prev) => ({ ...prev, content: event.target.value }))}
              className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
            <button
              type="submit"
              className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Yeni yorum ekle
            </button>
          </form>

          <ul className="mt-6 space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <strong className="text-slate-900">{comment.productName}</strong>
                  <span>{comment.createdAt}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{comment.content}</p>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                    {comment.rating.toFixed(1)} / 5
                  </span>
                  <button type="button" className="text-slate-400 underline">
                    Düzenle
                  </button>
                  <button type="button" className="text-rose-500 underline">
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
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
            {favorites.map((favorite) => (
              <div key={favorite.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{favorite.brand}</p>
                  <p className="text-lg font-semibold text-slate-900">{favorite.name}</p>
                  <p className="text-sm text-slate-500">{favorite.price}</p>
                  {favorite.badge && (
                    <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {favorite.badge}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/products/${favorite.id}`}
                    className="rounded-full border border-emerald-600 px-4 py-1 text-sm font-semibold text-emerald-700"
                  >
                    İncele
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(favorite.id)}
                    className="rounded-full border border-rose-200 px-4 py-1 text-sm font-semibold text-rose-500"
                  >
                    Çıkar
                  </button>
                </div>
              </div>
            ))}
            {!favorites.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Henüz favori eklenmemiş.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Hesap ayarları</h2>
            <p className="text-sm text-slate-500">Bildirim tercihleri ve gizlilik ayarlarını yönet</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
          >
            Ayarları düzenle
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Yeni yorum bildirimi al
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Kampanya e-postalarını aç
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Kişiselleştirilmiş önerileri göster
          </label>
        </div>
      </section>
    </main>
  );
}

