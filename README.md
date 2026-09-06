# MyEnglish

自分専用の英語学習管理Webアプリ（B1 → B2 → C1 / IELTS 7.0）。

- 公開URL: https://tkiyotsune.github.io/MyEnglish/
- 学習ノート: [フレーズ・前置詞・接続詞](https://tkiyotsune.github.io/MyEnglish/english_phrases_complete.html) / [英単語帳](https://tkiyotsune.github.io/MyEnglish/english_vocab_notebook.html)

## 開発

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npx tsc --noEmit
npm run build      # 静的書き出し → out/
```

`main` に push すると GitHub Actions が `NEXT_PUBLIC_BASE_PATH=/MyEnglish` でビルドし、GitHub Pages にデプロイします。

## 構成

- `src/lib/types.ts` — データ型
- `src/lib/repository/` — 永続化層（現在は LocalStorage。Supabase へ差し替え可能）
- `src/lib/store/AppProvider.tsx` — 状態管理と操作
- `src/lib/seed/` — 初期データ（Daily Task 目標、ロードマップ、教材、瞬間英作文、文法テーマ）
- `src/app/*` — 各画面

データはブラウザの LocalStorage に保存されます。Settings から JSON の書き出し / 取り込みができます。
