import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ArrowRight,
  Flame,
  Sparkles,
  Maximize2,
} from 'lucide-react';

interface OpeningSlideshowProps {
  onComplete: () => void;
  slideDurationMs?: number; // default 2500ms (2.5 seconds)
}

interface SlideItem {
  id: number;
  image: string;
  title: string;
  subtitle: string;
}

const SLIDES: SlideItem[] = [
  {
    id: 1,
    image: '/intro-slides/slide-1.jpg',
    title: '॥ पावन आमंत्रण ॥',
    subtitle: 'भारत उत्कर्ष महायज्ञ 2026 • 108 कुण्डीय सहस्र चंडी यज्ञ',
  },
  {
    id: 2,
    image: '/intro-slides/slide-2.jpg',
    title: 'श्री महर्षि महेश योगी संस्थान',
    subtitle: 'पावन निमंत्रण पत्र • 27 नवम्बर से 5 दिसम्बर 2026',
  },
  {
    id: 3,
    image: '/intro-slides/slide-3.jpg',
    title: 'श्रीमद् देवी भागवत कथा',
    subtitle: 'परम पूज्य कथा वाचक देवी कृष्ण प्रिया जी • दोपहर 03 से सायं 08 बजे',
  },
  {
    id: 4,
    image: '/intro-slides/slide-4.jpg',
    title: 'महायज्ञ के मुख्य आकर्षण',
    subtitle: 'भव्य रेत कला, कला गाँव, आरोग्य मेला, पुस्तक मेला व अन्न क्षेत्र',
  },
];

export const OpeningSlideshow: React.FC<OpeningSlideshowProps> = ({
  onComplete,
  slideDurationMs = 2500, // 2.5 seconds per slide as requested (2 to 3 seconds)
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const goToNextSlide = () => {
    setCurrentIndex((prev) => {
      if (prev >= SLIDES.length - 1) {
        onComplete();
        return prev;
      }
      return prev + 1;
    });
    setProgress(0);
  };

  const goToPrevSlide = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
    setProgress(0);
  };

  // Timer logic for 2.5 seconds per slide
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const stepMs = 50;
    const totalSteps = slideDurationMs / stepMs;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / totalSteps);
        return next > 100 ? 100 : next;
      });
    }, stepMs);

    timerRef.current = setTimeout(() => {
      if (currentIndex >= SLIDES.length - 1) {
        onComplete();
      } else {
        setCurrentIndex((prev) => prev + 1);
        setProgress(0);
      }
    }, slideDurationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, isPaused, slideDurationMs, onComplete]);

  const currentSlide = SLIDES[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-[#140305] text-amber-100 flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300">
      {/* Top Header Bar with Progress Bar & Skip Button */}
      <div className="w-full bg-[#200508]/90 backdrop-blur-md border-b border-amber-600/40 z-20 shrink-0">
        {/* Animated Progress Bar */}
        <div className="w-full bg-stone-900 h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Brand & Slide indicator */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <Flame className="w-4 h-4 fill-stone-950" />
            </div>
            <div className="min-w-0">
              <div className="font-serif font-black text-xs sm:text-base text-amber-200 truncate flex items-center gap-1.5">
                <span>भारत उत्कर्ष महायज्ञ 2026</span>
                <span className="hidden min-[480px]:inline-block text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40">
                  पावन आमंत्रण
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-amber-300/80 truncate">
                {currentSlide.title} • पत्रिका ({currentIndex + 1} / {SLIDES.length})
              </div>
            </div>
          </div>

          {/* Controls: Pause/Play & Skip to Home */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-400/30 text-xs flex items-center gap-1 cursor-pointer transition-all"
              title={isPaused ? 'चलाएं (Play)' : 'रोकें (Pause)'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-amber-300" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden min-[420px]:inline text-[11px] font-bold">
                {isPaused ? 'चलाएं' : 'रोकें'}
              </span>
            </button>

            <button
              onClick={onComplete}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm rounded-xl shadow-lg border border-amber-200 cursor-pointer flex items-center gap-1.5 transition-all transform hover:scale-[1.02]"
              title="सीधे मुख्य वेबसाइट पर जाएं"
            >
              <span>मुख्य वेबसाइट</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Viewer Area */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute inset-0 bg-radial from-amber-700/15 via-transparent to-transparent pointer-events-none" />

        {/* Slide Image Container */}
        <div className="relative w-full h-full max-h-[82vh] flex items-center justify-center">
          <img
            key={currentSlide.id}
            src={currentSlide.image}
            alt={currentSlide.title}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-2 sm:border-4 border-amber-600/50 bg-stone-950/80 transition-all duration-300 ease-out"
          />
        </div>

        {/* Navigation Arrows (Prev / Next) */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevSlide}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/85 text-amber-200 hover:text-white border border-amber-400/50 flex items-center justify-center cursor-pointer shadow-xl transition-all z-20 backdrop-blur-xs"
            aria-label="पिछला पृष्ठ"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        <button
          onClick={goToNextSlide}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/85 text-amber-200 hover:text-white border border-amber-400/50 flex items-center justify-center cursor-pointer shadow-xl transition-all z-20 backdrop-blur-xs"
          aria-label="अगला पृष्ठ"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      {/* Bottom Bar with Slide Indicators & Quick CTA */}
      <div className="w-full bg-[#200508]/90 backdrop-blur-md border-t border-amber-600/40 px-3 sm:px-6 py-2.5 sm:py-3 z-20 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Slide Dots / Indicators */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setProgress(0);
                }}
                className={`h-2 sm:h-2.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'w-7 sm:w-9 bg-amber-400 shadow-xs'
                    : 'w-2 sm:w-2.5 bg-amber-200/30 hover:bg-amber-200/60'
                }`}
                aria-label={`स्लाइड ${idx + 1}`}
                title={`स्लाइड ${idx + 1}: ${slide.title}`}
              />
            ))}
            <span className="text-[10px] sm:text-xs text-amber-300/80 ml-1 font-mono">
              {currentIndex + 1} / {SLIDES.length}
            </span>
          </div>

          {/* Subtitle / Event Date Info */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-200 font-serif">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>27 नवम्बर 2026 से 5 दिसम्बर 2026 • 108 हवन कुंड महायज्ञ</span>
          </div>

          {/* Skip / Enter Button */}
          <button
            onClick={onComplete}
            className="text-xs sm:text-sm font-bold text-amber-300 hover:text-white underline underline-offset-4 cursor-pointer flex items-center gap-1"
          >
            <span>स्किप करें (Skip)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
