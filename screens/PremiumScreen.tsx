import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  palette,
  gradients,
  shadows,
  typography,
  spacing,
  radii,
} from '../lib/designTokens';
import {
  getOfferings,
  purchasePremium,
  restorePurchases,
  FREE_LIMITS,
  ENTITLEMENT_PREMIUM,
} from '../lib/billing';
import type { PurchasesPackage } from 'react-native-purchases';

const FEATURES = [
  { icon: '✅', title: 'タスク無制限', desc: '10件の制限なし。好きなだけ追加できます。' },
  { icon: '🔁', title: 'ルーティン無制限', desc: '5件の制限なし。毎日の習慣をすべて管理。' },
  { icon: '📊', title: '詳細統計', desc: 'チーム全体の達成率・傾向をグラフで確認。' },
  { icon: '📤', title: 'CSVエクスポート', desc: 'タスク・ルーティンのデータをエクスポート。' },
  { icon: '🎨', title: 'カスタムテーマ', desc: 'アプリの見た目を自分好みにカスタマイズ。' },
  { icon: '⚡', title: '優先サポート', desc: 'お問い合わせに優先的に対応します。' },
];

export function PremiumScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    getOfferings().then((offerings) => {
      const pkgs = offerings?.current?.availablePackages ?? [];
      setPackages(pkgs);
      if (pkgs.length > 0) setSelected(pkgs[0]);
      setLoading(false);
    });
  }, []);

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    try {
      const success = await purchasePremium(selected);
      if (success) {
        Alert.alert('🎉 プレミアム登録完了', 'すべての機能が解放されました！', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '購入に失敗しました';
      if (!msg.includes('cancelled') && !msg.includes('cancel')) {
        Alert.alert('エラー', msg);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const success = await restorePurchases();
      Alert.alert(
        success ? '✅ 復元完了' : '購入履歴なし',
        success ? 'プレミアムが復元されました' : '過去の購入履歴が見つかりませんでした',
        [{ text: 'OK', onPress: () => { if (success) navigation.goBack(); } }],
      );
    } catch {
      Alert.alert('エラー', '復元に失敗しました');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Hero gradient */}
      <LinearGradient colors={['#4F5DEB', '#7B8CFF']} style={styles.hero}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.heroEmoji}>⭐</Text>
        <Text style={styles.heroTitle}>タスクリー プレミアム</Text>
        <Text style={styles.heroSub}>
          無制限のタスク・ルーティンで{'\n'}チームの生産性を最大化
        </Text>
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>
            無料プラン: タスク {FREE_LIMITS.maxTasks}件 / ルーティン {FREE_LIMITS.maxRoutines}件まで
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Feature list */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing packages */}
        {loading ? (
          <ActivityIndicator color={palette.primary} style={{ marginVertical: 24 }} />
        ) : packages.length === 0 ? (
          <View style={styles.noPriceCard}>
            <Text style={styles.noPriceText}>
              価格情報を準備中です。{'\n'}しばらくお待ちください。
            </Text>
          </View>
        ) : (
          <View style={styles.packagesSection}>
            <Text style={styles.packagesLabel}>プランを選択</Text>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[styles.packageCard, selected?.identifier === pkg.identifier && styles.packageCardSelected]}
                onPress={() => setSelected(pkg)}
                activeOpacity={0.8}
              >
                {selected?.identifier === pkg.identifier && (
                  <View style={styles.packageCheck}><Text style={styles.packageCheckText}>✓</Text></View>
                )}
                <Text style={styles.packageTitle}>{pkg.packageType}</Text>
                <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
                <Text style={styles.packageDesc}>{pkg.product.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, (purchasing || !selected) && styles.ctaBtnDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || !selected}
          activeOpacity={0.85}
        >
          <LinearGradient colors={gradients.primary} style={styles.ctaGradient}>
            {purchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaBtnText}>
                {selected ? `${selected.product.priceString} でプレミアムにアップグレード` : 'プランを選択してください'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={purchasing}>
          <Text style={styles.restoreBtnText}>購入を復元する</Text>
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          お支払いは Apple ID アカウントに請求されます。{'\n'}
          サブスクリプションは現在の期間終了の 24 時間前までにキャンセルしない限り自動的に更新されます。
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bgPage },

  // Hero
  hero: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
    paddingHorizontal: spacing['6'],
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    right: spacing['5'],
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  heroEmoji: { fontSize: 48, marginBottom: spacing['3'] },
  heroTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.black,
    color: '#fff',
    marginBottom: spacing['2'],
    textAlign: 'center',
  },
  heroSub: {
    fontSize: typography.sizes.base,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['4'],
  },
  freeBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.full,
    paddingHorizontal: spacing['4'],
    paddingVertical: 6,
  },
  freeBadgeText: { color: 'rgba(255,255,255,0.9)', fontSize: typography.sizes.xs },

  // Body
  body: { padding: spacing['5'], paddingBottom: 48, gap: spacing['4'] },

  // Features
  featuresCard: {
    backgroundColor: palette.bgCard,
    borderRadius: radii.xl,
    padding: spacing['4'],
    ...shadows.sm,
    gap: spacing['3'],
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing['3'] },
  featureIcon: { fontSize: 22, width: 28, textAlign: 'center', marginTop: 2 },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: palette.text,
    marginBottom: 2,
  },
  featureDesc: { fontSize: typography.sizes.sm, color: palette.textMuted, lineHeight: 18 },

  // No price
  noPriceCard: {
    backgroundColor: palette.bgCard,
    borderRadius: radii.xl,
    padding: spacing['5'],
    alignItems: 'center',
    ...shadows.xs,
  },
  noPriceText: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Packages
  packagesSection: { gap: spacing['2'] },
  packagesLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: palette.textMuted,
    marginBottom: 4,
  },
  packageCard: {
    backgroundColor: palette.bgCard,
    borderRadius: radii.xl,
    padding: spacing['4'],
    borderWidth: 2,
    borderColor: palette.borderLight,
    ...shadows.xs,
  },
  packageCardSelected: { borderColor: palette.primary, backgroundColor: palette.primaryMuted },
  packageCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageCheckText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  packageTitle: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
    color: palette.primary,
    marginBottom: 4,
  },
  packageDesc: { fontSize: typography.sizes.sm, color: palette.textMuted },

  // CTA
  ctaBtn: { borderRadius: radii.xl, overflow: 'hidden', marginTop: spacing['2'] },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText: {
    color: '#fff',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.black,
    textAlign: 'center',
  },

  // Restore & legal
  restoreBtn: { alignItems: 'center', paddingVertical: spacing['2'] },
  restoreBtnText: {
    fontSize: typography.sizes.sm,
    color: palette.primary,
    fontWeight: typography.weights.medium,
  },
  legalNote: {
    fontSize: typography.sizes.xs,
    color: palette.textSubtle,
    textAlign: 'center',
    lineHeight: 18,
  },
});
