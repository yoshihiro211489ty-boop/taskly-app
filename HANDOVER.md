# タスクリー 引き継ぎプロンプト

## 別PCで作業を始めるときのセットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/yoshihiro211489ty-boop/taskly-app.git
cd taskly-app

# 2. 依存パッケージをインストール（Node.js 18以上が必要）
npm install

# 3. 環境変数ファイルを作成
cp .env.example .env
# .env を開いて Supabase の値を入力（下記参照）

# 4. 開発サーバー起動
npx expo start
```

## 環境変数（.env）

```
EXPO_PUBLIC_SUPABASE_URL=https://mtkldmphkicnogpahwrb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10a2xkbXBoa2ljbm9ncGFod3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNjIzOTQsImV4cCI6MjA5NDgzODM5NH0.J7BVUlXc3RlmFv1CV85xDbpHxmuSgvMwxfSPmlRUhwo
```

## EAS ビルド用トークン（ビルドするとき）

```bash
export EXPO_TOKEN="tfYynIxzXZLnvtxy-FEFsVDW-YnWvl0yYJF0x-Jy"
```

## アカウント情報

| サービス | アカウント |
|---|---|
| GitHub | yoshihiro211489ty-boop |
| Expo/EAS | yoshihiro211489ty (yoshihiro211489ty@gmail.com) |
| Supabase | プロジェクトID: mtkldmphkicnogpahwrb |
| Apple ID | yoshihiro211489ty@gmail.com |

---

## Claude への引き継ぎプロンプト

新しいセッションで以下をそのまま貼り付けてください：

---

**【タスクリー アプリ 引き継ぎ】**

React Native + Expo のチームタスク管理アプリ「タスクリー」の開発を引き継いでください。

**リポジトリ**
`https://github.com/yoshihiro211489ty-boop/taskly-app`

**技術スタック**
- Expo SDK 54 / React Native 0.81.5
- Supabase (プロジェクトID: mtkldmphkicnogpahwrb)
- EAS Build (プロジェクト: @yoshihiro211489ty/taskly)
- i18n: react-i18next (日本語/英語)
- デザイントークン: lib/designTokens.ts (primary: #4F5DEB, accent: #22C9A9)
- アニメーション: react-native-reanimated v4
- アイコン: phosphor-react-native
- グラデーション: expo-linear-gradient

**現在の完了状況**
- ✅ タスク作成・編集・削除UI
- ✅ ルーティン作成・編集・削除UI
- ✅ 30日グリッドのルーティン統計画面
- ✅ チーム統計（自分/チーム全体タブ）
- ✅ タスク最終編集者トラッキング (updated_by/updated_at)
- ✅ デザインシステム刷新 (新パレット + Reanimated + LinearGradient)
- ✅ BottomTab カスタムアニメーション (Phosphor icons)
- ✅ ログイン画面リデザイン
- ✅ EASプロジェクト作成・Android APKビルド実施中
- ✅ GitHub: yoshihiro211489ty-boop/taskly-app

**次にやること（優先順位順）**
1. Android APKビルドの確認（EASビルドID: 312bf97c）
2. Apple Developer アカウントでの iOS ビルド設定
   - Apple ID: yoshihiro211489ty@gmail.com
   - eas.json の APPLE_ID_PLACEHOLDER 等を実際の値に更新
3. App Store 審査状況の確認（appstoreconnect.apple.com）
4. デザインのFigma連携・画面のブラッシュアップ
5. 課金機能 (RevenueCat) 実装
6. プッシュ通知 (expo-notifications) 実装

**EASビルドコマンド（EXPO_TOKEN 環境変数が必要）**
```bash
# EXPO_TOKEN は expo.dev の設定ページ → Access Tokens から取得
export EXPO_TOKEN="your_expo_token_here"
# Android APK
eas build --platform android --profile preview --non-interactive
# iOS (Apple Developer 設定後)
eas build --platform ios --profile production --non-interactive
```

**Supabase Management API**
```
# PAT は supabase.com → Account → Access Tokens から取得
PAT: sbp_xxxx（各自で発行）
URL: https://api.supabase.com/v1/projects/mtkldmphkicnogpahwrb/database/query
```

---

## Figma でデザインを作り込む方法

### セットアップ
1. [figma.com](https://www.figma.com) で無料アカウント作成
2. 「New design file」でファイル作成
3. 「タスクリー」と名前をつける

### モバイルフレームの設定
1. `F` キー → iPhone 14 フレームを選択 (390×844)
2. 画面ごとにフレームを作成

### デザイントークンをFigmaに反映
以下の色を「Colors」スタイルとして登録：

| 名前 | カラーコード |
|---|---|
| Primary | #4F5DEB |
| Accent | #22C9A9 |
| Navy | #162033 |
| BgPage | #F5F7FC |
| BgCard | #FFFFFF |
| TextMuted | #526179 |

### Figma → コードの流れ
1. Figmaでデザイン → 「Dev Mode」でCSS/値を確認
2. `lib/designTokens.ts` に反映
3. 各スクリーンのStyleSheet を更新

### AI活用（おすすめ）
- **Figma AI**: 「/」キー → AI で自動レイアウト生成
- **Builder.io プラグイン**: Figma → React Native コード自動変換
- **Anima プラグイン**: Figma → Expo コード生成

---

## Git 日常操作

```bash
# 作業後のコミット&プッシュ
git add .
git commit -m "作業内容の説明"
git push origin main

# 別PCで最新を取得
git pull origin main
```
