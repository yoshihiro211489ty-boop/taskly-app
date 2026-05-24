# デザインリッチ化プラン（Sonnet 向け）

> 「シンプルすぎる」を「ちゃんと作り込まれたアプリ感」に持っていくための実装計画。
> 3〜5 日（半日 × 6 セッション程度）を想定。

## 全体方針

**「既製素材ベース + 要所だけ AI 生成 + デザイントークン強化」** の三段。

- 全部 AI 生成にすると、線の太さ・配色・タッチが一枚ずつ微妙にズレて統一感が出ない
- 全部既製素材だと「どこかで見たやつ」感が出てブランドにならない
- 既製で世界観を統一しつつ、ヒーロー画像だけオリジナル AI で差別化、が最速

## ターゲットイメージ

リファレンスとして眺めると良いアプリ:
- **Things 3**（iOS タスク管理）: 圧倒的な余白、軽さ
- **Notion Calendar**: モダンで品のある余白とタイポ
- **Headspace**: あたたかみのあるイラスト + マイクロアニメ
- **Linear**: マイクロインタラクションのお手本

タスクリーのコンセプトは「軽く・使いやすく・見やすく」なので、
**Things 3 + Headspace の中間** を狙う。

---

## ステップ 1: ブランド再定義（30 分）

### 決めるもの
- **プライマリカラー**: 現状の `palette.primary` を見直す（QA 中の screenshot だと
  深めのブルー `#3b4adb` 系。これを「もう少し新鮮さのあるブルー」or
  「アクセントを足した深めブルー」にトーン調整推奨）
- **アクセントカラー**: 達成・成功時の色（緑 or オレンジ）
- **ニュートラルパレット**: グレースケール 9 段階
- **フォント**: Noto Sans JP 既に入っている。英数字は別フォント（Inter / Manrope）を当てる
- **ブランドアイコン**: 1024×1024 のロゴアイコンを再制作
- **トーン & マナー**: 「親しみやすい・やわらかい・でも信頼できる」

### 成果物
- [docs/brand.md](../brand.md) （新規）に意思決定をまとめる
- `lib/designTokens.ts` に新しいトークンの叩き台を入れる

### 推奨パレット案（参考、変更可）

```ts
// lib/designTokens.ts に追加
export const palette = {
  // Primary: 深い藍に近いブルー（信頼感 + 落ち着き）
  primary:        '#4F5DEB',
  primaryHover:   '#3F4DDA',
  primaryMuted:   '#EEF0FF',

  // Accent: 達成・成功（やわらかい青緑）
  accent:         '#22C9A9',
  accentMuted:    '#E6F9F4',

  // Warning / Energy: オレンジ系（オンボーディング・ヒーローで使える）
  warning:        '#F59E0B',
  warningMuted:   '#FEF3C7',

  // ... 既存も洗い直す
};
```

---

## ステップ 2: デザイントークン拡張（1〜2 時間）

### 追加するトークン

```ts
// lib/designTokens.ts に追加（叩き台）

// シャドウ階層（カードや浮きの強さで使い分け）
export const shadows = {
  xs: { shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  sm: { shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  lg: { shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
};

// グラデーション（背景・FAB・ヒーロー用）
export const gradients = {
  primary: ['#4F5DEB', '#7B8CFF'],
  accent:  ['#22C9A9', '#5EE2C7'],
  hero:    ['#EEF0FF', '#FFFFFF'],
};

// 角丸（より大胆に）
export const radii = {
  // 既存に加えて
  '2xl': 24,
  '3xl': 32,
};

// アニメーションカーブ
export const motion = {
  spring: { damping: 20, stiffness: 200 },           // タップ反応
  easeOut: { duration: 300, easing: 'easeOut' },     // フェード
  bounce: { damping: 12, stiffness: 180 },           // 成功時のはずみ
};
```

