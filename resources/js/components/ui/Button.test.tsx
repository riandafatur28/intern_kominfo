import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button";

describe("Button", () => {
    it("applies the primary variant and md size classes by default", () => {
        render(<Button>Simpan</Button>);

        const btn = screen.getByRole("button", { name: "Simpan" });
        expect(btn).toHaveClass("bg-[#256EEF]");
        expect(btn).toHaveClass("px-6", "py-3", "text-sm", "rounded-xl");
    });

    it("applies the outline variant classes", () => {
        render(<Button variant="outline">Batal</Button>);

        expect(screen.getByRole("button", { name: "Batal" })).toHaveClass(
            "bg-white",
            "border-[#C2C6D8]"
        );
    });

    it("applies the size classes and merges a custom className", () => {
        render(<Button size="sm" className="w-full mt-2">Kecil</Button>);

        const btn = screen.getByRole("button", { name: "Kecil" });
        expect(btn).toHaveClass("px-4", "py-2", "text-xs", "rounded-lg");
        expect(btn).toHaveClass("w-full", "mt-2");
    });

    it("renders children content", () => {
        render(<Button><span data-testid="icon">+</span>Tambah User</Button>);

        const btn = screen.getByRole("button");
        expect(btn).toHaveTextContent("+Tambah User");
        expect(btn.querySelector('[data-testid="icon"]')).toBeInTheDocument();
    });

    it("calls onClick when clicked", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Klik</Button>);

        await user.click(screen.getByRole("button", { name: "Klik" }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});