# 會計師三法學習小教室

第九週 AI 課程專案：以 `AGENTS.md` 規定網站風格、題庫格式、來源查核與新增流程，建立可持續擴充的三法練習網站。

## 目前可以做什麼

- 選擇公司法、證券交易法或商業會計法，每個法別各 3 題，共 9 題。
- 作答後查看官方答案、學習解析、四個選項的說明及官方法條連結。
- 查看完成進度、答對題數與正確率；回到已答題複習，或重新練習。
- 以白底、藍綠色呈現；支援手機及鍵盤操作。
- 三個法別分開保留同次網頁開啟期間的進度；重新整理後清空。

題目採 114 年 8 題、113 年 1 題會計師官方試題節選。解析為依據法條自行整理，並非考選部官方解析。本作品不是完整題庫、即時聊天機器人或會計師考試評分系統。

## 在電腦開啟

1. 解壓縮完整專案。
2. 確認 `index.html`、`assets`、`data` 與 `AGENTS.md` 位於同一層。
3. 用 Chrome、Edge、Safari 或 Firefox 開啟 `index.html`。
4. 點選一個法別，選答案，再按「送出答案」。

不需安裝套件、啟動伺服器或提供 API 金鑰。離線可作答；開啟官方來源連結需要網路。

## 檔案分工

| 檔案 | 用途 |
| --- | --- |
| `AGENTS.md` | AI 開始工作前須閱讀的規則文件 |
| `index.html` | 網站入口 |
| `assets/css/style.css` | 共用版面與配色 |
| `assets/js/app.js` | 題目呈現、作答、導覽與計分 |
| `data/questions.js` | 正式題庫，所有可練習題目的唯一資料來源 |
| `templates/question-template.json` | 新增題目欄位範本 |
| `templates/company-q06-example.json` | 第 10 題新增示例，預設不在正式題庫內 |
| `docs/sources.md` | 考題、答案、法條與版本查核紀錄 |
| `docs/change-log.md` | 修改及延伸驗證紀錄 |
| `docs/verification.md` | 實際檢查結果與尚未完成事項 |
| `docs/homework.md` | 作業繳交內容草稿，發布後補上自己的連結 |
| `tests/quiz.test.cjs` | 計分、狀態與新增題目的自動檢查 |

## 之後如何請 AI 新增內容

先提供完整專案，再交辦：

> 請先閱讀 AGENTS.md，新增一題尚未收錄的會計師公司法歷屆選擇題。請核對考選部原題、官方答案、更正紀錄與適用法條，補齊解析及來源，只修改必要檔案，並驗證首頁題數、作答進度及計分會自動更新。

AI 應依範本加入 `data/questions.js`，並更新來源與變更紀錄。網頁會從題庫計算題數與分母，不用為每一題重新設計頁面。

也可先用現成示例做延伸練習：

> 請先閱讀 AGENTS.md，將 templates/company-q06-example.json 中已查核的題目加入正式題庫，保留其 ID，確認沒有重複。完成後公司法應有 4 題、總題數應為 10 題；更新文件並測試，不改動原有風格。

示例中的題目為 114 年公司法第 6 題。第一版仍保留正式 9 題，示例獨立放置。

## 開發檢查（一般瀏覽不需要）

已安裝 Node.js 時，在專案資料夾執行：

```bash
node --test tests/quiz.test.cjs
```

## 上傳與發布

專案已上傳至 GitHub，並完成本機作答與解析測試。GitHub Pages 已設定使用 main 分支的根目錄，目前正在確認公開發布結果。

請將專案內的所有必要檔案上傳到自己的 Repository，確保 `index.html` 與 `AGENTS.md` 位於 Repository 根目錄。發布後依 `docs/verification.md` 再檢查公開連結。

官方操作說明：

- [將檔案加入 Repository](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [建立 GitHub Pages 網站](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

## 來源與使用

原始試題及標準答案由考選部公布；本站保留原題幹及 A～D 順序，僅整理空白、換行及 PDF 選項符號。法律依據來自全國法規資料庫及主管機關官方資料。請勿把補習班或出版社解析直接複製為本專案內容。

詳細來源與修法檢查見 `docs/sources.md`。查核日期：2026-11-16。
