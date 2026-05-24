# 次イテレーション 実装プラン（Sonnet 向け）

> このドキュメントは Opus がプランを作り込み、Sonnet が実装する想定。
> 各セクションは「独立して着手可能」になっているので、上から順に進めても、
> 並列で進めてもよい。

## このイテレーションのゴール

1. ルーティン達成状況を「過去 7 日 → 過去 30 日」に拡大
2. ルーティンの達成状況をチーム全員で見られるようにする（RLS 緩和 + UI）
3. タスクの最終編集者を追跡 ＆ カードに表示
4. デザインを「ちゃんと作り込まれたアプリ感」まで底上げ（別ファイルへ）

優先順は 1 → 2 → 3 → 4。1〜3 は機能、4 は見た目。

---

## §1. ルーティン達成状況を過去 30 日に拡大

### 目的
現状は過去 7 日のドット表示。継続性の可視化として 1 週間は短いので、
過去 30 日（直近 4 週間）に変更する。

### 影響範囲
- [screens/RoutineStatsScreen.tsx](../../screens/RoutineStatsScreen.tsx)
- [lib/i18n/locales/ja.ts](../../lib/i18n/locales/ja.ts) / [lib/i18n/locales/en.ts](../../lib/i18n/locales/en.ts)
  - `routines.stats_period` の文言を「過去30日」「Last 30 days」に変更

### 設計
- `getLast7Days()` → `getLastNDays(n: number)` に汎化、`N = 30` で呼ぶ
- 横並び 30 個のドットは画面幅を超えるので、**6 列 × 5 行のグリッド** に変更
  - 左→右 = 日付の古い→新しい順
  - 各セルは「日付 + 状態ドット」のペア
- 現在の「曜日ヘッダー (月火水木金土日)」は 30 日表示では意味薄なので削除
- 代わりに上部に「2025/4/24 〜 2025/5/24」のような期間表示を追加
- 達成率の計算は変わらず（完了数 ÷ 30 × 100、整数化）

### コードスケッチ

```tsx
// screens/RoutineStatsScreen.tsx
const DAYS_WINDOW = 30;

function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// グリッドコンポーネント
function DotGrid({ dates, doneSet, routineId }: {
  dates: string[];
  doneSet: Set<string>;
  routineId: string;
}) {
  // 6列 × 5行 = 30セル
  const COLS = 6;
  const rows: string[][] = [];
  for (let i = 0; i < dates.length; i += COLS) {
    rows.push(dates.slice(i, i + COLS));
  }
  return (
    <View style={styles.grid}>
      {rows.map((row, r) => (
        <View key={r} style={styles.gridRow}>
          {row.map((d) => {
            const done = doneSet.has(`${routineId}|${d}`);
            return (
              <View key={d} style={styles.cell}>
                <View style={[styles.dot, done && styles.dotDone]} />
                <Text style={styles.dotLabel}>{d.slice(8)}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
```

### 動作確認
- ルーティン達成状況を開き、30 日分のドットがグリッド表示される
- 達成率の分母が 30 になる（過去 1 ヶ月で 5 日完了 → 17%）
- 日本語/英語の文言切替で「過去30日 / Last 30 days」が反映される

---

## §2. ルーティン達成状況をチーム全員で見られるようにする

### 目的
管理者（オーナー）がチームメンバーの「ルーティンをちゃんとやってるか」を
確認できるようにする。ただしオーナー限定にせず、メンバー同士で励まし合える
ように「チーム内なら誰でも見える」設計にする。

### 影響範囲
- **Supabase DB**: `routine_logs` テーブルの RLS ポリシー変更（マイグレーションファイル追加）
- [screens/RoutineStatsScreen.tsx](../../screens/RoutineStatsScreen.tsx): 「自分 / チーム全体」切替タブと、チームビューの実装
- [lib/i18n/locales/ja.ts](../../lib/i18n/locales/ja.ts) / [en.ts](../../lib/i18n/locales/en.ts): タブ文言追加

### DB マイグレーション

新規ファイル: `supabase/migrations/<timestamp>_routine_logs_team_visible.sql`

