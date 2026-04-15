"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "../lib/supabase";

export default function WelcomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function checkUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_onboarding_complete")
            .eq("id", user.id)
            .single();

          if (profile?.is_onboarding_complete) {
            router.replace("/home");
            return;
          }
          router.replace("/onboarding/email");
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#1A1A1A] font-sans overflow-hidden"
      dir="rtl"
    >
      {/* אלמנטים עיצוביים ברקע - בועות צבע רכות */}
      <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-blue-100/40 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[5%] right-[-10%] w-[250px] h-[250px] bg-indigo-50 rounded-full blur-3xl -z-10" />

      <div className="flex-1 flex flex-col px-7 py-12 max-w-md mx-auto w-full relative z-10">
        {/* 1. Header Section - למעלה באמצע */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center flex-none mt-4 text-center"
        >
          <h1 className="text-5xl font-black tracking-tight text-gray-900 mb-3">
            HowWe<span className="text-blue-500">Met</span>
          </h1>

          <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-[280px]">
            המקום שבו סטודנטים נפגשים
            <span className="block text-blue-400 font-bold">
              בזמן הנכון, במקום הנכון.
            </span>
          </p>
        </motion.div>

        {/* 2. Meet Cute Animation Section - במרכז העמוד */}
        <div className="flex-1 flex items-center justify-center w-full my-8">
          <div className="w-full max-w-[280px] aspect-video relative flex items-center justify-center">
            <svg
              viewBox="0 0 300 200"
              className="w-full h-full overflow-visible"
            >
              <defs>
                <filter
                  id="shadow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                  <feOffset dx="0" dy="4" result="offsetBlur" />
                  <feFlood floodColor="#000" floodOpacity="0.1" />
                  <feComposite in2="offsetBlur" operator="in" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* קו רצפה עדין */}
              <line
                x1="30"
                y1="140"
                x2="270"
                y2="140"
                stroke="#f3f4f6"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* דמות 1 (כחול) - מגיעה משמאל */}
              <motion.circle
                cx="0"
                cy="0"
                r="18"
                fill="rgb(236, 72, 153)"
                filter="url(#shadow)"
                initial={{ x: 40, y: 120, scale: 0 }}
                animate={{
                  x: [40, 135, 115],
                  scale: [0, 1, 1],
                }}
                transition={{
                  duration: 1.8,
                  times: [0, 0.7, 1],
                  ease: "easeOut",
                  delay: 0.2,
                }}
              />

              {/* דמות 2 (אינדיגו) - מגיעה מימין */}
              <motion.circle
                cx="0"
                cy="0"
                r="18"
                fill="#3b82f6"
                filter="url(#shadow)"
                initial={{ x: 260, y: 120, scale: 0 }}
                animate={{
                  x: [260, 165, 185],
                  scale: [0, 1, 1],
                }}
                transition={{
                  duration: 1.8,
                  times: [0, 0.7, 1],
                  ease: "easeOut",
                  delay: 0.2,
                }}
              />

              {/* ניצוצות בהיתקלות */}
              <motion.g
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{ duration: 0.4, delay: 1.4 }}
                style={{ originX: "150px", originY: "110px" }}
              >
                <path
                  d="M 150 95 L 150 85 M 135 105 L 125 95 M 165 105 L 175 95"
                  stroke="#fcd34d"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </motion.g>

              {/* לב מופיע אחרי הרתיעה */}
              <motion.path
                d="M150 80 c-4.5 -4.5 -11 -4.5 -15.5 0 c-4.5 4.5 -4.5 11 0 15.5 l15.5 15.5 l15.5 -15.5 c4.5 -4.5 4.5 -11 0 -15.5 c-4.5 -4.5 -11 -4.5 -15.5 0 z"
                fill="#f472b6"

                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: -10 }}
                transition={{
                  duration: 0.6,
                  delay: 1.8,
                  type: "spring",
                  bounce: 0.5,
                }}
              />
            </svg>
          </div>
        </div>

        {/* 3. Buttons Section - למטה */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col gap-4 w-full flex-none pb-4"
        >
          <button
            onClick={() => router.push("/onboarding/email")}
            className="group relative w-full py-5 bg-blue-500 overflow-hidden rounded-2xl font-bold text-white text-lg shadow-xl shadow-blue-100 active:scale-[0.98] transition-all duration-200 ease-in-out hover:bg-blue-600"
          >
            <span className="relative z-10">יאללה, בואו נתחיל</span>
          </button>

          <button
            onClick={() => router.push("/auth/login")}
            className="w-full py-5 bg-transparent border-2 border-gray-100 rounded-2xl font-bold text-gray-600 text-lg hover:bg-white hover:border-blue-100 hover:text-blue-500 active:scale-[0.98] transition-all duration-200 ease-in-out"
          >
            כבר יש לי חשבון
          </button>

          <p className="text-center text-gray-400 text-[11px] mt-2 px-4 leading-snug">
            ביצירת חשבון הנך מסכים ל
            <a
              href="/terms"
              className="underline decoration-blue-200 hover:text-blue-400 transition-colors mx-1"
            >
              תנאי השימוש
            </a>
            ו ל
            <a
              href="/privacy"
              className="underline decoration-blue-200 hover:text-blue-400 transition-colors mx-1"
            >
              מדיניות הפרטיות
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
