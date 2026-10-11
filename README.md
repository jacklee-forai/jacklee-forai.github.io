# 大樂透歷史數據分析網站

網站目標網址：`https://jacklee-forai.github.io/`

## 首次部署
1. 將本資料夾全部內容放到 GitHub repository `jacklee-forai/jacklee-forai.github.io` 的 `main` branch 根目錄。
2. GitHub Pages 若尚未啟用：Settings → Pages → Deploy from a branch → `main` / `(root)`。
3. `.github/workflows/update-lotto.yml` 首次加入後會觸發一次資料更新；之後每日台灣時間 21:30–23:45 每 15 分鐘檢查台彩資料。
4. Google Search Console 提交：`https://jacklee-forai.github.io/sitemap.xml`。

更新 workflow 會使用 `contents: write` 提交資料，並使用 `pages: write` 明確請求從 `main` 重建 Pages，讓自動更新的資料同步發布。排程使用 concurrency 避免同時寫入同一分支。

## 資料來源與分析
- 官方 API：Taiwan Lottery Lotto649Result（與 LottoAnalysis v0.50 相同來源）。
- 網站統計保存最近 500 期。
- 跨度分組沿用 v0.50：5–13、14–22、23–31、32–40、41–48。
- 網站僅做歷史資料整理，不保證中獎。