```sql
-- routine_logs を「同じチームのメンバーなら見える」ように緩和
-- （INSERT / UPDATE / DELETE は変わらず本人のみ）

-- 既存 SELECT ポリシーを削除（名前は実際のものに合わせる、不明なら全部 DROP）
DO $$
DECLARE p_name text;
BEGIN
  FOR p_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'routine_logs' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.routine_logs', p_name);
  END LOOP;
END $$;

-- 新規 SELECT ポリシー: routine が属するチームのメンバーなら見える
CREATE POLICY "Team members can view team routine_logs"
  ON public.routine_logs
  FOR SELECT
  USING (
    routine_id IN (
      SELECT r.id
      FROM public.routines r
      WHERE r.team_id = (
        SELECT p.team_id
        FROM public.profiles p
        WHERE p.id = auth.uid()
      )
    )
  );

-- 念のため INSERT/UPDATE/DELETE は user_id = auth.uid() に縛る
DO $$
DECLARE p_name text;
BEGIN
  FOR p_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'routine_logs' AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.routine_logs', p_name);
  END LOOP;
END $$;

CREATE POLICY "Users can insert own routine_logs"
  ON public.routine_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own routine_logs"
  ON public.routine_logs FOR DELETE USING (user_id = auth.uid());
-- routine_logs は基本的に INSERT / DELETE しか使わないので UPDATE は不要
```

**Sonnet への注意**:
- このマイグレーションは Supabase Dashboard → SQL Editor から手動実行するか、
  `supabase` CLI が入っていれば `supabase db push` で適用する
- ローカルに `supabase` CLI が入っていない可能性が高いので、
  「このSQLをSupabase Dashboardで実行してください」と書いてユーザーに依頼するのが安全

### UI 設計

達成状況画面の上部に「**自分 / チーム全体**」のタブを追加。

#### 自分タブ（既存ビューを 30 日化したもの）
- ログイン中のユーザーの過去 30 日達成状況
- 1 ルーティンにつき 1 行（30 ドットグリッド + 達成率）

#### チーム全体タブ
- マトリクス表示: 行 = メンバー、列 = ルーティン
- 各セル = そのメンバー × そのルーティンの過去 30 日達成率（%）
- セルをタップすると、そのメンバー × そのルーティンの 30 ドット詳細をモーダルで表示

```
┌─────────────┬─────────┬─────────┬─────────┐
│             │ ルーティン1 │ ルーティン2 │ ルーティン3 │
├─────────────┼─────────┼─────────┼─────────┤
│ オーナー太郎  │   83%   │   60%   │   30%   │
│ member1     │   50%   │   90%   │    0%   │
│ メンバー花子  │   70%   │   40%   │   10%   │
└─────────────┴─────────┴─────────┴─────────┘
```

### コードスケッチ

```tsx
// screens/RoutineStatsScreen.tsx
const [tab, setTab] = useState<'mine' | 'team'>('mine');

// load() を 2 つに分岐:
// - mine: 既存ロジック（自分の routine_logs を集計、30日）
// - team: 全メンバー × 全ルーティンの集計を作る

async function loadTeamStats(teamId: string, last30Days: string[]) {
  const [members, routines, logs] = await Promise.all([
    supabase.from('profiles').select('id, name').eq('team_id', teamId),
    supabase.from('routines').select('id, title, frequency').eq('team_id', teamId),
    supabase.from('routine_logs').select('routine_id, user_id, done_date')
      .gte('done_date', last30Days[0])
      // routine_logs の RLS が緩和されてるので、チーム全員ぶん返ってくる
  ]);
  // メンバー × ルーティン の達成率マトリクスを構築
  const memberById = new Map(members.data?.map(m => [m.id, m.name]) ?? []);
  const matrix = (members.data ?? []).map((member) => ({
    memberId: member.id,
    memberName: member.name,
    rates: (routines.data ?? []).map((routine) => {
      const doneCount = (logs.data ?? []).filter(l =>
        l.user_id === member.id && l.routine_id === routine.id
      ).length;
      return {
        routineId: routine.id,
        routineTitle: routine.title,
        rate: Math.round((doneCount / 30) * 100),
        doneCount,
      };
    }),
  }));
  return { routines: routines.data ?? [], matrix };
}
```

