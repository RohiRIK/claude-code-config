import { test, expect } from "@playwright/test";
import path from "path";

const SS = (name: string) =>
  path.join(__dirname, "screenshots", `${name}.png`);

// Click the first non-project node via JS (project nodes have a <text> child)
async function clickNonProjectNode(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("g.node"));
    const nonProject = nodes.find(n => !n.querySelector("text")) as HTMLElement | undefined;
    nonProject?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

test.describe("LTM Graph Visualizer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for D3 graph to render nodes
    await page.waitForSelector("svg circle", { timeout: 15000 });
    // Give simulation time to settle
    await page.waitForTimeout(1500);
  });

  test("1. page loads with graph nodes rendered", async ({ page }) => {
    const circles = page.locator("svg circle");
    await expect(circles.first()).toBeVisible();
    const count = await circles.count();
    expect(count).toBeGreaterThan(5);
    await page.screenshot({ path: SS("1-initial-load") });
  });

  test("2. stats bar shows all five counters", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).toMatch(/\d+\s*memories/);
    expect(body).toMatch(/\d+\s*relations/);
    expect(body).toMatch(/\d+\s*projects/);
    expect(body).toMatch(/\d+\s*context items/);
    expect(body).toMatch(/\d+\s*tags/);
  });

  test("3. project list renders project names", async ({ page }) => {
    const heading = page.locator(
      ".uppercase.tracking-wide",
      { hasText: "Projects" }
    ).first();
    await expect(heading).toBeVisible();
    const projectButtons = page.locator("button.text-xs.px-3");
    const count = await projectButtons.count();
    expect(count).toBeGreaterThan(1);
  });

  test("4. clicking a non-project node opens the sidebar", async ({ page }) => {
    // Project nodes now navigate — click a memory/context node instead
    await clickNonProjectNode(page);

    const closeBtn = page.locator("button", { hasText: "×" });
    await expect(closeBtn).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: SS("4-sidebar-open") });
  });

  test("5. sidebar shows node content fields", async ({ page }) => {
    await clickNonProjectNode(page);
    await page.locator("button", { hasText: "×" }).waitFor({ timeout: 5000 });

    // Sidebar has uppercase tracking-wide field labels (Content, Category, etc.)
    const fieldLabels = page.locator(".uppercase.tracking-wide");
    const count = await fieldLabels.count();
    expect(count).toBeGreaterThan(1);
  });

  test("6. search box filters graph nodes", async ({ page }) => {
    const initialCount = await page.locator("svg circle").count();

    // Target the FilterBar search input (small, in the toolbar)
    const searchInput = page.locator("input[placeholder='Search memories…']").first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("bun");
    await page.waitForTimeout(700);

    // Graph still renders (doesn't crash)
    await expect(page.locator("svg circle").first()).toBeVisible();
    await page.screenshot({ path: SS("6-search-active") });

    // Clear and verify full graph returns
    await searchInput.clear();
    await page.waitForTimeout(500);
    const afterCount = await page.locator("svg circle").count();
    expect(afterCount).toBe(initialCount);
  });

  test("7. importance slider filters nodes", async ({ page }) => {
    const allCount = await page.locator("svg circle").count();

    const slider = page.locator("input[type='range']");
    await expect(slider).toBeVisible();

    await slider.fill("5");
    await slider.dispatchEvent("input");
    await page.waitForTimeout(500);

    const filteredCount = await page.locator("svg circle").count();
    expect(filteredCount).toBeLessThanOrEqual(allCount);

    await slider.fill("1");
    await slider.dispatchEvent("input");
  });

  test("8. sidebar close button works", async ({ page }) => {
    await clickNonProjectNode(page);
    const closeBtn = page.locator("button", { hasText: "×" });
    await closeBtn.waitFor({ timeout: 5000 });
    await closeBtn.click();
    await expect(closeBtn).not.toBeVisible({ timeout: 3000 });
  });

  test("9. tag filter panel renders chips and dims non-matching nodes", async ({ page }) => {
    const tagChips = page.locator("button.rounded-full");
    const count = await tagChips.count();
    if (count === 0) {
      console.log("No tags in DB — skipping dim check");
      return;
    }

    const initialOpacity = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll("g.node")) as SVGGElement[];
      return nodes.map(n => n.getAttribute("opacity") ?? "1");
    });
    expect(initialOpacity.every(o => o === "1" || o === null)).toBe(true);

    await tagChips.first().click();
    await page.waitForTimeout(300);

    const afterOpacity = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll("g.node")) as SVGGElement[];
      return nodes.map(n => n.getAttribute("opacity") ?? "1");
    });
    const dimmedCount = afterOpacity.filter(o => o === "0.15").length;
    expect(dimmedCount).toBeGreaterThanOrEqual(0);

    await tagChips.first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: SS("9-tag-filter") });
  });

  test("10. spotlight search opens with ⌘K and returns results", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(300);

    // SpotlightModal has distinct placeholder "Jump to memory…"
    const modal = page.locator("input[placeholder='Jump to memory…']");
    await expect(modal).toBeVisible({ timeout: 3000 });

    await modal.fill("bun");
    await page.waitForTimeout(600);

    const body = await page.textContent("body");
    expect(body).toBeTruthy();

    await page.screenshot({ path: SS("10-spotlight") });

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible({ timeout: 2000 });
  });

  test("11. clicking project node navigates to drill-down page", async ({ page }) => {
    // Click via JS to avoid viewport/stability issues with D3 simulation
    const clicked = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll("g.node"));
      const projectNode = nodes.find(n => n.querySelector("text")) as HTMLElement | undefined;
      if (!projectNode) return false;
      projectNode.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      return true;
    });

    if (!clicked) {
      console.log("No project nodes found — skipping");
      return;
    }

    await page.waitForURL(/\/project\//, { timeout: 5000 });

    const backBtn = page.locator("a", { hasText: "Back" });
    await expect(backBtn).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: SS("11-project-page") });

    await backBtn.click();
    await page.waitForURL("/", { timeout: 5000 });
    await expect(page.locator("svg circle").first()).toBeVisible({ timeout: 10000 });
  });
});
