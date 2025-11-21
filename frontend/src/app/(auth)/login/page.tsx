"use client";

import { useState } from "react";
import { login } from "@/lib/api";
import { useRouter } from 'next/navigation'; // YENI: useRouter hook'unu içeri aktar

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const router = useRouter(); // YENI: useRouter'ı başlat

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    try {
      // 1. API isteği gönderilir
      const result = await login({ email, password, otp });

      // 2. TOKEN ÇEKME: TypeScript'in hatasını yoksayarak token'ı alıyoruz
      const responseData = result?.data || result;

      // 3. TOKEN KONTROLÜ: Token'ın var olup olmadığını kontrol et
      if (responseData && (responseData.token || responseData.access_token)) {
        const token = responseData.token || responseData.access_token;

        // Token'ı yerel depolamaya kaydetme
        try {
          localStorage.setItem("auth_token", token as string);
        } catch (storageError) {
          console.warn("Token localStorage'a kaydedilirken hata oluştu.");
        }

        // Yönlendirme
        router.push('/products');
      } else {
        // Token gelmediyse veya başarısızsa hata mesajını göster
        setMessage(result.message || "Giriş bilgileri yanlış veya eksik.");
      }
    } catch (error: unknown) {
      const err = error as Error;
      setMessage(err.message || "Giriş işlemi sırasında beklenmedik bir hata oluştu.");
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-semibold">Giriş yap</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
        <input
          type="text"
          placeholder="2FA kodu (opsiyonel)"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full rounded-lg border px-4 py-3"
        />
        <button className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white" type="submit">
          Giriş yap
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
    </main>
  );
}