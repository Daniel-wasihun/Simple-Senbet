"use client";

import { useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export type ShowcaseSlide = {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  fallbackImage?: string;
  fallbackAlt?: string;
  credit?: string;
  sourceHref?: string;
  icon?: LucideIcon;
};

export function ShowcaseCarousel({ slides, label, className = "" }: {
  slides: ShowcaseSlide[];
  label: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const { t } = useTranslation();
  const slide = slides[index];

  function showSlide(nextIndex: number) {
    setIndex((nextIndex + slides.length) % slides.length);
    setImageUnavailable(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") { event.preventDefault(); showSlide(index - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); showSlide(index + 1); }
  }

  function onTouchStart(event: TouchEvent<HTMLElement>) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: TouchEvent<HTMLElement>) {
    const endX = event.changedTouches[0]?.clientX;
    if (touchStartX.current !== null && endX !== undefined && Math.abs(endX - touchStartX.current) > 48) {
      showSlide(index + (endX < touchStartX.current ? 1 : -1));
    }
    touchStartX.current = null;
  }

  const Icon = slide.icon ?? BookOpen;
  const imageSrc = imageUnavailable ? undefined : slide.image;

  return <section className={`showcase-carousel group/carousel touch-pan-y ${className}`} aria-label={label} tabIndex={0} onKeyDown={onKeyDown} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 group-hover/carousel:shadow-md dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1.15fr_0.85fr]">
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {imageSrc ? <img key={imageSrc} src={imageSrc} alt={slide.imageAlt ?? slide.title} loading="lazy" decoding="async" onError={(event) => {
          if (slide.fallbackImage && event.currentTarget.src !== slide.fallbackImage) {
            event.currentTarget.src = slide.fallbackImage;
            event.currentTarget.alt = slide.fallbackAlt ?? t("church.home.fallbackChurchAlt");
          }
          else setImageUnavailable(true);
        }} className="showcase-image absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-blue-50 via-white to-slate-100 text-blue-700 dark:from-blue-950/50 dark:via-slate-900 dark:to-slate-800 dark:text-blue-300"><Icon aria-hidden="true" className="h-16 w-16" strokeWidth={1.25} /></div>}
      </div>
      <div className="flex min-h-[250px] flex-col justify-between p-6 sm:p-8">
        <div aria-live="polite" aria-atomic="true">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">{String(index + 1).padStart(2, "0")} <span className="text-slate-400">/ {String(slides.length).padStart(2, "0")}</span></p>
          <h3 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{slide.title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{slide.description}</p>
          {slide.credit && <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{slide.credit}</p>}
          {slide.sourceHref && <Link href={slide.sourceHref} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:text-blue-200">{t("church.home.viewSource")}<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>}
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5" aria-label={t("church.home.carouselPagination")}>
            {slides.map((item, dotIndex) => <button key={`${item.title}-${dotIndex}`} type="button" onClick={() => showSlide(dotIndex)} aria-label={`${t("church.home.goToSlide")} ${dotIndex + 1}`} aria-current={index === dotIndex ? "true" : undefined} className={`h-2.5 rounded-full transition-[width,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${index === dotIndex ? "w-7 bg-blue-700 dark:bg-blue-400" : "w-2.5 bg-slate-300 hover:bg-blue-300 dark:bg-slate-600 dark:hover:bg-blue-700"}`} />)}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => showSlide(index - 1)} aria-label={t("church.home.previousImage")} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-blue-950/50"><ArrowLeft aria-hidden="true" className="h-4 w-4" /></button>
            <button type="button" onClick={() => showSlide(index + 1)} aria-label={t("church.home.nextImage")} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-blue-950/50"><ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
