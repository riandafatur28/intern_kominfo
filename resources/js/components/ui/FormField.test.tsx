import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FormField from "./FormField";

describe("FormField", () => {
    it("renders the label and children", () => {
        render(
            <FormField label="Nama Lengkap" htmlFor="name">
                <input id="name" />
            </FormField>
        );

        const label = screen.getByText("Nama Lengkap");
        expect(label).toBeInTheDocument();
        expect(label.tagName).toBe("LABEL");
        expect(label).toHaveAttribute("for", "name");
        expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("shows the required asterisk when required is true", () => {
        render(
            <FormField label="Email" required>
                <input />
            </FormField>
        );

        expect(screen.getByText("*")).toBeInTheDocument();
        expect(screen.getByText("*")).toHaveClass("text-[#FF0000]");
    });

    it("hides the required asterisk by default", () => {
        render(
            <FormField label="Email">
                <input />
            </FormField>
        );

        expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("shows the error text when error is provided", () => {
        render(
            <FormField label="Email" error="Email wajib diisi.">
                <input />
            </FormField>
        );

        expect(screen.getByText("Email wajib diisi.")).toBeInTheDocument();
    });

    it("hides the error text when error is absent", () => {
        render(
            <FormField label="Email">
                <input />
            </FormField>
        );

        expect(screen.queryByText("Email wajib diisi.")).not.toBeInTheDocument();
    });
});