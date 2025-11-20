"use client";

import { useState } from "react";
import { register } from "@/lib/api";
import { useRouter } from 'next/navigation'; // YENI: useRouter hook'unu içeri aktar

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [twoFactor, setTwoFactor] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const router = useRouter(); // YENI: useRouter'ı başlat

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await register({ email, password, full_name: fullName, two_factor_enabled: twoFactor });
    
    // YENI: Kayıt başarılı olduğunda kullanıcıyı giriş sayfasına yönlendir
    if (response && response.message === "Kayıt başarılı") { // Başarılı mesajını kontrol ediyoruz
      router.push('/login'); // Kullanıcı giriş sayfasına yönlendirilir
    } else {
      setMessage(response.message || "Kayıt işlemi başarısız oldu.");
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-semibold">Hesap oluştur</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="text"
          placeholder="Ad Soyad"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border px-4 py-3"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-4 py-3"
          required
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-4 py-3"
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} />
          İki faktörlü doğrulamayı etkinleştir
        </label>
        <button className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white" type="submit">
          Kaydol
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
    </main>
  );
}