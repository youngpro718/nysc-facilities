
"use client";
import { useMotionValue, useSpring } from "framer-motion";
import React, { useState, useEffect } from "react";
import { useMotionTemplate, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const EvervaultCard = ({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) => {
  // Use springs for smoother mouse tracking
  let mouseX = useSpring(useMotionValue(0), {
    stiffness: 500,
    damping: 50
  });
  let mouseY = useSpring(useMotionValue(0), {
    stiffness: 500,
    damping: 50
  });

  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    let str = generateRandomString(1500);
    setRandomString(str);
  }, []);

  // Debounce mouse move updates
  function onMouseMove({ currentTarget, clientX, clientY }: any) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  // Add throttled random string updates
  const updateRandomString = React.useCallback(() => {
    const str = generateRandomString(1500);
    setRandomString(str);
  }, []);

  // Use RAF for smoother updates
  useEffect(() => {
    let frame: number;
    const updateString = () => {
      updateRandomString();
      frame = requestAnimationFrame(updateString);
    };
    frame = requestAnimationFrame(updateString);
    return () => cancelAnimationFrame(frame);
  }, [updateRandomString]);

  return (
    <div
      className={cn(
        "p-0.5 bg-transparent flex items-center justify-center w-full h-full relative",
        className
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center"
      >
        <CardPattern
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
        />
      </div>
    </div>
  );
};

export function CardPattern({ mouseX, mouseY, randomString }: any) {
  let maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  let style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-700 opacity-0 group-hover/card:opacity-100 transition-all duration-500 ease-out"
        style={style}
      />
      <motion.div
        className="absolute inset-0 opacity-0 mix-blend-overlay group-hover/card:opacity-100 transition-opacity duration-500"
        style={style}
      >
        <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-white font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};