### 動作確認
- Owner として達成状況画面を開く → 自分タブで自分の 30 日が見える
- 「チーム全体」タブに切替 → 3 メンバー × 3 ルーティンのマトリクスが見える
- Member1 でログインして同じ画面を開いても、同じマトリクスが見える（チーム内なら誰でも見える）
- マトリクスのセルをタップ → メンバー1人 × ルーティン1個の 30 日詳細が出る

### i18n キー追加（ja / en）

```ts
routines: {
  // ...
  stats_period: '過去30日', // / 'Last 30 days'
  stats_tab_mine: '自分',  // / 'Me'
  stats_tab_team: 'チーム全体', // / 'Team'
  stats_no_logs_yet: 'まだ記録がありません', // / 'No records yet'
}
```

---

## §3. タスクの最終編集者を追跡 ＆ カードに表示

### 目的
タスクは誰でも編集・削除できるので、「誰が触ったかわかる」状態にする。
完全な activity log は将来課題、MVP は最終編集者だけ。

### 影響範囲
- **Supabase DB**: `tasks` テーブルに `updated_by uuid` 列追加、`updated_at` トリガ
- [screens/TasksScreen.tsx](../../screens/TasksScreen.tsx): 取得時に `updated_by` も SELECT、カード表示に追加
- [screens/CreateTaskModal.tsx](../../screens/CreateTaskModal.tsx): UPDATE 時に `updated_by = auth.uid()` を payload に含める
- [lib/i18n/locales/ja.ts](../../lib/i18n/locales/ja.ts) / [en.ts](../../lib/i18n/locales/en.ts): 表示文言

### DB マイグレーション

新規ファイル: `supabase/migrations/<timestamp>_tasks_audit_columns.sql`

```sql
-- tasks の最終更新者・更新時刻を追加
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- updated_at を自動更新するトリガ（毎回の UPDATE で now() を入れる）
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_set_updated_at ON public.tasks;
CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

**重要**: `updated_by` はクライアントが明示的にセットする必要がある（トリガで
`auth.uid()` を入れる手もあるが、Service Role からの更新と区別したいので
クライアント明示が安全）。

### TypeScript 側変更

#### CreateTaskModal.tsx
`handleSave` の payload に `updated_by` を追加:

```tsx
// 取得（コンポーネント上部で）
const { data: { user } } = useUser(); // または useAuth() から profile.id を使う

// handleSave 内
const payload = {
  title: trimmedTitle,
  description: description.trim() || null,
  status,
  assignee_id: assigneeId,
  deadline,
  team_id: teamId,
  updated_by: profile.id, // ← 新規
};

if (isEditMode && task) {
  // UPDATE 時のみ updated_by を入れる
  await supabase.from('tasks').update(payload).eq('id', task.id);
} else {
  // INSERT 時は updated_by = 作成者
  await supabase.from('tasks').insert(payload);
}
```

ステータスサイクルボタン (`screens/TasksScreen.tsx` の `cycleStatus`) でも
同様に `updated_by` を入れる:

```tsx
const cycleStatus = async (item: Task) => {
  const next = STATUS_CYCLE[item.status];
  const { error } = await supabase
    .from('tasks')
    .update({ status: next, updated_by: profile.id })  // ← updated_by 追加
    .eq('id', item.id);
  // ...
};
```

#### TasksScreen.tsx 取得側

`load()` 内のクエリで `updated_by, updated_at` も含める:

```tsx
const tasksRes = await supabase
  .from('tasks')
  .select('*')  // すでに * なので updated_by, updated_at も入る
  .eq('team_id', profile.teamId)
  .order('updated_at', { ascending: false });  // 更新日時順に変更（推奨）
