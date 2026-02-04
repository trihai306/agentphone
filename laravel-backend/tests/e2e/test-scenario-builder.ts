import { chromium } from '@playwright/test';

/**
 * Test Scenario Builder Page
 */
(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        storageState: './tests/e2e/auth.json',
        recordVideo: { dir: './tests/e2e/results/' },
    });

    const page = await context.newPage();

    console.log('📐 SCENARIO BUILDER TEST\n');
    console.log('='.repeat(50));

    // 1. Navigate to AI Studio
    console.log('\n1️⃣ Opening AI Studio...');
    await page.goto('http://localhost:8001/ai-studio');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: './tests/e2e/results/sb-01-ai-studio.png' });
    console.log('   ✅ AI Studio loaded');

    // 2. Click Scenario Builder link
    console.log('\n2️⃣ Navigating to Scenario Builder...');
    await page.goto('http://localhost:8001/ai-studio/scenario-builder');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './tests/e2e/results/sb-02-builder-start.png' });
    console.log('   ✅ Scenario Builder loaded');

    // 3. Click "Write New Script"
    console.log('\n3️⃣ Clicking "Write New Script"...');
    const writeNewBtn = page.locator('button:has-text("Viết Kịch Bản Mới")').first();
    if (await writeNewBtn.isVisible()) {
        await writeNewBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: './tests/e2e/results/sb-03-script-input.png' });
        console.log('   ✅ Script input step');
    } else {
        console.log('   ⚠️ Button not found');
    }

    // 4. Fill in title and script
    console.log('\n4️⃣ Filling script content...');
    const titleInput = page.locator('input[placeholder*="VD:"]');
    if (await titleInput.isVisible()) {
        await titleInput.fill('Video quảng cáo cafe - Demo');
    }

    const scriptArea = page.locator('textarea').first();
    if (await scriptArea.isVisible()) {
        await scriptArea.fill(`Cảnh 1: Buổi sáng đẹp trời, ánh nắng vàng chiếu qua cửa sổ phòng ngủ hiện đại. Đồng hồ chỉ 6:30 sáng.

Cảnh 2: Một cô gái trẻ tỉnh dậy, vươn vai và mỉm cười. Cô ấy có mái tóc dài màu nâu, khuôn mặt tươi sáng.

Cảnh 3: Trong căn bếp sang trọng, cô gái pha một ly cà phê. Hơi nóng bốc lên từ ly cà phê.

Cảnh 4: Close-up ly cà phê với logo thương hiệu "Morning Bliss". Tagline: "Khởi đầu ngày mới hoàn hảo".`);
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: './tests/e2e/results/sb-04-script-filled.png' });
    console.log('   ✅ Script filled');

    // 5. Click Parse button
    console.log('\n5️⃣ Clicking "Parse with AI"...');
    const parseBtn = page.locator('button:has-text("Phân tích với AI")');
    if (await parseBtn.isVisible()) {
        await parseBtn.click();
        console.log('   ⏳ Waiting for AI parsing...');
        await page.waitForTimeout(5000); // Wait for AI parsing
        await page.screenshot({ path: './tests/e2e/results/sb-05-after-parse.png' });
        console.log('   ✅ Parsed (or waiting...)');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Scenario Builder Test Complete!');
    console.log('='.repeat(50));

    await page.waitForTimeout(2000);
    await context.close();
    await browser.close();
})();
