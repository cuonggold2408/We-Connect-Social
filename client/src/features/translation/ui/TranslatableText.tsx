"use client";

import { detectScriptMix } from "@/shared/helpers/detect-script-mix";
import { TranslatableSentence } from "./TranslatableSentence";
import { splitSentences } from "@/shared/helpers/split-sentences";
import { TwemojiText } from "@/shared/components/TwemojiText";

interface Props {
  text: string;
  entityType?: "POST" | "COMMENT" | "MESSAGE";
  entityId?: string;
  className?: string;
  as?: "p" | "span" | "div";
}

export function TranslatableText({
  text,
  entityType,
  entityId,
  className,
  as: Tag = "p",
}: Props) {
  const Component = Tag as React.ElementType;
  const sentences = splitSentences(text);

  if (sentences.length === 0) return null;

  return (
    <Component className={className} data-translatable-scope>
      {sentences.map((sentence, idx) => {
        const { mixed } = detectScriptMix(sentence.text);

        if (mixed) {
          return (
            <span key={idx} data-mixed-lang="true">
              <TwemojiText text={sentence.text} as="span" />
            </span>
          );
        }

        return (
          <TranslatableSentence
            key={idx}
            text={sentence.text}
            entityType={entityType}
            entityId={entityId}
          />
        );
      })}
    </Component>
  );
}
