"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";

export function TextGenerateEffect({
  words,
  className = "",
  duration = 0.5,
  delay = 0,
}: {
  words: string;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(" ");

  useEffect(() => {
    animate(
      "span",
      { opacity: 1, filter: "blur(0px)" },
      { duration, delay: stagger(0.15, { startDelay: delay }) }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span className={className} ref={scope}>
      {wordsArray.map((word, idx) => (
        <motion.span
          key={word + idx}
          className="opacity-0 inline-block"
          style={{ filter: "blur(8px)" }}
        >
          {word}
          {idx < wordsArray.length - 1 && " "}
        </motion.span>
      ))}
    </span>
  );
}
