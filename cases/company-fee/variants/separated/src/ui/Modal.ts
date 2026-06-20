const openedMessages: string[] = [];

export const Modal = {
  open(message: string): void {
    openedMessages.push(message);
  },

  getOpenedMessages(): string[] {
    return [...openedMessages];
  },

  reset(): void {
    openedMessages.length = 0;
  },
};
