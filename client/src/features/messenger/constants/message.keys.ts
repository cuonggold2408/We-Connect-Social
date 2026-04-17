export const messageKeys = {
  all: ["messages"] as const,
  conversation: (id: string) => [...messageKeys.all, id] as const,
};