```

`Task` 型に列を追加:
```tsx
type Task = {
  // existing fields...
  updated_by: string | null;
  updated_by_name: string | null;  // クライアント側で結合
  updated_at: string;
};
```

`map` 部分で memberById から名前を引いて埋める:

```tsx
const rows: Task[] = (tasksRes.data ?? []).map((r: Record<string, unknown>) => {
  // ...existing...
  const updatedById = (r.updated_by as string | null) ?? null;
  return {
    // ...
    updated_by: updatedById,
    updated_by_name: updatedById ? (memberById.get(updatedById) ?? null) : null,
    updated_at: String(r.updated_at ?? r.created_at ?? ''),
  };
});
```

#### カードへの表示

`TasksScreen.tsx` の `renderItem` のメタ情報部分に追加:

```tsx
<View style={styles.cardMeta}>
  {item.assignee_name && (
    <Text style={styles.metaText}>👤 {item.assignee_name}</Text>
  )}
  {item.deadline && (
    <Text style={styles.metaText}>📅 {item.deadline.slice(0, 10)}</Text>
  )}
  {item.updated_by_name && (
    <Text style={styles.metaText}>
      ✏️ {t('tasks.last_edited_by', {
        name: item.updated_by_name,
        time: formatRelativeTime(item.updated_at),
      })}
    </Text>
  )}
</View>
```

`formatRelativeTime` ヘルパー（新規）:

```ts
// lib/time.ts (新規)
export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'たった今';   // i18n 化
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}日前`;
  return d.toISOString().slice(0, 10);
}
```

### i18n キー追加

```ts
tasks: {
  // ...
  last_edited_by: '✏️ {{name}} が{{time}}に更新',  // / '✏️ updated by {{name}} {{time}}'
}
```

### 動作確認
- Owner がタスクを作成 → カードに「✏️ オーナー太郎 がたった今に更新」
- Member1 でログインしてそのタスクの「進行中→」をタップ
- リロード後、カード表示が「✏️ member1 が X 分前に更新」に変わる
- Member1 で別タスクを編集モーダルから保存 → 同様に更新者が変わる

---

## §4. デザインリッチ化

長くなるので別ファイル: [redesign.md](redesign.md) を参照。
要約だけここに置く。

### 方向性
**「既製素材ベース + 要所だけ AI 生成 + デザイントークン強化」** の三段
構成で、3〜5 日でガラッと印象を変える。

### 6 ステップ
1. ブランド再定義（30 分）
2. デザイントークン拡張（1〜2 時間）
3. アイコンライブラリ導入（30 分、Phosphor または Lucide）
4. AI 画像 5〜7 枚生成（2〜3 時間、Midjourney v6 or Flux 1.1 Pro）
5. 既製イラスト補完（1 時間、unDraw / Storyset）
6. マイクロインタラクション（2〜3 時間、Reanimated 3）

詳細手順・必要ファイル・プロンプト例は [redesign.md](redesign.md) に書く。

---

## 進行順とブロッカー

| 順 | タスク | 前提 | DB マイグレーション必要 |
|----|-------|------|------|
| 1 | §1 達成状況 30 日化 | なし | 不要 |
| 2 | §2 チームビュー | §1 完了 + RLS マイグレ適用 | **必要** (routine_logs RLS) |
| 3 | §3 タスク編集者追跡 | なし（§1, §2 と独立） | **必要** (tasks 列追加 + トリガ) |
| 4 | §4 デザイン | なし（独立。中身は変えず見た目だけ） | 不要 |

§2 と §3 は DB マイグレーション SQL をユーザーに見せて Supabase Dashboard で
実行してもらってから、TypeScript 側を実装するのが安全。

## 共通事項

- Web QA は `expo-web` の Preview で行う（既存 `.claude/launch.json` を使う）
- 多ユーザー動作確認は `window.__supabase` 経由で複数ユーザーを切り替えてテスト
  （既存パターン、`lib/supabase.ts` 末尾を参照）
- すべての文字列は ja / en 両方追加すること
- 既存パターンに従う:
  - Alert は `Alert.alert` を使う（`lib/alertWebPolyfill.ts` で Web 対応済み）
  - クリップボードは AccountScreen の `copyText` パターンを再利用
- コミットは「セクションごとに 1 コミット」推奨（§1, §2, §3 で 3 コミット）
- コミットメッセージは既存のスタイル（プレーンな英語サマリ + 詳細）に合わせる