### 反映先（既存コンポーネント）
- `components/ui/Card.tsx` → `shadows.md`
- `components/ui/Button.tsx` → primary に gradient 適用（任意）
- `components/ui/FAB.tsx` → `shadows.lg` + primary gradient
- `screens/LoginScreen.tsx` の `guestBtn` などにも反映

`react-native-linear-gradient` か `expo-linear-gradient` が必要（後者推奨、Expo 純正）。

```
npm install expo-linear-gradient
```

---

## ステップ 3: アイコンライブラリ導入（30 分）

### 推奨: Phosphor Icons (React Native)

```
npm install phosphor-react-native react-native-svg
```

絵文字を使っている箇所をアイコンに置き換える（ただし「達成」「ゲスト」等の
意味的に効くものは絵文字のままで OK）。

### 置き換え対象
- タブバー: 📋 → `<ClipboardText />`, 🔁 → `<ArrowsClockwise />`, 👤 → `<User />`
- アカウント画面の各行アイコン: 🏠 / 👥 / ✉️ / 🌐 / 🔑 / 🔒 / 📄 / 💬 / 🚪 / 🗑️
- タスクカードのメタ: 👤 / 📅 / ✏️

### 採用基準
- **意味が同じものはアイコン化**（タブ、設定行など）
- **感情・装飾的なものは絵文字維持**（達成セレブレーション 🎉、空状態 📭、👋 など）

---

## ステップ 4: AI 画像 5〜7 枚生成（2〜3 時間）

### 必要な画像

| # | 用途 | 場所 | サイズ |
|---|------|------|--------|
| 1 | アプリアイコン | `assets/icon.png` | 1024×1024 |
| 2 | スプラッシュ画像 | `assets/splash.png` | 1284×2778 |
| 3 | オンボーディング 1（タスク共有） | `assets/onboarding/share-tasks.png` | 1200×1200 |
| 4 | オンボーディング 2（ルーティン） | `assets/onboarding/routines.png` | 1200×1200 |
| 5 | オンボーディング 3（スタート） | `assets/onboarding/start.png` | 1200×1200 |
| 6 | タスク空状態 | `assets/empty/no-tasks.png` | 800×800 |
| 7 | ルーティン空状態 | `assets/empty/no-routines.png` | 800×800 |

### プロンプト例（Midjourney v6 / Flux）

すべての画像で揃える共通パラメータ:
- **スタイル**: flat illustration, soft 3D, isometric の中から 1 つに統一推奨。
  Headspace 風なら **soft 3D + pastel**、Things 3 風なら **flat + minimal**
- **カラーパレット**: 上で決めた primary / accent を含めるよう指示
- **ブランド トーン**: warm, friendly, calming, professional

例 (Midjourney):

```
A friendly soft 3D illustration of two minimal characters putting sticky
notes on a shared board, pastel palette with indigo blue (#4F5DEB) and
warm cream background (#FAF7F2), soft shadows, no text, isometric
perspective, ar 1:1 v 6
```

```
A cozy minimalist illustration of a small plant growing from a checked
checkbox, isometric, soft pastel palette with mint green (#22C9A9) and
cream, calm and encouraging mood, no text, ar 1:1 v 6
```

### 後処理
- すべての画像で背景透過 (PNG-A) にしておくと配置が楽
- `assets/empty/*` は WebP 化して軽量化（`cwebp` で 70% quality）
- アプリアイコンは Expo の `app.json` で参照される

---

## ステップ 5: 既製イラスト補完（1 時間）

### 推奨サイトと使い方

