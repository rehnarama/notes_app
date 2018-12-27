interface PointerEvent {
  getCoalescedEvents: (() => PointerEvent[]) | undefined;
}
