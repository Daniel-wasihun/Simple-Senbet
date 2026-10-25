"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, CalendarCheck2, HeartHandshake, Landmark, UsersRound } from "lucide-react";
import { EthiopianOrthodoxCross, PublicSiteLayout } from "@/components/public/PublicSiteLayout";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { ShowcaseCarousel, type ShowcaseSlide } from "@/components/public/ShowcaseCarousel";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { getDashboardRouteForRole } from "@/utils/roleNavigation";

type HomeCard = { title: string; description: string };

const capabilities = [
  { key: "academics", icon: BookOpen },
  { key: "attendance", icon: CalendarCheck2 },
  { key: "finance", icon: HeartHandshake },
  { key: "members", icon: UsersRound },
];

const debreLibanosPhoto = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Debre_Libanos_Monastery%2C_Ethiopia_-_panoramio.jpg/1280px-Debre_Libanos_Monastery%2C_Ethiopia_-_panoramio.jpg";
const fallbackChurchPhoto = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Ethiopian_Orthodox_church_in_Addis_Abeba.jpg/960px-Ethiopian_Orthodox_church_in_Addis_Abeba.jpg";

export function PublicLanding() {
  const { user } = useAuth();
  const { t, get } = useTranslation();
  const [heroImageFallback, setHeroImageFallback] = useState(false);
  const home = (key: string) => t(`church.home.${key}`);
  const departments = get("church.home.departments") as HomeCard[];
  const pillars = get("church.home.pillars") as HomeCard[];
  const portalHref = user ? getDashboardRouteForRole(user.role, user.permissions) : "/login";
  const churchSlides: ShowcaseSlide[] = [
    { title: home("gallery.debreTitle"), description: home("gallery.debreDescription"), image: debreLibanosPhoto, fallbackImage: fallbackChurchPhoto, fallbackAlt: home("fallbackChurchAlt"), imageAlt: home("gallery.debreAlt"), credit: "MarcD · CC BY-SA 3.0", sourceHref: "https://commons.wikimedia.org/wiki/File:Debre_Libanos_Monastery,_Ethiopia_-_panoramio.jpg" },
    { title: home("gallery.georgeTitle"), description: home("gallery.georgeDescription"), image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Lalibela%2C_san_giorgio%2C_esterno_24.jpg/1280px-Lalibela%2C_san_giorgio%2C_esterno_24.jpg", fallbackImage: fallbackChurchPhoto, fallbackAlt: home("fallbackChurchAlt"), imageAlt: home("gallery.georgeAlt"), credit: "Sailko · CC BY 3.0", sourceHref: "https://commons.wikimedia.org/wiki/File:Lalibela,_san_giorgio,_esterno_24.jpg" },
    { title: home("gallery.addisTitle"), description: home("gallery.addisDescription"), image: fallbackChurchPhoto, fallbackImage: debreLibanosPhoto, fallbackAlt: home("fallbackChurchAlt"), imageAlt: home("gallery.addisAlt"), credit: "VBzi · CC BY 2.0", sourceHref: "https://commons.wikimedia.org/wiki/File:Ethiopian_Orthodox_church_in_Addis_Abeba.jpg" },
  ];
  const educationItems = get("church.home.educationItems") as HomeCard[];
  const educationSlides: ShowcaseSlide[] = educationItems.map((item, index) => ({ ...item, icon: [BookOpen, CalendarCheck2, UsersRound][index % 3] }));
  const serviceSlides: ShowcaseSlide[] = [
    { title: home("services.liturgyTitle"), description: home("services.liturgyDescription"), image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Ethio-orthodox-priests.jpg/1280px-Ethio-orthodox-priests.jpg", fallbackImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Priest_in_Lalibella.jpg/1280px-Priest_in_Lalibella.jpg", fallbackAlt: home("fallbackClergyAlt"), imageAlt: home("services.liturgyAlt"), credit: "Gyrofrog · CC BY-SA 3.0", sourceHref: "https://commons.wikimedia.org/wiki/File:Ethio-orthodox-priests.jpg" },
    { title: home("services.crossesTitle"), description: home("services.crossesDescription"), image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Jewel_Tones_in_the_Church_of_Bet_Abba_Libanos_%283343044262%29.jpg/1280px-Jewel_Tones_in_the_Church_of_Bet_Abba_Libanos_%283343044262%29.jpg", fallbackImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Priest_in_Lalibella.jpg/1280px-Priest_in_Lalibella.jpg", fallbackAlt: home("fallbackClergyAlt"), imageAlt: home("services.crossesAlt"), credit: "A. Davey · CC BY 2.0", sourceHref: "https://commons.wikimedia.org/wiki/File:Jewel_Tones_in_the_Church_of_Bet_Abba_Libanos_(3343044262).jpg" },
  ];

  return (
    <PublicSiteLayout>
      <main className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[0.94fr_1.06fr] lg:gap-16 lg:px-8 lg:py-20">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] dark:border-slate-700 dark:text-blue-200">
              <EthiopianOrthodoxCross className="h-4 w-4" />{home("heroEyebrow")}
            </p>
            <h1 className="hero-enter mt-6 font-serif text-4xl font-semibold leading-[1.13] tracking-tight text-[#1D4ED8] dark:text-white sm:text-5xl lg:text-[3.5rem]">
              {home("heroTitle1")} <span className="text-[#2563EB] dark:text-blue-300">{home("heroTitle2")}</span>
            </h1>
            <p className="hero-enter hero-enter-delay-1 mt-5 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
              {home("heroCopy")}
            </p>
            <div className="hero-enter hero-enter-delay-2 mt-8 flex flex-wrap items-center gap-3">
              <Link href={portalHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#1D4ED8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 dark:bg-[#2563EB] dark:text-white dark:hover:bg-[#315c86] dark:focus-visible:ring-offset-slate-950">
                {home(user ? "dashboard" : "portal")}<ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link href="#school-capabilities" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-slate-100 px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-blue-950/50 dark:hover:text-blue-200">
                {home("explore")}<ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-5 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
              <span className="inline-flex items-center gap-2"><Landmark aria-hidden="true" className="h-4 w-4 text-[#2563EB] dark:text-blue-300" />{home("records")}</span>
              <span className="inline-flex items-center gap-2"><HeartHandshake aria-hidden="true" className="h-4 w-4 text-[#2563EB] dark:text-blue-300" />{home("secureAccess")}</span>
            </div>
          </div>

          <figure className="hero-enter min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="aspect-[16/11] overflow-hidden sm:aspect-[16/10]">
              <img src={debreLibanosPhoto} alt={home("heroImageAlt")} fetchPriority="high" onError={(event) => { event.currentTarget.src = fallbackChurchPhoto; event.currentTarget.alt = home("fallbackChurchAlt"); setHeroImageFallback(true); }} className="showcase-image h-full w-full object-cover" />
            </div>
            <figcaption className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{home(heroImageFallback ? "fallbackChurchCaption" : "photoCaption")}</figcaption>
          </figure>
        </section>

        <section id="school-capabilities" className="scroll-mt-24 border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2563EB] dark:text-blue-300">{home("departmentsEyebrow")}</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#1D4ED8] dark:text-white sm:text-4xl">{home("departmentsTitle")}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{home("departmentsIntro")}</p>
            </div>
            <div className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {capabilities.map(({ key, icon: Icon }, index) => {
                const item = departments[index];
                return <ScrollReveal key={key} delay={index * 70}><article className="capability-card h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                  <Icon aria-hidden="true" className="h-5 w-5 text-[#2563EB] dark:text-blue-300" />
                  <h3 className="mt-4 text-sm font-semibold text-[#1D4ED8] dark:text-white">{item?.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item?.description}</p>
                </article></ScrollReveal>;
              })}
            </div>
          </div>
        </section>

        <section id="churches" className="border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 lg:grid-cols-[0.65fr_1.35fr] lg:gap-14 lg:px-8 lg:py-20">
            <ScrollReveal><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700 dark:text-blue-300">{home("galleryEyebrow")}</p><h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{home("galleryTitle")}</h2><p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{home("galleryIntro")}</p></div></ScrollReveal>
            <ScrollReveal delay={100}><ShowcaseCarousel slides={churchSlides} label={home("galleryTitle")} /></ScrollReveal>
          </div>
        </section>

        <section id="curriculum" className="scroll-mt-24 mx-auto grid max-w-7xl items-start gap-9 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-16">
          <ScrollReveal><div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2563EB] dark:text-blue-300">{home("pillarsEyebrow")}</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[#1D4ED8] dark:text-white sm:text-4xl">{home("pillarsTitle")}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{home("pillarsIntro")}</p>
            <Link href="/about-us" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1D4ED8] hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] dark:text-blue-200 dark:hover:text-blue-100">
              {t("church.navigation.ministry")}<ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div></ScrollReveal>
          <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {pillars.map((pillar, index) => <ScrollReveal key={pillar.title} delay={index * 55}><article className="grid gap-2 py-5 sm:grid-cols-[44px_1fr] sm:gap-4">
              <span className="text-xs font-semibold tabular-nums text-slate-400">0{index + 1}</span>
              <div><h3 className="text-sm font-semibold text-[#1D4ED8] dark:text-white">{pillar.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{pillar.description}</p></div>
            </article></ScrollReveal>)}
          </div>
        </section>

        <section id="sunday-school" className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 lg:grid-cols-[0.65fr_1.35fr] lg:gap-14 lg:px-8 lg:py-20">
            <ScrollReveal><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700 dark:text-blue-300">{home("educationEyebrow")}</p><h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{home("educationTitle")}</h2><p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{home("educationIntro")}</p><p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">{home("educationPhotoNote")}</p></div></ScrollReveal>
            <ScrollReveal delay={100}><ShowcaseCarousel slides={educationSlides} label={home("educationTitle")} /></ScrollReveal>
          </div>
        </section>

        <section id="school-life" className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:grid-cols-[48px_1fr] sm:gap-7 lg:px-8">
            <EthiopianOrthodoxCross className="h-9 w-8 text-[#2563EB] dark:text-blue-300" />
            <div className="max-w-4xl"><blockquote className="font-serif text-xl leading-relaxed text-[#1D4ED8] dark:text-white sm:text-2xl">{home("quote")}</blockquote><p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{home("quoteReference")}</p><div className="mt-7 border-t border-slate-200 pt-5 dark:border-slate-800"><h2 className="text-sm font-semibold text-[#1D4ED8] dark:text-white">{home("commitmentTitle")}</h2><ul className="mt-3 grid gap-x-8 gap-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:grid-cols-3">{(get("church.home.commitments") as string[]).map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB] dark:bg-blue-300" />{item}</li>)}</ul></div></div>
          </div>
        </section>

        <section id="services" className="border-t border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 lg:grid-cols-[0.65fr_1.35fr] lg:gap-14 lg:px-8 lg:py-20">
            <ScrollReveal><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700 dark:text-blue-300">{home("servicesEyebrow")}</p><h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{home("servicesTitle")}</h2><p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{home("servicesIntro")}</p></div></ScrollReveal>
            <ScrollReveal delay={100}><ShowcaseCarousel slides={serviceSlides} label={home("servicesTitle")} /></ScrollReveal>
          </div>
        </section>

        <section className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-12 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2563EB] dark:text-blue-300">{home("ctaEyebrow")}</p><h2 className="mt-2 font-serif text-2xl font-semibold text-[#1D4ED8] dark:text-white">{home("ctaTitle")}</h2></div>
          <Link href="/contact-us" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-md bg-[#1D4ED8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 dark:bg-[#2563EB] dark:text-white dark:hover:bg-[#315c86] dark:focus-visible:ring-offset-slate-950">
            {home("contactSupport")}<ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </PublicSiteLayout>
  );
}
