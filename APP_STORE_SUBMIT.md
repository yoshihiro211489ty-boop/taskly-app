# App Store 提出チェックリスト — タスクリー v1.0

GitHub Pages: https://yoshihiro211489ty-boop.github.io/taskly-app/
プライバシーポリシー URL: https://yoshihiro211489ty-boop.github.io/taskly-app/privacy.html
利用規約 URL: https://yoshihiro211489ty-boop.github.io/taskly-app/terms.html
サポートメール: yosihiro1988ty@yahoo.co.jp

---

## ステップ 1 — Apple Developer アカウント（$99/年）

1. https://developer.apple.com/account/ でサインアップ
2. 「Enroll」→ Individual（個人） を選択
3. 本人確認・決済完了まで 1〜2 日かかる場合あり
4. 登録完了後、Team ID を https://developer.apple.com/account/ の右上で確認
   → `eas.json` の `APPLE_TEAM_ID_PLACEHOLDER` を実際の Team ID（10桁英数字）に更新

---

## ステップ 2 — App Store Connect でアプリ作成

1. https://appstoreconnect.apple.com/ にサインイン
2. 「マイ App」→ 「＋」→「新規 App」
3. 以下を入力:

| 項目 | 入力値 |
|------|--------|
| プラットフォーム | iOS |
| 名前 | タスクリー - グループでタスク管理 |
| プライマリ言語 | 日本語 |
| Bundle ID | com.taskly.app |
| SKU | taskly-v1 |

4. 作成後、URL の数字が App ID（ascAppId）→ `eas.json` の `APP_STORE_CONNECT_APP_ID_PLACEHOLDER` に入力

---

## ステップ 3 — App Store Connect メタデータ入力

### アプリ名（30文字以内）
```
タスクリー - グループでタスク管理
```

### サブタイトル（30文字以内）
```
チームのタスクを、ひとつの画面で。
```

### カテゴリ
- プライマリ: 仕事効率化（Productivity）
- セカンダリ: ビジネス（Business）

### キーワード（100文字以内）
```
タスク管理,グループ,チーム,ルーティン,共有,部活,サークル,スケジュール,習慣,担当,進捗,チェックリスト,役割,趣味,店舗
```

### 説明文（4000文字以内）
下記をそのままコピー:

```
グループのタスク管理、LINEで流れていませんか？

サークルの仕事分担、趣味グループのイベント準備、小さなお店のスタッフシフト——「誰が何をやるか」を把握するのに、チャットの海を泳いだり、重たいスプレッドシートを開いたりしていませんか。タスクリーは、そういうチームのために作りました。

■ タスクリーでできること

・グループのタスクを全員で共有。誰が何を担当しているか、一目でわかる
・「今日もちゃんとやった？」を確認できるルーティン機能。毎週の練習準備も、日次のチェック項目も
・タスクの完了をメンバーがワンタップで報告。追いかけなくていい
・進捗を一覧で確認できるチームダッシュボード。LINEを遡らなくていい
・役割の割り当てと担当者の明示。「あれ、誰がやるんだっけ？」がなくなる
・無料で今日からはじめられる。招待リンクを送るだけでチームが揃う

■ こんなチームに使われています

▷ 大学サークル・部活
試合前の役割分担、備品の準備チェック、定期練習のルーティン確認。タスクリーを使えば、幹事がひとりで抱えていた「確認作業」をチーム全員で見える化できます。

▷ 趣味グループ・コミュニティ
読書会の次回テーマ確認、ランニンググループの集合場所と持ち物、保護者グループの当番表。Notionほど本格的じゃなくていい、でもLINEだと絶対流れる。そんな「ちょうどいい」ニーズに答えます。

▷ 小規模なお店・会社チーム
5〜30人規模のお店やチームで、「今日の開店前チェック、全員やった？」を把握したい現場に。タスクとルーティンを分けて管理でき、スタッフ全員の進捗がスマホひとつで確認できます。

■ 料金について

タスクリーは無料でご利用いただけます。タスク数・ルーティン数の上限を広げたい場合は、プレミアムプランへのアップグレードをご検討ください。

まず無料で試して、あなたのチームに合うか確かめてください。招待リンクをメンバーに送るだけで、今日から使えます。
```

### サポート URL
```
https://yoshihiro211489ty-boop.github.io/taskly-app/
```

### マーケティング URL（任意）
```
https://yoshihiro211489ty-boop.github.io/taskly-app/
```

### プライバシーポリシー URL（必須）
```
https://yoshihiro211489ty-boop.github.io/taskly-app/privacy.html
```

### 年齢制限
- 4+ を選択（暴力・ギャンブル等なし）

---

## ステップ 4 — RevenueCat セットアップ

1. https://app.revenuecat.com でアカウント作成
2. New Project → Project Name: `タスクリー`
3. iOS App を追加:
   - Bundle ID: `com.taskly.app`
   - API Key をコピー（`appl_` で始まる）
4. Android App を追加:
   - Package: `com.taskly.app`
   - API Key をコピー（`goog_` で始まる）
5. Entitlement を作成:
   - Identifier: `premium`（billing.ts の `ENTITLEMENT_PREMIUM` と一致）
6. Product を App Store Connect / Google Play で先に作成してから RevenueCat Products に登録
7. `.env` に貼り付け:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
   ```
8. EAS Secrets にも登録（ビルド時に使われる）:
   ```
   eas secret:push --scope project --env-file .env
   ```

---

## ステップ 5 — Sentry セットアップ

1. https://sentry.io でアカウント作成
2. New Project → React Native → Project Name: `taskly`
3. Settings → SDK Setup → DSN をコピー
4. `.env` に貼り付け:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://xxxx@xxxxxx.ingest.sentry.io/xxxxx
   ```
5. EAS Secrets に登録:
   ```
   eas secret:push --scope project --env-file .env
   ```

---

## ステップ 6 — EAS 設定ファイル更新

`eas.json` の以下を実際の値に更新:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "あなたのApple ID メールアドレス",
      "ascAppId": "App Store Connect の App ID（数字）",
      "appleTeamId": "Apple Developer の Team ID（10桁英数字）"
    }
  }
}
```

---

## ステップ 7 — iOS ビルドと提出

```bash
# iOS プロダクションビルド（初回は Apple 認証が走る）
eas build --platform ios --profile production

# ビルド完了後、App Store Connect に提出
eas submit --platform ios --profile production
```

---

## ステップ 8 — App Store Connect 審査提出前の確認

- [ ] スクリーンショット（6.7インチ・5.5インチ各1枚以上）をアップロード
- [ ] App Store Connect でアプリ情報をすべて入力
- [ ] プライバシーポリシー URL が開けることを確認
- [ ] テストアカウント（Test flight）で動作確認
- [ ] App Privacy セクション（データ収集）を入力
- [ ] 「審査のために提出」をクリック

---

## 残り作業まとめ（あなたがやること 3 つ）

| # | 作業 | 所要時間 |
|---|------|----------|
| 1 | Apple Developer 登録（$99/年） | 数時間〜2日 |
| 2 | RevenueCat + Sentry アカウント作成 → .env に貼り付け | 30分 |
| 3 | App Store Connect でアプリ情報入力 + 審査提出 | 1〜2時間 |
