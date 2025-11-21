"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

type Product = {
  id: string;
  brand: string;
  model: string;
  average_rating?: number;
  imageUrl?: string;
  tags?: string[];
};

const categories = [
  { id: "all", name: "Tümü" },
  { id: "phone", name: "Akıllı Telefon" },
  { id: "laptop", name: "Dizüstü" },
  { id: "headphone", name: "Kulaklık" },
  { id: "samsung", name: "Samsung" },
  { id: "apple", name: "Apple" },
];

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center text-accent">
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="material-symbols-outlined !text-lg">
          star
        </span>
      ))}
      {hasHalfStar && (
        <span className="material-symbols-outlined !text-lg">star_half</span>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <span
          key={`empty-${i}`}
          className="material-symbols-outlined !text-lg text-slate-300 dark:text-slate-600"
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const snapshot = await getDocs(collection(firestore, "products"));
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(docs);
      } catch (error) {
        console.error("Ürünler alınırken hata:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory !== "all") {
      if (selectedCategory === "samsung") {
        filtered = filtered.filter((p) => p.brand.toLowerCase() === "samsung");
      } else if (selectedCategory === "apple") {
        filtered = filtered.filter((p) => p.brand.toLowerCase() === "apple");
      } else {
        filtered = filtered.filter((p) =>
          p.tags?.some((tag) => tag.toLowerCase().includes(selectedCategory))
        );
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.brand.toLowerCase().includes(query) ||
          p.model.toLowerCase().includes(query)
      );
    }

    return filtered.slice(0, 6);
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <div className="flex flex-1 w-full">
        <div className="flex w-full max-w-7xl mx-auto flex-1 flex-col px-4 md:px-6">
          <header className="flex items-center justify-between whitespace-nowrap py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="text-primary text-2xl">
                <span className="material-symbols-outlined !text-4xl">memory</span>
              </div>
              <h1 className="text-xl font-bold tracking-[-0.015em]">Elektronik</h1>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Link
                  href="/profile"
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-slate-300 dark:bg-slate-700 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">
                    account_circle
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </header>

          <main className="flex flex-col gap-4 py-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-4xl font-black leading-tight tracking-[-0.033em]">
                Ürünleri Keşfet
              </h2>
            </div>

            <div className="py-2">
              <label className="flex min-h-14 w-full flex-col">
                <div className="flex h-full w-full flex-1 items-stretch rounded-xl shadow-sm">
                  <div className="flex items-center justify-center rounded-l-xl border-r-0 bg-white dark:bg-slate-800 pl-4 text-slate-500">
                    <span className="material-symbols-outlined !text-2xl">search</span>
                  </div>
                  <input
                    className="form-input flex h-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl border-none bg-white px-4 pl-2 text-base font-normal leading-normal text-slate-900 placeholder:text-slate-500 focus:outline-0 focus:ring-2 focus:ring-primary/50 dark:bg-slate-800 dark:text-slate-200"
                    placeholder="Marka, model veya kategori ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </label>
            </div>

            <div
              className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex h-10 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-xl px-4 ${
                    selectedCategory === category.id
                      ? "bg-primary"
                      : "bg-white dark:bg-slate-800"
                  }`}
                >
                  <p
                    className={`text-sm font-medium leading-normal ${
                      selectedCategory === category.id ? "text-white" : ""
                    }`}
                  >
                    {category.name}
                  </p>
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-md shadow-slate-200/50 dark:bg-slate-800 dark:shadow-black/20"
                    >
                      <div
                        className="w-full aspect-square bg-center bg-cover bg-no-repeat rounded-lg bg-slate-100 dark:bg-slate-700"
                        style={{
                          backgroundImage: product.imageUrl
                            ? `url("${product.imageUrl}")`
                            : "none",
                        }}
                      >
                        {!product.imageUrl && (
                          <div className="flex h-full items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-slate-400">
                              image
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-base font-bold">{product.brand}</p>
                        <p className="text-sm font-normal text-slate-600 dark:text-slate-400">
                          {product.model}
                        </p>
                        {product.average_rating && (
                          <StarRating rating={product.average_rating} />
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500">
                    Ürün bulunamadı
                  </div>
                )}
              </div>
            )}

            {!isLoading && filteredProducts.length > 0 && (
              <Link
                href="/products"
                className="mt-4 rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Tüm Ürünleri Gör
              </Link>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
