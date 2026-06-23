import React from 'react';
import { Platform, ScrollView, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../navigation/RootStack';
import { palette, typography, spacing } from '../lib/designTokens';

const PRIVACY_JA = `# プライバシーポリシー

アプリ名: タスクリー (Taskly)
運営者: 個人開発者
バージョン: 1.0
施行日: 2026年06月24日

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【1. 基本方針】

個人開発者（以下「当社」）は、タスクリー（以下「本サービス」）の運営にあたり、ユーザーの個人情報の保護を重要な責務と考えています。本プライバシーポリシーは、当社が本サービスを通じて収集する情報の種類、利用目的、管理方法、およびユーザーの権利について説明します。

本サービスをご利用いただくことで、本ポリシーに記載された内容にご同意いただいたものとみなします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【2. 収集する情報】

■ アカウント情報
・メールアドレス
・表示名（ユーザーが設定した名前）
・パスワード（ハッシュ化して保存。平文では保存しません）

■ チーム・グループ情報
・チーム名、チームの説明文
・チームへの参加状況、メンバー一覧
・チーム内での役割（管理者・一般メンバーなど）

■ タスク・ルーティンデータ
・タスクのタイトル、内容、期限、完了状態
・ルーティンのタイトル、頻度設定、完了履歴
・コメント・メモ等のユーザー入力コンテンツ

■ 利用ログ
・操作履歴（機能の利用状況、アクセス日時）
・デバイス情報（OS種別・バージョン、端末モデル名、アプリバージョン）
・IPアドレス（不正アクセス検知のため）
・クラッシュレポートおよびエラーログ

■ プッシュ通知トークン
・Apple Push Notification Service（APNs）が発行するデバイストークン

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【3. 情報の利用目的】

収集した情報は、以下の目的のためにのみ利用します。

1. 本サービスの提供: アカウント管理、チーム・タスク・ルーティン機能の提供
2. 機能改善・品質向上: 利用状況の分析、ユーザー体験の改善
3. プッシュ通知の送信: タスクのリマインダー、チームからの通知
4. 本人確認・セキュリティ管理: 不正アクセスの検知および防止
5. カスタマーサポート: お問い合わせへの対応
6. 法令遵守: 法令上の義務を果たすため
7. クラッシュレポート: Sentry等を用いたクラッシュ検知・安定性向上

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【4. 第三者への情報提供】

当社は、ユーザーの個人情報を第三者に販売することは一切ありません。以下の場合に限り、情報を提供または共有することがあります。

■ 業務委託先（サービスプロバイダー）
・Supabase, Inc. — データベース・認証基盤（米国）
・Apple Inc. — プッシュ通知（APNs）、アプリ内課金（IAP）（米国）
・RevenueCat, Inc. — サブスクリプション・購入管理（米国）
・Sentry — クラッシュレポート・エラー分析（米国）

■ 法令に基づく場合
裁判所、警察機関、その他の政府機関から法令に基づく要請があった場合。

■ 事業承継
合併、買収、事業譲渡等に際して、情報が承継される場合があります。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【5. データの保管】

ユーザーデータは、米国に所在するSupabaseのサーバーに保管されます。Supabaseのプライバシーポリシー: https://supabase.com/privacy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【6. データ保持期間】

・アカウント有効期間中: 本サービスの利用に必要な情報を保持します。
・アカウント削除後: 原則として30日以内にすべての個人データを削除します。
・バックアップデータ: バックアップからの削除には最大90日程度かかる場合があります。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【7. ユーザーの権利】

・開示請求: 保有する個人情報の内容を確認する権利
・訂正請求: 不正確な情報の訂正を求める権利
・削除請求: 個人情報の削除を求める権利
・利用停止請求: 特定の目的での情報利用の停止を求める権利
・データポータビリティ: 合理的な形式でのデータ提供を求める権利

権利の行使は、下記「お問い合わせ」よりご連絡ください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【8. アカウントの削除】

アプリ内の「設定」→「アカウント」→「アカウントを削除」よりお手続きください。

削除されるデータ:
・プロフィール情報（メールアドレス、表示名）
・作成したタスク・ルーティンデータ
・チーム情報への関連付け
・プッシュ通知トークン

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【9. Cookie・識別子について】

本サービスはモバイルアプリであるため、WebブラウザのCookieは使用しません。以下の識別子を利用します。

・デバイストークン（APNs）: プッシュ通知の送信のみに使用
・アプリ内部ID（UUID）: セッション管理のために使用
・広告識別子（IDFA）: 本サービスでは広告配信目的でのIDFA収集は行いません

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【10. Apple App Storeプライバシー栄養表示】

・連絡先情報（メールアドレス） — 収集あり、本人に紐付け、トラッキングなし
・識別子（ユーザーID） — 収集あり、本人に紐付け、トラッキングなし
・使用状況データ（操作ログ） — 収集あり、本人に紐付け、トラッキングなし
・診断情報（クラッシュログ） — 収集あり、本人に紐付けなし、トラッキングなし
・ユーザーコンテンツ（タスク・メモ） — 収集あり、本人に紐付け、トラッキングなし

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【11. お問い合わせ】

サポートメール: yosihiro1988ty@yahoo.co.jp
運営者: 個人開発者

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【12. ポリシーの改定】

重要な変更を行う場合は、アプリ内通知またはサービス上での告知により、施行日の14日前までにユーザーへお知らせします。

【13. 施行日】

本ポリシーは 2026年06月24日 より施行します。`;

const PRIVACY_EN = `# Privacy Policy

App Name: Taskly (タスクリー)
Operator: Individual Developer
Version: 1.0
Effective Date: 2026-06-24

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1. Our Commitment to Privacy]

Individual Developer ("we," "us," or "our") takes the protection of your personal information seriously. This Privacy Policy explains what information we collect through the Taskly app ("Service"), how we use it, how we protect it, and your rights regarding your data.

By using the Service, you agree to the collection and use of information as described in this Policy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[2. Information We Collect]

Account Information:
- Email address
- Display name (the name you choose)
- Password (stored as a secure hash; never stored in plain text)

Team and Group Information:
- Team name and description
- Team membership and member lists
- Member roles within a team (admin, regular member, etc.)

Task and Routine Data:
- Task titles, descriptions, due dates, and completion status
- Routine titles, frequency settings, and completion history
- Comments, notes, and other user-generated content

Usage Logs:
- Activity history (feature usage, access timestamps)
- Device information (OS type and version, device model, app version)
- IP address (for security and fraud detection)
- Crash reports and error logs

Push Notification Tokens:
- Device tokens issued by Apple Push Notification service (APNs)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[3. How We Use Your Information]

1. Service delivery: Account management, team, task, and routine features
2. Feature improvement: Analyzing usage patterns to improve user experience
3. Push notifications: Task reminders and team notifications
4. Security: Detecting and preventing unauthorized access
5. Customer support: Responding to your inquiries
6. Legal compliance: Fulfilling obligations required by law
7. Crash reporting: Detecting and resolving technical issues using Sentry

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[4. Sharing Your Information]

We do not sell your personal information to third parties. We share data with:

Service Providers:
- Supabase, Inc. — Database and authentication (United States)
- Apple Inc. — Push notifications (APNs), in-app purchases (United States)
- RevenueCat, Inc. — Subscription management (United States)
- Sentry — Crash reporting and error analysis (United States)

We may also disclose information when required by law, or in connection with a business transfer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[5. Data Storage]

Your data is stored on Supabase servers in the United States.
Supabase Privacy Policy: https://supabase.com/privacy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[6. Data Retention]

- While your account is active: We retain information necessary to provide the Service.
- After account deletion: We delete your personal data within 30 days.
- Backup data: Removal from backups may take up to 90 additional days.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[7. Your Rights]

- Access: Request a copy of your personal information
- Correction: Request correction of inaccurate information
- Deletion: Request deletion of your personal information
- Restriction: Request we stop using your information for certain purposes
- Data portability: Request your data in a machine-readable format

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[8. Account Deletion]

Go to Settings > Account > Delete Account within the app.

Upon deletion, the following data will be removed:
- Profile information (email address, display name)
- Your tasks and routine data
- Your association with team data
- Your push notification token

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[9. Cookies and Identifiers]

As a mobile app, we do not use browser cookies. We use:
- APNs device token: Solely for delivering push notifications
- Internal app ID (UUID): For session management
- IDFA: We do not collect your IDFA for advertising purposes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[10. Contact Us]

Support Email: yosihiro1988ty@yahoo.co.jp
Operator: Individual Developer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[11. Changes to This Policy]

For material changes, we will provide notice at least 14 days before the changes take effect.

[12. Effective Date]

This Policy is effective as of 2026-06-24.`;

const TERMS_JA = `# 利用規約

アプリ名: タスクリー (Taskly)
運営者: 個人開発者
バージョン: 1.0
施行日: 2026年06月24日

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【1. サービス概要】

タスクリー（以下「本サービス」）は、個人開発者（以下「当社」）が提供する、グループ・チームでのタスクおよびルーティンを共有・管理するためのモバイルアプリケーションです。

本規約（以下「本規約」）は、本サービスの利用に関する条件を定めるものです。本サービスを利用した場合、本規約に同意したものとみなします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【2. 利用資格】

・本サービスは、13歳以上の方を対象としています。
・13歳以上18歳未満の方が利用する場合は、保護者の同意を得てください。
・本規約に同意できない場合は、本サービスをご利用いただけません。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【3. アカウント】

・本サービスの主要機能を利用するにはアカウントの作成が必要です。
・ユーザーは、自己のアカウント情報を適切に管理する責任を負います。
・1つのアカウントを複数人で共用することは禁止します。
・不正アクセスのおそれがある場合は、直ちに当社へご連絡ください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【4. チーム・グループの利用】

・ユーザーはチームを作成し、他のユーザーを招待してグループでタスク・ルーティンを共有することができます。
・チーム管理者は、チームメンバーの管理・コンテンツの適正利用・権限付与について責任を負います。
・ユーザーはいつでもチームから退出することができます。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【5. ユーザーコンテンツ】

・ユーザーが作成したコンテンツ（タスク、ルーティン、コメント等）の著作権は、当該ユーザーに帰属します。
・ユーザーは当社に対し、本サービスの提供・運営・改善に必要な範囲でコンテンツを利用するライセンスを付与します。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【6. 禁止事項】

以下の行為を行ってはなりません。

1. 法令に違反する行為、または違法なコンテンツの投稿・共有
2. 他者の著作権、商標権、プライバシーその他の権利を侵害する行為
3. 他のユーザーへの嫌がらせ、脅迫、迷惑行為、スパムの送信
4. 本サービスのシステム、ネットワーク、または他ユーザーのアカウントへの不正アクセス
5. 当社の書面による事前承諾なく、本サービスを商業目的で再利用・再販売する行為
6. 本サービスのソースコードの解析、逆コンパイル、逆アセンブル等
7. 自動化ツールを用いたデータの無断収集
8. 虚偽のアカウント情報の登録
9. 本サービスの正常な運営を妨げる行為

違反した場合、アカウントの停止・削除等の措置を取る場合があります。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【7. 課金・サブスクリプション】

・本サービスは無料プランとプレミアムプランを提供します。
・プレミアムプランの購入はApple Inc.のIn-App Purchase（IAP）を通じて行われます。
・サブスクリプションは、更新日の24時間前までに自動更新をオフにしない限り、自動的に更新されます。
・返金はApple Inc.のポリシーに従います。返金のご要望は https://support.apple.com/ja-jp/billing よりお手続きください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【8. サービスの変更・終了】

当社は、以下の事項について予告なく行う権利を留保します。

・本サービスの機能・仕様の追加、変更、削除
・本サービスの一時的な停止（メンテナンス等）
・本サービスの全部または一部の終了

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【9. 免責事項】

・本サービスは「現状有姿（AS IS）」で提供されます。
・ユーザーが本サービスに保存したデータの損失について、当社は責任を負いません。
・第三者サービス（Supabase、Apple、RevenueCat等）の障害による損害について、当社は責任を負いません。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【10. 損害賠償の制限】

当社が負う損害賠償責任は、損害発生の直前12ヶ月間においてユーザーが本サービスに支払った金額（無料プランの場合は0円）を上限とします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【11. 準拠法・裁判管轄】

本規約は日本法に準拠します。本規約に関して生じた紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【12. 規約の変更】

重要な変更を行う場合は、アプリ内通知またはサービス上での告知により、施行日の14日前までにお知らせします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【13. お問い合わせ】

サポートメール: yosihiro1988ty@yahoo.co.jp
運営者: 個人開発者

【15. 施行日】

本規約は 2026年06月24日 より施行します。`;

const TERMS_EN = `# Terms of Service

App Name: Taskly (タスクリー)
Operator: Individual Developer
Version: 1.0
Effective Date: 2026-06-24

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1. About the Service]

Taskly ("Service") is a mobile application provided by Individual Developer ("we," "us," or "our") that enables groups and teams to share and manage tasks and routines together.

These Terms of Service ("Terms") govern your use of the Service. By accessing or using the Service, you agree to be bound by these Terms.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[2. Eligibility]

- The Service is intended for users who are 13 years of age or older.
- Users between 13 and 18 must obtain parental or guardian consent.
- By using the Service, you confirm that you agree to these Terms.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[3. Accounts]

- An account is required to access the core features of the Service.
- You are responsible for maintaining the confidentiality of your account credentials.
- One account may not be shared by multiple people.
- If you become aware of any unauthorized access, please notify us immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[4. Teams and Groups]

- You may create a team and invite other users to share and manage tasks and routines.
- The Team Admin is responsible for managing membership, content compliance, and permissions.
- You may leave a team at any time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[5. User Content]

- You retain ownership of content you create on the Service (tasks, routines, comments, etc.).
- You grant us a license to store, display, and transmit your content solely to provide the Service.
- You are solely responsible for your User Content.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[6. Prohibited Conduct]

You agree not to:
1. Violate any applicable law or post unlawful content
2. Infringe the intellectual property or other rights of any third party
3. Harass, threaten, or spam other users
4. Attempt unauthorized access to Service systems or other accounts
5. Commercially exploit the Service without our written consent
6. Reverse engineer the Service
7. Use automated tools to scrape data from the Service
8. Create accounts with false or misleading information
9. Take any action that disrupts the normal operation of the Service

Violations may result in account suspension or termination.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[7. Billing and Subscriptions]

- The Service offers a Free Plan and a Premium Plan.
- Premium purchases are processed through Apple's In-App Purchase (IAP) system.
- Subscriptions automatically renew unless cancelled at least 24 hours before the end of the billing period.
- Refund requests are governed by Apple's policies: https://support.apple.com/billing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[8. Changes and Termination]

We reserve the right to add, modify, or remove features, or to discontinue the Service.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[9. Disclaimers]

- The Service is provided "AS IS" without warranties of any kind.
- We are not responsible for the loss of data you store in the Service.
- We are not responsible for disruptions in third-party services (Supabase, Apple, RevenueCat).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[10. Limitation of Liability]

Our total liability shall not exceed the total amount you actually paid for the Service in the preceding 12 months (or zero for Free Plan users).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[11. Governing Law and Jurisdiction]

These Terms are governed by the laws of Japan. Disputes shall be subject to the exclusive jurisdiction of the Tokyo District Court.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[12. Contact Us]

Support Email: yosihiro1988ty@yahoo.co.jp
Operator: Individual Developer

[15. Effective Date]

These Terms are effective as of 2026-06-24.`;

type LegalRoute = RouteProp<RootStackParamList, 'Legal'>;

export function LegalScreen() {
  const route = useRoute<LegalRoute>();
  const { i18n } = useTranslation();
  const isJa = i18n.language.startsWith('ja');

  const content =
    route.params.type === 'privacy'
      ? (isJa ? PRIVACY_JA : PRIVACY_EN)
      : (isJa ? TERMS_JA : TERMS_EN);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text selectable style={styles.text}>
        {content}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bgPage,
  },
  content: {
    padding: spacing['5'],
    paddingBottom: spacing['10'],
  },
  text: {
    color: palette.text,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
