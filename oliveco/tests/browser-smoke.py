"""Optional browser checks: install Python Playwright, then run this file from oliveco/.
Uses headless Edge and a temporary local guide-only server; makes no paid AI calls.
"""
import asyncio
import json
import os
from pathlib import Path
import socket
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'output' / 'qa-python'))
from playwright.async_api import async_playwright, expect, Error


async def main():
    output = ROOT / 'output' / 'chat-hardening'
    output.mkdir(parents=True, exist_ok=True)
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    env = {**os.environ, 'PORT': str(port), 'PUBLIC_ORIGIN': base,
           'CHAT_REQUESTS_PER_MINUTE': '60', 'CHAT_REQUESTS_PER_HOUR': '500'}
    for key in ['AI_API_KEY', 'OPENAI_API_KEY']:
        env.pop(key, None)
    with (output / 'server.log').open('w', encoding='utf-8') as log:
        server = subprocess.Popen(['node', 'server.mjs'], cwd=ROOT, env=env,
                                  stdout=log, stderr=log,
                                  creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(channel='msedge', headless=True)
                errors = []
                for _ in range(50):
                    try:
                        with socket.create_connection(('127.0.0.1', port), timeout=.2):
                            break
                    except OSError:
                        await asyncio.sleep(.1)

                async def open_chat(width=1440, language='en', path='/', timeout_test=False):
                    context = await browser.new_context(viewport={'width': width, 'height': 900})
                    await context.add_init_script(f"localStorage.setItem('oliveco-language', '{language}')")
                    if timeout_test:
                        await context.add_init_script("const originalTimeout = window.setTimeout; window.setTimeout = (fn, ms, ...args) => originalTimeout(fn, ms === 30000 ? 100 : ms, ...args)")
                    page = await context.new_page()
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    await page.goto(base + path, wait_until='networkidle')
                    await page.locator('#chat-launcher').click()
                    return context, page

                async def ask(page, question):
                    await page.locator('#chat-input').fill(question)
                    await page.locator('#chat-input').press('Enter')
                    await expect(page.locator('.chat-loading')).to_have_count(0)

                for width in [390, 1440]:
                    for path in ['/', '/shop?category=home']:
                        context, page = await open_chat(width=width, path=path)
                        await ask(page, 'Tell me about Herbal Q10')
                        card = page.locator('.chat-product[data-chat-product="herbal-q10"]').last
                        await card.click()
                        await expect(page.locator('#chat-messages .user')).to_have_count(2)
                        await expect(page.locator('.chat-loading')).to_have_count(0)
                        await expect(page.locator('#detail-dialog')).to_be_hidden()
                        await expect(page.locator('#chat-panel')).to_be_visible()
                        await expect(page.locator('#chat-launcher')).to_have_attribute('aria-expanded', 'true')
                        await expect(page.locator('#chat-messages .assistant').last).to_contain_text('Directions need confirmation')
                        await ask(page, 'What size is it?')
                        await expect(page.locator('.chat-bubble.assistant').last).to_contain_text('100 g')
                        await context.close()
                print('PASS product-card taps describe the product in chat and preserve contextual follow-ups on both pages at mobile/desktop widths')
                if '--product-chat-only' in sys.argv:
                    assert errors == [], errors
                    await browser.close()
                    return

                context, page = await open_chat()
                await ask(page, 'Tell me about your company')
                await expect(page.locator('.chat-bubble.assistant').last).to_contain_text('1986')
                await ask(page, 'Tell me about Herbal Q10')
                await expect(page.locator('.chat-bubble.assistant').last).to_contain_text('neem')
                await ask(page, 'What size is it?')
                await expect(page.locator('.chat-bubble.assistant').last).to_contain_text('100 g')
                await ask(page, 'I want to buy this')
                await expect(page.locator('.chat-bubble.assistant').last).to_contain_text('09-4150440')
                assert await page.locator('.chat-action[href^="viber:"]').last.get_attribute('href') == 'viber://chat?number=%2B9594150440'
                await page.get_by_role('button', name='Prepare an enquiry').last.click()
                await expect(page.locator('.enquiry-dialog')).to_be_visible()
                await page.keyboard.press('Escape')
                await page.locator('#chat-launcher').click()
                await page.locator('#chat-reset').focus()
                await page.keyboard.press('Enter')
                await expect(page.locator('.chat-bubble')).to_have_count(1)
                await expect(page.locator('#chat-input')).to_be_focused()
                await page.keyboard.press('Escape')
                await expect(page.locator('#chat-panel')).to_be_hidden()
                await expect(page.locator('#chat-launcher')).to_be_focused()
                await context.close()
                print('PASS company, product follow-up, buying handoff, corrected Viber, keyboard restart/close')

                context, page = await open_chat()
                started, release = asyncio.Event(), asyncio.Event()
                requests = []

                async def delayed(route):
                    data = route.request.post_data_json
                    requests.append(data)
                    if data['message'] == 'Tell me about Herbal Q10':
                        started.set()
                        await release.wait()
                        try:
                            await route.fulfill(json={'text': 'STALE REPLY MUST NOT RETURN', 'mode': 'guide'})
                        except Error:
                            pass
                    else:
                        await route.continue_()

                await page.route('**/api/chat', delayed)
                await page.locator('#chat-input').fill('Tell me about Herbal Q10')
                await page.locator('#chat-input').press('Enter')
                await asyncio.wait_for(started.wait(), timeout=5)
                await page.locator('#chat-reset').click()
                await expect(page.locator('.chat-bubble')).to_have_count(1)
                release.set()
                await ask(page, 'About Oliveco')
                assert 'STALE REPLY' not in await page.locator('#chat-messages').inner_text()
                assert requests[-1]['history'] == [] and requests[-1]['context'] == []
                assert 'Herbal Q10' not in (await page.evaluate("sessionStorage.getItem('oliveco-chat')"))
                await context.close()
                print('PASS restart while loading discards stale replies and old history')

                context, page = await open_chat()
                await page.route('**/api/chat', lambda route: route.abort('failed'))
                await ask(page, 'Tell me about Herbal Q10')
                await expect(page.locator('#chat-notice')).to_contain_text('Connection lost')
                await expect(page.locator('.chat-bubble.assistant').last).to_contain_text('neem')
                await expect(page.locator('#chat-retry')).to_be_visible()
                await page.unroute('**/api/chat')
                await page.locator('#chat-retry').click()
                await expect(page.locator('#chat-notice')).to_be_empty()
                await expect(page.locator('.chat-bubble.user')).to_have_count(1)
                await expect(page.locator('#chat-retry')).to_be_hidden()
                await context.close()
                print('PASS network failure keeps product help usable and retry avoids duplicate messages')

                context, page = await open_chat()
                await page.route('**/api/chat', lambda route: route.fulfill(status=429, json={'error': 'chat_rate_limited', 'retryAfter': 2}))
                await ask(page, 'Tell me about Herbal Q10')
                await expect(page.locator('#chat-notice')).to_contain_text('Message limit reached')
                await page.locator('#chat-reset').click()
                await expect(page.locator('.chat-send')).to_be_disabled()
                await expect(page.locator('.chat-send')).to_be_enabled(timeout=4000)
                await expect(page.locator('.chat-bubble')).to_have_count(1)
                await context.close()
                print('PASS server cooldown survives restart and then recovers')

                for bad_response in [{'status': 500, 'json': {'error': 'private provider details'}}, {'json': {'text': 42}}]:
                    context, page = await open_chat(path='/shop')
                    async def bad_reply(route):
                        await route.fulfill(**bad_response)
                    await page.route('**/api/chat', bad_reply)
                    await ask(page, 'Tell me about Herbal Q10')
                    await expect(page.locator('#chat-retry')).to_be_visible()
                    await expect(page.locator('.chat-bubble.assistant').last).to_contain_text('neem')
                    assert 'private provider details' not in await page.locator('#chat-panel').inner_text()
                    await context.close()

                context, page = await open_chat(timeout_test=True)
                release = asyncio.Event()

                async def hold(route):
                    await release.wait()
                    try:
                        await route.abort()
                    except Error:
                        pass

                await page.route('**/api/chat', hold)
                await ask(page, 'Tell me about Herbal Q10')
                await expect(page.locator('#chat-notice')).to_contain_text('reply took too long')
                await expect(page.locator('.chat-bubble.assistant').last).to_contain_text('neem')
                release.set()
                await context.close()
                print('PASS Shop page recovers from 500/malformed responses; a timed-out request keeps product help')

                for width, language in [(320, 'my'), (390, 'en'), (1440, 'en')]:
                    context, page = await open_chat(width, language)
                    await ask(page, 'Oliveco အကြောင်း' if language == 'my' else 'About Oliveco')
                    await expect(page.locator('.chat-bubble.assistant').last).to_contain_text('၁၉၈၆' if language == 'my' else '1986')
                    await expect(page.locator('#chat-panel')).to_have_css('transform', 'none')
                    box = await page.locator('#chat-panel').bounding_box()
                    assert box['x'] >= 0 and box['x'] + box['width'] <= width + 1
                    assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                    reset = await page.locator('#chat-reset').bounding_box()
                    assert reset['width'] >= 44 and reset['height'] >= 44, (width, reset)
                    if width <= 700:
                        assert await page.locator('#chat-input').evaluate('(el)=>parseFloat(getComputedStyle(el).fontSize)') >= 16
                    assert await page.locator('#chat-messages').evaluate('(el)=>el.clientHeight') > 80
                    await page.locator('#chat-panel').screenshot(path=str(output / f'chat-{width}-{language}.png'))
                    await context.close()
                assert errors == [], errors
                await browser.close()
                print('PASS Myanmar/English at 320, 390 and 1440px; controls, reflow, no uncaught browser errors')
        finally:
            server.terminate()
            server.wait(timeout=10)


if __name__ == '__main__':
    asyncio.run(main())
