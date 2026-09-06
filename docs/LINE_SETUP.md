# VAULTEX × LINE 初期設定

アプリ側のLINE連携・LINEログイン・個別通知・リッチメニュー入口は実装済みです。公開環境で有効にするには、LINE DevelopersとVercelへ次を設定します。

## LINE Developers

1. 公式アカウントと同じProvider内に「LINE Login」のチャネルを作成する。
2. Callback URLへ `https://shonai-vaultex.vercel.app/api/line/callback` を登録する。
3. LINE Loginチャネルの「リンクされたLINE公式アカウント」に `@082fhyco` を設定する。
4. Messaging APIチャネルで長期チャネルアクセストークンを発行する。

## Vercel環境変数

- `LINE_LOGIN_CHANNEL_ID`
- `LINE_LOGIN_CHANNEL_SECRET`
- `LINE_LOGIN_CALLBACK_URL=https://shonai-vaultex.vercel.app/api/line/callback`
- `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`
- `NEXT_PUBLIC_APP_URL=https://shonai-vaultex.vercel.app`

秘密値はリポジトリへ保存せず、Production環境変数として登録します。

## リッチメニュー

公式LINE管理画面のリッチメニューには、入口URLとして `https://shonai-vaultex.vercel.app/line` を設定します。入口から「マイページ」「今日・全体予定」「1週間を作成」「記録を入力」「コーチへ相談」「FAMILY」へ直接移動できます。

## 会員・保護者の利用手順

初回のみ従来のメールアドレスでログインし、設定画面の「公式LINEとこのアカウントを連携」を押します。以後はログイン画面の「LINEでログイン」が使えます。選手と保護者は、それぞれ本人のLINEを自分のアカウントへ連携します。
