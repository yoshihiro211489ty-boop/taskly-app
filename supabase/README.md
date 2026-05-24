# Supabase 3環境セットアップ

タスクリーでは development / staging / production の3つの Supabase プロジェクトを使用します。

---

## 環境の構成

| 環境 | 用途 | ブランチ |
|------|------|----------|
| development | ローカル開発・機能実装 | feature/*, develop |
| staging | リリース前の統合テスト | develop → main PR |
| production | 本番 App Store リリース | main |

---

## Supabase プロジェクトの作成手順

各環境につき1つの Supabase プロジェクトを作成します。

1. [supabase.com](https://supabase.com) にログインする
2. **New project** をクリック
3. プロジェクト名を `taskly-dev` / `taskly-staging` / `taskly-prod` のように命名する
4. 強力なデータベースパスワードを設定し、安全な場所に保管する
5. リージョンは `Northeast Asia (Tokyo)` を推奨

---

## マイグレーションの実行

[Supabase CLI](https://supabase.com/docs/guides/cli) を使用してスキーマを管理します。

```bash
# Supabase CLI のインストール
brew install supabase/tap/supabase

# ローカルでログイン
supabase login

# プロジェクトにリンク（環境ごとに実行）
supabase link --project-ref <PROJECT_REF>

# マイグレーションをリモートに適用
supabase db push

# 現在のリモートスキーマからマイグレーションを生成
supabase db pull
```

**環境別の適用順序:**
1. `development` で変更を開発・テスト
2. `staging` に適用して統合テスト
3. 問題なければ `production` に適用

---

## 環境変数の命名規則

```
EXPO_PUBLIC_SUPABASE_URL      # Supabase プロジェクトの URL
EXPO_PUBLIC_SUPABASE_ANON_KEY # 匿名(公開)キー
```

- `EXPO_PUBLIC_` プレフィックスは Expo がクライアントバンドルに含めるために必要
- 各プロジェクトの値は **Project Settings > API** で確認できる

### ローカル開発

`.env.development` ファイルに設定する（`.gitignore` で除外済み）:

```
APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
```

### EAS Build (staging / production)

本番・ステージングの認証情報は **EAS Secrets** に保存し、コードにはコミットしない:

```bash
# EAS Secrets に登録（staging の例）
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-staging.supabase.co" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-staging-anon-key" --type string
```

---

## セキュリティ上の注意

- **実際のキーは絶対にコミットしない** — `.gitignore` に `.env*` ファイルが含まれていることを確認する
- `anon` キーはクライアントに公開されるが、Row Level Security (RLS) で保護する
- `service_role` キーはサーバーサイドのみで使用し、クライアントには渡さない
- 本番の `service_role` キーは EAS Secrets または CI/CD の環境変数として安全に管理する
- 定期的にキーをローテーションすることを検討する
- Supabase ダッシュボードで不審なアクセスパターンを監視する

---

## 参考リンク

- [Supabase CLI ドキュメント](https://supabase.com/docs/guides/cli)
- [EAS Secrets](https://docs.expo.dev/build-reference/variables/#using-secrets-in-environment-variables)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
