

# WEB TESTING RULES (MANDATORY)

**BẮT BUỘC**: Mọi test web PHẢI tuân theo quy trình này.

## 1. LUÔN DEPLOY TRƯỚC KHI TEST

**CRITICAL**: KHÔNG BAO GIỜ test trên localhost. Luôn deploy lên production trước, sau đó test trên production URL.

### Quy trình bắt buộc:
```
1. Build xong → git commit + push
2. Deploy lên production (ssh-mcp)
3. Verify services running (supervisorctl status)
4. Test trên https://clickai.lionsoftware.cloud/
```

### ❌ KHÔNG LÀM:
- Test trên `localhost:8000` hoặc `127.0.0.1`
- Mở browser trước khi deploy
- Test khi chưa verify services running

## 2. URL TEST PRODUCTION

| Page | URL |
|------|-----|
| Landing | `https://clickai.lionsoftware.cloud/` |
| Login | `https://clickai.lionsoftware.cloud/login` |
| Register | `https://clickai.lionsoftware.cloud/register` |
| Dashboard | `https://clickai.lionsoftware.cloud/dashboard` |
| Admin | `https://clickai.lionsoftware.cloud/admin` |

## 3. BROWSER TEST RULES

- Mở browser **MỘT LẦN DUY NHẤT** per test
- Nếu trang trắng → check Laravel logs trước (ssh-mcp)
- KHÔNG mở nhiều tabs retry
- Screenshot để verify UI changes

## 4. QUY TRÌNH TEST SAU DEPLOY

```
1. supervisorctl status → verify all RUNNING
2. curl -I http://127.0.0.1:9000 → verify HTTP 200
3. Browser test trên https://clickai.lionsoftware.cloud/
4. Kiểm tra console errors
5. Report kết quả
```