- **unDraw** (https://undraw.co) — SVG ダウンロード可、カラー変更が URL パラメータでできる
- **Storyset** (https://storyset.com) — アニメーション対応 SVG / Lottie あり
- **Lottie Files** (https://lottiefiles.com) — マイクロアニメ用

### 使う場面
- AI で作るのが難しい「シンプルな機能アイコン」「ローディング演出」「成功アニメ」
- 例: タスク削除の確認モーダルに添える小さなイラスト
- 例: ルーティン全部完了したときの祝祭アニメ（Lottie）

### 注意
- ライセンスを必ず確認（unDraw は MIT 相当で商用 OK、Storyset は帰属表示で無料）
- 色を AI 画像と合わせるためにアプリの primary / accent カラーで染め直す

---

## ステップ 6: マイクロインタラクション（2〜3 時間）

### 既存依存: react-native-reanimated（既にインストール済み、要確認）

### 入れたいアニメ（優先順）

#### 高優先（差が大きい）
1. **タスクのステータスサイクル**: 「未着手 → 進行中 → 完了」のチップが
   左右にスライドしながら色が変わる
2. **ルーティンのチェック**: タップ時にチェックボックスが弾む（spring）、
   タイトルに取り消し線が左から右へ伸びる
3. **FAB の押下感**: scale 0.95 + spring back
4. **タブ切替**: アイコンが少しジャンプ、ラベルがフェード

#### 中優先
5. **画面遷移**: stack のデフォルトスライドではなくフェード + スケールに
6. **エンプティステート**: イラストがゆっくり上下にフロート
7. **モーダル登場**: backdrop の blur がフェードイン（`expo-blur`）

#### 低優先（やり過ぎ注意）
8. **タスク完了時の小さな ✨ パーティクル**（一瞬だけ）
9. **ルーティン全完了時の confetti**（Lottie ファイル）

### コードスケッチ例

```tsx
// components/ui/FAB.tsx に Reanimated を適用
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';

export function FAB({ onPress }: Props) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.fab, style]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.92, motion.spring); }}
        onPressOut={() => { scale.value = withSpring(1, motion.spring); }}
        onPress={onPress}
      >
        <Plus size={28} color="#fff" weight="bold" />
      </Pressable>
    </Animated.View>
  );
}
```

---

## 必要ライブラリまとめ

```
npm install expo-linear-gradient
npm install phosphor-react-native react-native-svg
# react-native-reanimated は既存なので何もしない（バージョン確認だけ）
# 装飾的アニメをやるなら
npm install lottie-react-native
# モーダル背景ブラーをやるなら
npx expo install expo-blur
```

---

## 進め方の推奨

半日ずつ 6 セッションに分けるイメージ:

| セッション | 内容 |
|-----------|------|
| 1 | ステップ 1 + 2（ブランド決定 + デザイントークン）|
| 2 | ステップ 3（アイコン置き換え）+ Login / Onboarding に新トークン適用 |
| 3 | ステップ 4（AI 画像生成 7 枚） |
| 4 | ステップ 5（既製イラスト補完）+ Onboarding と空状態の画像差し替え |
| 5 | ステップ 6 のうち高優先（FAB / チェック / サイクル / タブ） |
| 6 | ステップ 6 の中優先 + 仕上げ・QA |

最初のセッションで「色とトークンが固まる」ところまで行ければ、
後は機械的に進む。

---

## 動作確認チェックリスト

- [ ] Login → Onboarding → TeamSetup → Tasks / Routines / Account の
      全画面でデザインが「ちぐはぐ」になっていない
- [ ] ダークモードが将来必要になる前提で、`palette` がセマンティック
      命名になっている（`bgPage` `bgCard` `text` `textMuted` 等）
- [ ] アイコンは絵文字と混ざらない（同じ画面では片方に統一）
- [ ] Reanimated アニメが 60fps で動く（Web では多少劣化 OK、ネイティブで滑らか）
- [ ] アセット合計サイズが 2 MB 未満（モバイル想定）

---

## 「やらない方が良いこと」

- **3D オブジェクトの動的レンダリング**: react-three-fiber 等は重い、不要
- **複雑なグラデーションオーバーレイ**: 軽量化と相性が悪い、シャドウで代用
- **過剰なアニメ**: 「ちゃんと作ってる感」は「動きが少なくても整っている」で十分出る。Linear が良いお手本
- **トレンド追従**（Glassmorphism、Neumorphism）: 古びるのが早い、避ける
