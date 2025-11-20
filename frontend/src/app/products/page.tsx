import ProductCard from "@/components/ProductCard";

const sampleProducts = [
  {
    id: "1",
    brand: "Samsung",
    model: "Neo QLED 65",
    rating: 4.7,
    reviewCount: 128,
    highlights: ["Ekran kalitesi", "HDR parlaklığı"],
  },
  {
    id: "2",
    brand: "Apple",
    model: "MacBook Air M4",
    rating: 4.8,
    reviewCount: 205,
    highlights: ["Pil ömrü", "Sessiz çalışma"],
  },
];

export default function ProductsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Elektronik ürün kataloğu</h1>
      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {sampleProducts.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </section>
    </main>
  );
}
