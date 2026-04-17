export function TypingIndicator() {
  return (
    <div className="px-4 pb-1">
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <span>Đang nhập</span>
        <span className="flex gap-0.5">
          <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}
