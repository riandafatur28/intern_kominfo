import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toast from "./Toast";

afterEach(() => {
    vi.useRealTimers();
});

describe("Toast", () => {
    it("renders nothing when closed", () => {
        const { container } = render(
            <Toast open={false} message="Tersimpan" onClose={vi.fn()} />
        );

        expect(container).toBeEmptyDOMElement();
        expect(screen.queryByText("Tersimpan")).not.toBeInTheDocument();
    });

    it("shows the message when open", () => {
        render(<Toast open message="Tersimpan" onClose={vi.fn()} />);

        expect(screen.getByText("Tersimpan")).toBeInTheDocument();
    });

    it("auto-closes after the duration", () => {
        vi.useFakeTimers();
        const onClose = vi.fn();
        render(<Toast open message="Tersimpan" duration={3000} onClose={onClose} />);

        vi.advanceTimersByTime(2999);
        expect(onClose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not auto-close when closed (no timer started)", () => {
        vi.useFakeTimers();
        const onClose = vi.fn();
        render(<Toast open={false} message="Tersimpan" duration={3000} onClose={onClose} />);

        vi.advanceTimersByTime(5000);
        expect(onClose).not.toHaveBeenCalled();
    });

    it("calls onClose when the close button is clicked", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(<Toast open message="Tersimpan" onClose={onClose} />);

        await user.click(screen.getByRole("button", { name: "Tutup" }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("renders a success check icon by default", () => {
        const { container } = render(
            <Toast open message="Tersimpan" onClose={vi.fn()} />
        );

        expect(container.querySelector("svg path")?.getAttribute("d")).toBe(
            "M3 7.5L6 10.5L11 4.5"
        );
    });

    it("renders an error cross icon and error border for type=error", () => {
        const { container } = render(
            <Toast open message="Gagal" type="error" onClose={vi.fn()} />
        );

        expect(container.querySelector("svg path")?.getAttribute("d")).toBe(
            "M4 4l6 6M10 4l-6 6"
        );
        expect(screen.getByText("Gagal").parentElement).toHaveClass("border-[#FCA5A5]");
    });
});