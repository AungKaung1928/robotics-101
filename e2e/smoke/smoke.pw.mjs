// The same reader paths as e2e/smoke/local.mjs, with real input (mouse, keyboard, touch) and view transitions on.
import { expect, test } from '@playwright/test'

const atLang = async (page, lang, hash = '') => {
  await page.addInitScript((l) => { if (!sessionStorage.getItem('smoke')) { localStorage.setItem('r101-lang', l); sessionStorage.setItem('smoke', '1') } }, lang)
  await page.goto('/' + hash)
  await expect(page.locator('html')).toHaveAttribute('lang', lang)
}
const hash = (page) => page.evaluate(() => location.hash)

for (const lang of ['en', 'ja', 'my']) {
  test.describe(lang, () => {
    test('map -> chapter -> next -> prev', async ({ page }) => {
      await atLang(page, lang)
      await page.locator('a[href^="#/0/"]').first().click()
      await expect(page).toHaveURL(/#\/0\//)
      const first = await hash(page)
      await page.locator('nav.steps a', { hasText: '→' }).click()
      await expect.poll(() => hash(page)).not.toBe(first)
      await page.locator('nav.steps a', { hasText: '←' }).click()
      await expect.poll(() => hash(page)).toBe(first)
    })

    test('chosen language survives reload', async ({ page }) => {
      await atLang(page, lang, '#/scan')
      await page.locator('.langs button[aria-pressed="false"]').first().click()
      const picked = await page.locator('html').getAttribute('lang')
      expect(picked).not.toBe(lang)
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('lang', picked)
    })

    test('break-it button gives feedback', async ({ page }) => {
      await atLang(page, lang, '#/1/decide')
      const before = await page.locator('main').innerText()
      await page.locator('button.break').click()
      await expect.poll(() => page.locator('main').innerText()).not.toBe(before)
    })

    test('no sideways scroll at 320/360/390 px', async ({ page }) => {
      await atLang(page, lang)
      const routes = [...new Set(await page.locator('a[href^="#/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href'))))]
      expect(routes.length).toBeGreaterThan(30)
      const wide = []
      for (const w of [320, 360, 390]) {
        await page.setViewportSize({ width: w, height: 800 })
        for (const [i, h] of routes.entries()) {
          await page.goto(`/?n=${w}-${i}${h}`) // query = a full load, not a same-document hash change
          await page.locator('h1').first().waitFor()
          const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
          if (sw > cw) wide.push(`${w}px ${h} ${sw}>${cw}`)
        }
      }
      expect(wide).toEqual([])
    })
  })
}

test('arrow keys move between chapters', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no hardware keyboard on phone/tablet projects')
  await atLang(page, 'en', '#/scan')
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => hash(page)).toBe('#/detect')
  await page.keyboard.press('ArrowLeft')
  await expect.poll(() => hash(page)).toBe('#/scan')
})

test('drag handle: pointer drag, and the sliders as keyboard path', async ({ page, isMobile }) => {
  await atLang(page, 'en', '#/scan')
  const slider = page.locator('input[type=range]').first()
  const v0 = await slider.inputValue()
  await slider.focus()
  await page.keyboard.press('ArrowRight')
  await expect(slider).not.toHaveValue(v0)
  if (isMobile) return // touch drag: Playwright has tap only; a real-device check covers it (BROWSER_COVERAGE.md)
  const before = await page.locator('input[type=range]').evaluateAll((s) => s.map((x) => x.value).join())
  const box = await page.locator('.grab').first().boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20, { steps: 5 })
  await page.mouse.up()
  await expect.poll(() => page.locator('input[type=range]').evaluateAll((s) => s.map((x) => x.value).join())).not.toBe(before)
})

test('Burmese renders with Noto Sans Myanmar', async ({ page }, info) => {
  await atLang(page, 'my', '#/0/meet')
  const r = await page.evaluate(async () => {
    await document.fonts.load('16px "Noto Sans Myanmar"', 'မ')
    await document.fonts.ready
    const face = [...document.fonts].find((f) => f.family.includes('Myanmar'))
    return { status: face?.status, font: getComputedStyle(document.querySelector('h1')).fontFamily }
  })
  expect(r.status).toBe('loaded')
  expect(r.font).toMatch(/^"?Noto Sans Myanmar/)
  await info.attach('burmese', { body: await page.screenshot(), contentType: 'image/png' })
})
