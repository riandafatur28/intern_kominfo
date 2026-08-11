// Runs before every test file.
// Adds jest-dom matchers (toBeInTheDocument, toHaveTextContent, ...) and
// clears the DOM between tests.
import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
    cleanup();
});
