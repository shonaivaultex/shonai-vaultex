"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function LoadingScreen({
  loading,
}: {
  loading: boolean;
}) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#090a0c]"
        >
          {/* 背景のオレンジグロー */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: 1.2,
              opacity: [0.1, 0.35, 0.15],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
            }}
            className="absolute h-[500px] w-[500px] rounded-full bg-orange-500 blur-[170px]"
          />

          {/* ロゴ文字 */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative text-center"
          >
            <motion.h1
              initial={{ letterSpacing: "0.6em", opacity: 0 }}
              animate={{
                letterSpacing: "0.22em",
                opacity: 1,
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
              }}
              className="text-6xl font-black"
            >
              SHONAI
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0.9, 1],
              }}
              transition={{
                delay: 0.6,
                duration: 1,
              }}
              className="mt-3 text-3xl font-black tracking-[0.45em] text-orange-500"
            >
              VAULTEX
            </motion.p>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 160 }}
              transition={{
                delay: 1,
                duration: 0.8,
              }}
              className="mx-auto mt-8 h-[2px] bg-orange-500"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}