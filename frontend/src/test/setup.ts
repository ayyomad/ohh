// Vitest setup: register Testing Library's jest-dom matchers (toBeInTheDocument,
// toHaveAttribute, ...). The /vitest entry makes them type-script aware.
import "@testing-library/jest-dom/vitest";

class InvalidStateError extends Error {}

// jsdom implements the <dialog> element but NOT its showModal()/close()
// methods (see jsdom#3317). Production renders in real browsers where both
// exist; tests only need the `open` attribute reflection plus the `close`
// event, so polyfill exactly that.
if (typeof HTMLDialogElement.prototype.showModal !== "function") {
  HTMLDialogElement.prototype.showModal = function showModal(): void {
    if (this.hasAttribute("open")) {
      throw new InvalidStateError();
    }
    this.setAttribute("open", "");
  };
}

if (typeof HTMLDialogElement.prototype.close !== "function") {
  HTMLDialogElement.prototype.close = function close(): void {
    const hadOpen = this.hasAttribute("open");
    this.removeAttribute("open");
    if (hadOpen) {
      this.dispatchEvent(new Event("close", { bubbles: false }));
    }
  };
}

