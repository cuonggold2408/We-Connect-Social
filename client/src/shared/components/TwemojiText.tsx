"use client";

import { useRef, useEffect, memo } from "react";
import twemoji from "@twemoji/api";

interface TwemojiTextProps {
  text: string;
  className?: string;
}

const FB_EMOJI_BASE =
  "https://cdn.jsdelivr.net/npm/emoji-datasource-facebook@16.0.0/img/";

export const TwemojiText = memo(({ text, className }: TwemojiTextProps) => {
  const containerRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    twemoji.parse(containerRef.current, {
      base: FB_EMOJI_BASE,
      folder: "facebook/64",
      ext: ".png",
      className: "twemoji-inline",
    });

    const imgs = containerRef.current.querySelectorAll("img.twemoji-inline");
    imgs.forEach((img) => {
      const imgEl = img as HTMLImageElement;
      imgEl.addEventListener("error", function handleError() {
        const src = imgEl.src;

        if (!imgEl.dataset.retried) {
          imgEl.dataset.retried = "1";
          if (src.includes("-fe0f")) {
            imgEl.src = src.replace(/-fe0f/g, "");
          } else {
            imgEl.src = src.replace(".png", "-fe0f.png");
          }
        } else {
          const alt = imgEl.getAttribute("alt");
          if (alt) {
            const textNode = document.createTextNode(alt);
            imgEl.parentNode?.replaceChild(textNode, imgEl);
          }
        }
      });
    });
  }, [text]);

  return (
    <p ref={containerRef} className={className}>
      {text}
    </p>
  );
});

TwemojiText.displayName = "TwemojiText";
