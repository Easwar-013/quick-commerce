"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ChevronLeft, ChevronRight, Zap, Clock, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

const slides = [
  {
    id: 1,
    badge: "10-Minute Delivery",
    badgeIcon: Clock,
    title: "Fresh Groceries & Daily Needs",
    subtitle: "Delivered straight from dark stores right to your doorstep in minutes",
    gradient: "from-emerald-800 via-emerald-600 to-teal-600",
    tag: "Flat 25% OFF on first 3 orders",
    code: "FLASH25",
  },
  {
    id: 2,
    badge: "Super Munchies Deal",
    badgeIcon: Zap,
    title: "Chilled Drinks & Crispy Snacks",
    subtitle: "Stock up your midnight cravings and party essentials right now",
    gradient: "from-amber-600 via-orange-600 to-rose-600",
    tag: "Combos starting at ₹49",
    code: "SNACKNOW",
  },
  {
    id: 3,
    badge: "Farm Fresh Guaranteed",
    badgeIcon: ShieldCheck,
    title: "Organic Fruits & Fresh Greens",
    subtitle: "Handpicked premium quality checked daily at sunrise",
    gradient: "from-teal-800 via-emerald-700 to-green-700",
    tag: "Zero delivery fee above ₹199",
    code: "FRESHFREE",
  },
];

export default function HeroSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideContentRef = useRef<HTMLDivElement>(null);
  const floatingBadgeRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  // GSAP Ambient Floating Animation
  useGSAP(
    () => {
      gsap.to(".gsap-float", {
        y: -8,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      gsap.to(".gsap-pulse-glow", {
        scale: 1.15,
        opacity: 0.25,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: containerRef }
  );

  // Trigger GSAP transition on slide index change
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      ".slide-anim-badge",
      { opacity: 0, y: -20, scale: 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
    )
      .fromTo(
        ".slide-anim-title",
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" },
        "-=0.2"
      )
      .fromTo(
        ".slide-anim-subtitle",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        "-=0.3"
      )
      .fromTo(
        ".slide-anim-tag",
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "elastic.out(1, 0.6)" },
        "-=0.2"
      );
  }, [current]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const activeSlide = slides[current];
  const BadgeIcon = activeSlide.badgeIcon;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-3xl mb-8 shadow-lg group">
      {/* Background Stage */}
      <div
        className={`w-full bg-gradient-to-r ${activeSlide.gradient} p-8 sm:p-12 text-white flex flex-col justify-between min-h-[250px] sm:min-h-[290px] relative overflow-hidden transition-all duration-700`}
      >
        {/* GSAP Animated Ambient Orbs */}
        <div className="gsap-pulse-glow absolute -right-12 -bottom-12 w-72 h-72 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="gsap-pulse-glow absolute right-1/3 -top-12 w-56 h-56 bg-amber-300/20 rounded-full blur-2xl pointer-events-none" />

        <div ref={slideContentRef} className="relative z-10">
          <div className="slide-anim-badge inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3 shadow-inner">
            <BadgeIcon className="w-4 h-4 text-amber-300" />
            {activeSlide.badge}
          </div>

          <h2 className="slide-anim-title text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight max-w-xl leading-tight">
            {activeSlide.title}
          </h2>

          <p className="slide-anim-subtitle text-sm sm:text-base text-white/90 font-medium mt-2 max-w-lg">
            {activeSlide.subtitle}
          </p>
        </div>

        {/* Footer Badges & Promo Code */}
        <div className="slide-anim-tag relative z-10 flex flex-wrap items-center gap-3 pt-6">
          <div className="gsap-float bg-white text-gray-900 text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-4 h-4 text-amber-500" />
            {activeSlide.tag}
          </div>

          <span className="text-xs bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-xl font-mono tracking-widest border border-white/10">
            CODE: <strong>{activeSlide.code}</strong>
          </span>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-gray-900 transition-all opacity-0 group-hover:opacity-100 shadow-md hover:scale-110 active:scale-95"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-gray-900 transition-all opacity-0 group-hover:opacity-100 shadow-md hover:scale-110 active:scale-95"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              current === idx ? "w-8 bg-white" : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}