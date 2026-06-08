"use client";
import { useState, useEffect, useRef } from "react";

const LOADING_MESSAGES: Record<string, string[]> = {
  ramsay: [
    "Ajustement du niveau de méchanceté...",
    "Analyse des pixels criminels...",
    "Préparation du venin...",
    "Appel de Gordon Ramsay...",
  ],
  sweet: [
    "Préparation des compliments...",
    "Analyse des points forts...",
    "Brassage des encouragements...",
    "Le coach consulte ses notes...",
  ],
};

export default function Home() {
  const [mode, setMode] = useState<"ramsay" | "sweet">("ramsay");
  const [inputMode, setInputMode] = useState<"image" | "url">("image");

  // Image upload state
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL state
  const [url, setUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [displayScore, setDisplayScore] = useState(0);

  const isRamsay = mode === "ramsay";
  const accentClass = isRamsay
    ? "bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)]"
    : "bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.3)]";

  const canSubmit = inputMode === "image" ? !!image : url.trim().length > 0;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      interval = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES[mode].length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading, mode]);

  useEffect(() => {
    if (result?.score !== undefined) {
      setDisplayScore(0);
      const duration = 1500;
      const steps = 20;
      const stepValue = result.score / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += stepValue;
        if (current >= result.score) {
          setDisplayScore(result.score);
          clearInterval(timer);
        } else {
          setDisplayScore(Number(current.toFixed(1)));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [result]);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("L'image doit faire moins de 10 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setMimeType(file.type);
      setImage(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleRoast = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);
    setMsgIndex(0);
    try {
      const body =
        inputMode === "image"
          ? { image, mimeType, mode }
          : { url: url.trim(), mode };

      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      alert("Erreur : " + (e.message || "L'IA a planté. Réessaie."));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setImage(null);
    setImagePreview(null);
    setUrl("");
  };

  const shareOnX = () => {
    const tweetText = result?.tweet || `Mon verdict : ${result.score}/10 !`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent("https://roastmylp.vercel.app")}`;
    window.open(shareUrl, "_blank");
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-10 text-center">

        {/* HERO */}
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs font-bold tracking-widest text-orange-500 uppercase">
          AI-Powered Roast ✦ Vision
        </div>
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-6 italic uppercase leading-none">
          Roast My <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
            Landing Page
          </span>
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl max-w-xl mx-auto mb-12 italic">
          L&apos;IA qui juge votre design sans filtre. Préparez-vous à la vérité.
        </p>

        {/* MAIN FORM */}
        {!result && !loading && (
          <div className="max-w-2xl mx-auto space-y-6">

            {/* MODE SELECTOR */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => setMode("ramsay")}
                className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl transition-all ${mode === "ramsay" ? "bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)]" : "bg-neutral-900 border border-neutral-800 opacity-60"}`}
              >
                <span className="text-2xl">🔪</span>
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase opacity-70">Le Chef</div>
                  <div className="font-black italic uppercase">Ramsay Mode</div>
                </div>
              </button>

              <button
                onClick={() => setMode("sweet")}
                className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl transition-all ${mode === "sweet" ? "bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.3)]" : "bg-neutral-900 border border-neutral-800 opacity-60"}`}
              >
                <span className="text-2xl">🧸</span>
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase opacity-70">Le Coach</div>
                  <div className="font-black italic uppercase">Sweet Mode</div>
                </div>
              </button>
            </div>

            {/* INPUT MODE TOGGLE */}
            <div className="flex items-center justify-center gap-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-1 w-fit mx-auto">
              <button
                onClick={() => setInputMode("image")}
                className={`px-5 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${inputMode === "image" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                📸 Screenshot
              </button>
              <button
                onClick={() => setInputMode("url")}
                className={`px-5 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${inputMode === "url" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                🔗 URL
              </button>
            </div>

            {/* IMAGE UPLOAD */}
            {inputMode === "image" && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !imagePreview && fileInputRef.current?.click()}
                className={`relative rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
                  ${imagePreview ? "border-transparent cursor-default" : ""}
                  ${isDragging ? (isRamsay ? "border-red-500 bg-red-950/20" : "border-blue-500 bg-blue-950/20") : imagePreview ? "border-transparent" : "border-neutral-700 bg-neutral-900/30 hover:border-neutral-500"}
                `}
                style={{ minHeight: imagePreview ? "auto" : "200px" }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                />

                {imagePreview ? (
                  <div className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="w-full max-h-72 object-cover rounded-3xl"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImage(null);
                          setImagePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="px-5 py-2.5 bg-white text-black font-black text-sm uppercase tracking-wider rounded-xl"
                      >
                        Changer l&apos;image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-14 px-6 gap-3 pointer-events-none select-none">
                    <div className="text-4xl">📸</div>
                    <div>
                      <p className="font-black uppercase tracking-wider text-base">
                        Déposez votre screenshot ici
                      </p>
                      <p className="text-neutral-500 text-sm mt-1">
                        ou{" "}
                        <span className={`font-bold ${isRamsay ? "text-red-500" : "text-blue-500"}`}>
                          cliquez pour choisir un fichier
                        </span>
                      </p>
                    </div>
                    <p className="text-neutral-600 text-xs">PNG, JPG, WebP — max 10 Mo</p>
                  </div>
                )}
              </div>
            )}

            {/* URL INPUT */}
            {inputMode === "url" && (
              <div className={`flex items-center gap-3 bg-neutral-900 border-2 border-neutral-800 px-5 py-4 rounded-2xl transition-all focus-within:${isRamsay ? "border-red-600" : "border-blue-600"}`}>
                <span className="text-neutral-500 text-lg">🔗</span>
                <input
                  type="url"
                  placeholder="https://ton-site.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRoast()}
                  className="flex-1 bg-transparent outline-none font-bold text-base placeholder:text-neutral-600"
                />
                {url && (
                  <button
                    onClick={() => setUrl("")}
                    className="text-neutral-600 hover:text-white transition-colors text-lg"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {/* CTA BUTTON */}
            <button
              onClick={handleRoast}
              disabled={!canSubmit}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-lg transition-all active:scale-95
                ${canSubmit ? `${accentClass} hover:opacity-90` : "bg-neutral-800 text-neutral-600 cursor-not-allowed"}`}
            >
              {isRamsay ? "🔪 Démarrer le massacre" : "🧸 Obtenir mon feedback"}
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mt-20 space-y-6">
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Analyse en cours"
                className="w-40 h-28 object-cover rounded-2xl mx-auto opacity-40 blur-sm"
              />
            )}
            <div className="text-4xl animate-bounce">⚡</div>
            <p className="text-2xl font-black italic uppercase tracking-tighter animate-pulse text-orange-500">
              {LOADING_MESSAGES[mode][msgIndex]}
            </p>
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-10 max-w-3xl mx-auto p-1 text-left">
            <div
              className={`p-8 md:p-12 rounded-[2.5rem] border-2 shadow-2xl space-y-10 backdrop-blur-xl bg-neutral-900/80
                ${isRamsay ? "border-red-600/30" : "border-blue-600/30"}`}
            >
              {/* HEADER + SCORE */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h2 className="text-5xl font-black italic uppercase tracking-tighter">
                    Verdict Final
                  </h2>
                  <p className="text-neutral-500 font-bold uppercase text-xs tracking-[0.3em] mt-1">
                    Mode {isRamsay ? "Ramsay 🔪" : "Sweet 🧸"}
                  </p>
                </div>
                <div className="relative shrink-0">
                  <div className={`text-8xl font-black italic leading-none ${isRamsay ? "text-red-600" : "text-blue-600"}`}>
                    {displayScore}
                  </div>
                  <div className="absolute -bottom-2 right-0 text-xl font-black opacity-30">/10</div>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="h-4 bg-black rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full transition-all duration-[1500ms] ease-out ${isRamsay ? "bg-red-600" : "bg-blue-600"}`}
                  style={{ width: `${(result.score / 10) * 100}%` }}
                />
              </div>

              {/* MAIN ROAST */}
              <div className="relative">
                <div className="absolute -left-4 top-0 text-6xl opacity-10 font-serif">&quot;</div>
                <p className="text-2xl md:text-3xl font-bold leading-tight italic text-neutral-100">
                  {result.roast}
                </p>
              </div>

              {/* DETAILS GRID */}
              {result.details && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(result.details).map(([key, value]: [string, any]) => (
                    <div
                      key={key}
                      className="bg-black/50 p-5 rounded-2xl border border-neutral-800 hover:border-neutral-600 transition-colors"
                    >
                      <span className={`block font-black mb-2 uppercase text-[10px] tracking-widest ${isRamsay ? "text-orange-500" : "text-blue-400"}`}>
                        {key}
                      </span>
                      <p className="text-sm text-neutral-400 leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ACTIONS */}
              {result.actions && result.actions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
                    {isRamsay ? "Ce que tu dois corriger MAINTENANT" : "Prochaines étapes recommandées"}
                  </p>
                  {result.actions.map((action: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-neutral-300">
                      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black mt-0.5 ${isRamsay ? "bg-red-600/30 text-red-400" : "bg-blue-600/30 text-blue-400"}`}>
                        {i + 1}
                      </span>
                      {action}
                    </div>
                  ))}
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex flex-col gap-4 pt-2">
                <button
                  onClick={shareOnX}
                  className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-3 uppercase text-sm tracking-[0.2em]"
                >
                  Partager mon score sur X
                </button>
                <button
                  onClick={handleReset}
                  className="text-center text-neutral-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                  Analyser une autre landing page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-32 mb-20 text-left">
          <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 text-center sm:text-left">
            Questions Fréquentes <span className="text-neutral-600">/ FAQ</span>
          </h3>
          <div className="space-y-4">
            {[
              {
                q: "Comment fonctionne l'analyse ?",
                a: "Notre IA analyse visuellement votre landing page — via screenshot uploadé ou capture automatique d'une URL. Elle évalue la hiérarchie visuelle, le contraste, la clarté du message et l'efficacité du CTA.",
              },
              {
                q: "Est-ce que c'est vraiment Gordon Ramsay ?",
                a: "C'est une version numérique entraînée sur ses répliques les plus cinglantes. Aucun chef étoilé n'a été blessé durant le développement de cet outil.",
              },
              {
                q: "Mes données sont-elles conservées ?",
                a: "Non. Vos screenshots sont analysés à la volée et ne sont jamais stockés sur nos serveurs. Privacy-first.",
              },
              {
                q: "Pourquoi mon score est-il si bas ?",
                a: "Probablement parce que votre CTA est enterré sous 3 blocs de texte ou que la police fait 8px. Prenez les conseils au sérieux — c'est pour votre bien.",
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group border border-neutral-800 bg-neutral-900/30 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all"
              >
                <summary className="list-none p-6 cursor-pointer flex justify-between items-center font-bold italic uppercase text-sm tracking-widest select-none">
                  {item.q}
                  <span className="text-orange-500 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <div className="px-6 pb-6 text-neutral-400 text-sm leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
