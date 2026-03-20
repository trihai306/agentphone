const fs = require('fs');
const path = require('path');

const LANG_DIR = path.join(__dirname, '..', 'resources', 'lang');
const EN_FILE = path.join(LANG_DIR, 'en.json');
const VI_FILE = path.join(LANG_DIR, 'vi.json');

// The 51 missing keys to add
const MISSING_KEYS = {
  'ai_studio.chars_remaining':        { en: 'characters remaining', vi: 'ký tự còn lại' },
  'ai_studio.character_added':        { en: 'Character added', vi: 'Đã thêm nhân vật' },
  'ai_studio.images_selected':        { en: 'images selected', vi: 'ảnh đã chọn' },
  'ai_studio.characters_defined':     { en: 'characters defined', vi: 'nhân vật đã định nghĩa' },
  'ai_studio.need_more_credits':      { en: 'Need more credits', vi: 'Cần thêm credits' },
  'ai_studio.generate_count':         { en: 'Generate {{count}}', vi: 'Tạo {{count}}' },
  'ai_studio.scenes_completed_count': { en: '{{count}} scenes completed', vi: '{{count}} cảnh hoàn thành' },
  'ai_studio.artworks_created':       { en: 'artworks created', vi: 'tác phẩm đã tạo' },
  'media.load_error':                 { en: 'Failed to load library', vi: 'Không thể tải thư viện' },
  'media.upload_error':               { en: 'Upload failed', vi: 'Tải lên thất bại' },
  'media.folders':                    { en: 'Folders', vi: 'Thư mục' },
  'common.saving':                    { en: 'Saving...', vi: 'Đang lưu...' },
  'common.save_changes':              { en: 'Save Changes', vi: 'Lưu thay đổi' },
  'common.created':                   { en: 'Created', vi: 'Đã tạo' },
  'common.updated':                   { en: 'Updated', vi: 'Đã cập nhật' },
  'common.on':                        { en: 'On', vi: 'Bật' },
  'common.off':                       { en: 'Off', vi: 'Tắt' },
  'common.cancelling':                { en: 'Cancelling...', vi: 'Đang hủy...' },
  'common.copied':                    { en: 'Copied!', vi: 'Đã sao chép!' },
  'common.copy':                      { en: 'Copy', vi: 'Sao chép' },
  'devices.live_view':                { en: 'Live View', vi: 'Xem trực tiếp' },
  'marketplace.select_campaign':      { en: 'Select Campaign', vi: 'Chọn Campaign' },
  'marketplace.choose_campaign':      { en: 'Choose a campaign', vi: 'Chọn một campaign' },
  'marketplace.includes_resources':   { en: 'Includes resources', vi: 'Bao gồm tài nguyên' },
  'notifications.mark_as_read':       { en: 'Mark as read', vi: 'Đánh dấu đã đọc' },
  'notifications.detail':             { en: 'Detail', vi: 'Chi tiết' },
  'packages.package':                 { en: 'Package', vi: 'Gói' },
  'packages.details_label':           { en: 'Details', vi: 'Chi tiết' },
  'packages.back_to_packages':        { en: 'Back to packages', vi: 'Quay lại gói dịch vụ' },
  'packages.cancel_question':         { en: 'Are you sure you want to cancel?', vi: 'Bạn có chắc muốn hủy?' },
  'packages.cancel_confirm':          { en: 'Yes, cancel', vi: 'Có, hủy gói' },
  'packages.keep_package':            { en: 'No, keep it', vi: 'Không, giữ lại' },
  'packages.payment':                 { en: 'Payment', vi: 'Thanh toán' },
  'packages.complete_payment':        { en: 'Complete Payment', vi: 'Hoàn tất thanh toán' },
  'packages.status':                  { en: 'Status', vi: 'Trạng thái' },
  'packages.bank_transfer_details':   { en: 'Bank Transfer Details', vi: 'Thông tin chuyển khoản' },
  'packages.bank':                    { en: 'Bank', vi: 'Ngân hàng' },
  'packages.transfer_description':    { en: 'Transfer Description', vi: 'Nội dung chuyển khoản' },
  'packages.amount_to_transfer':      { en: 'Amount to Transfer', vi: 'Số tiền cần chuyển' },
  'packages.note_description':        { en: 'Use the exact transfer description', vi: 'Sử dụng đúng nội dung chuyển khoản' },
  'packages.completed_payment':       { en: "I've Completed Payment", vi: 'Tôi đã thanh toán' },
  'packages.details':                 { en: 'Package Details', vi: 'Chi tiết gói' },
  'packages.info':                    { en: 'Package Info', vi: 'Thông tin gói' },
  'packages.code':                    { en: 'Package Code', vi: 'Mã gói' },
  'packages.type_label':              { en: 'Type', vi: 'Loại' },
  'packages.money_back':              { en: 'Money-back Guarantee', vi: 'Đảm bảo hoàn tiền' },
  'packages.refund_note':             { en: '100% refund within the first 7 days', vi: 'Hoàn tiền 100% trong 7 ngày đầu' },
  'packages.complete_subscription':   { en: 'Complete Subscription', vi: 'Hoàn tất đăng ký' },
  'packages.existing_warning':        { en: 'You already have this package', vi: 'Bạn đã có gói này' },
  'packages.agree_terms':             { en: 'I agree to the terms', vi: 'Tôi đồng ý với điều khoản' },
  'packages.pay':                     { en: 'Pay', vi: 'Thanh toán' },
};

