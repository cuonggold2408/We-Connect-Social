"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useHoverTranslate } from "@/features/translation/hooks/useHoverTranslate";
import { TwemojiText } from "@/shared/components/TwemojiText";

interface Props {
  text: string;
  entityType?: "POST" | "COMMENT" | "MESSAGE";
  entityId?: string;
}

export function TranslatableSentence({ text, entityType, entityId }: Props) {
  const { open, setOpen, canTranslate, data, isLoading, error } =
    useHoverTranslate({ text, entityType, entityId });

  if (!canTranslate) {
    return <TwemojiText text={text} as="span" />;
  }

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <span>
          <TwemojiText text={text} as="span" />
        </span>
      </TooltipTrigger>

      <TooltipContent side="top" align="start">
        {isLoading && !data && (
          <span className="text-gray-500 italic">Đang dịch...</span>
        )}

        {error && !data && (
          <span className="text-orange-600">
            Có lỗi xảy ra khi dịch.Vui lòng thử lại sau
          </span>
        )}

        {data && (
          <span className="whitespace-pre-wrap">
            <TwemojiText text={data.translatedText} as="span" />
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
