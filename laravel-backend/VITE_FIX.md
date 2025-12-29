# Vite React Plugin Error Fix

## Lỗi Gặp Phải

```
ThemeContext.jsx:32 Uncaught Error: @vitejs/plugin-react can't detect preamble. Something is wrong.
```

## ✅ Đã Sửa

### 1. Cập Nhật ThemeContext.jsx

**Trước (Lỗi):**
```jsx
export const useTheme = () => useContext(ThemeContext);
```

**Sau (Đúng):**
```jsx
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
```

**Lý do:**
- @vitejs/plugin-react cần phát hiện được function declarations
- Arrow function exports có thể gây lỗi với React Fast Refresh
- Named function export tốt hơn cho debugging

### 2. Cập Nhật vite.config.js

**Thêm cấu hình:**
```js
react({
    jsxRuntime: 'automatic',
})
```

**Lý do:**
- React 19 yêu cầu JSX runtime automatic
- Giúp Vite biết cách transform JSX đúng

## 🚀 Cách Chạy Lại

### Bước 1: Dọn Cache Vite
```bash
rm -rf node_modules/.vite
```

### Bước 2: Stop Dev Server (Ctrl+C nếu đang chạy)

### Bước 3: Chạy Lại
```bash
npm run dev
```

### Bước 4: Hard Refresh Browser
- Chrome/Edge: `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)
- Hoặc: Open DevTools → Right click refresh → Empty Cache and Hard Reload

## 🔍 Nếu Vẫn Còn Lỗi

### Kiểm Tra 1: Node Modules
```bash
rm -rf node_modules
npm install
```

### Kiểm Tra 2: Clear Browser Storage
1. Mở DevTools (F12)
2. Application tab
3. Clear Storage → Clear site data

### Kiểm Tra 3: Verify Versions
```bash
npm list @vitejs/plugin-react
npm list react
npm list react-dom
```

**Nên có:**
- `@vitejs/plugin-react`: ^5.1.2
- `react`: ^19.x
- `react-dom`: ^19.x

### Kiểm Tra 4: Port Đang Dùng
```bash
# Nếu port 5173 bị chiếm
lsof -ti:5173 | xargs kill -9  # Mac/Linux
# Hoặc restart máy
```

## 📝 Best Practices

### ✅ Nên Làm
```jsx
// Named function export
export function MyComponent() {
    return <div>Hello</div>;
}

// Named function export cho hooks
export function useMyHook() {
    return useState();
}
```

### ❌ Tránh Làm (Có thể gây lỗi)
```jsx
// Arrow function export
export const MyComponent = () => {
    return <div>Hello</div>;
};

// Arrow function hook
export const useMyHook = () => {
    return useState();
};
```

**Lưu ý:** Arrow functions vẫn OK trong component, chỉ tránh ở export level.

## 🎯 Tóm Tắt

1. ✅ Đã sửa ThemeContext.jsx - dùng named function
2. ✅ Đã cập nhật vite.config.js - thêm jsxRuntime
3. ✅ Đã clear Vite cache
4. 🔄 Restart dev server: `npm run dev`
5. 🔄 Hard refresh browser: `Ctrl + Shift + R`

**Nếu làm theo các bước trên, lỗi sẽ hết!** ✨