// Helper: set a nested key like "common.saving" in an object
function setNestedKey(obj, dottedKey, value) {
  const parts = dottedKey.split('.');
  if (parts.length === 1) {
    obj[dottedKey] = value;
    return;
  }
  const [namespace, key] = [parts[0], parts.slice(1).join('.')];
  if (!obj[namespace] || typeof obj[namespace] !== 'object') {
    obj[namespace] = {};
  }
  obj[namespace][key] = value;
}

// Helper: check if a nested key exists
function hasNestedKey(obj, dottedKey) {
  const parts = dottedKey.split('.');
  if (parts.length === 1) {
    return dottedKey in obj;
  }
  const [namespace, key] = [parts[0], parts.slice(1).join('.')];
  if (!obj[namespace] || typeof obj[namespace] !== 'object') return false;
  return key in obj[namespace];
}

// Load JSON files
const en = JSON.parse(fs.readFileSync(EN_FILE, 'utf8'));
const vi = JSON.parse(fs.readFileSync(VI_FILE, 'utf8'));

let addedCount = 0;
let skippedCount = 0;

for (const [key, vals] of Object.entries(MISSING_KEYS)) {
  const enExists = hasNestedKey(en, key);
  const viExists = hasNestedKey(vi, key);

  if (enExists && viExists) {
    skippedCount++;
    continue;
  }

  if (!enExists) {
    setNestedKey(en, key, vals.en);
  }
  if (!viExists) {
    setNestedKey(vi, key, vals.vi);
  }
  addedCount++;
  console.log(`  Added: ${key}`);
}

// Write back
fs.writeFileSync(EN_FILE, JSON.stringify(en, null, 4) + '\n', 'utf8');
fs.writeFileSync(VI_FILE, JSON.stringify(vi, null, 4) + '\n', 'utf8');

console.log(`\nDone! Added ${addedCount} keys, skipped ${skippedCount} (already existed).`);

// Now verify: scan all .jsx files for t('key') calls and check against en.json
console.log('\n--- Verification: scanning .jsx files for missing t() keys ---');

const JS_DIR = path.join(__dirname, '..', 'resources', 'js');

// Flatten en.json keys
function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) {
      keys = keys.concat(flattenKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enReloaded = JSON.parse(fs.readFileSync(EN_FILE, 'utf8'));
const allEnKeys = new Set(flattenKeys(enReloaded));

// Recursively find .jsx files
function findJsx(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findJsx(full));
    } else if (entry.name.endsWith('.jsx')) {
      results.push(full);
    }
  }
  return results;
}

const jsxFiles = findJsx(JS_DIR);

// Regex to find t('key') or t("key") calls
const tCallRegex = /\bt\(\s*['"]([a-zA-Z_][a-zA-Z0-9_.]*)['"]/g;

// Bare words that are false positives (no namespace)
const SKIP_BARE = new Set([
  'password', 'created_at', 'updated_at', 'email', 'name', 'title',
  'type', 'status', 'description', 'date', 'time', 'user', 'role',
  'active', 'inactive', 'pending', 'error', 'success', 'warning',
  'info', 'true', 'false', 'null', 'undefined',
]);

const missingKeys = new Set();

for (const file of jsxFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = tCallRegex.exec(content)) !== null) {
    const key = match[1];
    // Skip bare words without a dot (likely false positives)
    if (!key.includes('.') && SKIP_BARE.has(key)) continue;
    if (!allEnKeys.has(key)) {
      missingKeys.add(key);
    }
  }
}

if (missingKeys.size === 0) {
  console.log('All t() keys found in en.json! 0 missing keys.');
} else {
  console.log(`Still missing ${missingKeys.size} keys:`);
  for (const k of [...missingKeys].sort()) {
    console.log(`  - ${k}`);
  }
}
