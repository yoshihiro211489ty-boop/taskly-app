import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { palette, cardShadow, typography, spacing, radii } from '../../lib/designTokens';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Member = {
  id: string;
  name: string | null;
  email: string | null;
  role: 'owner' | 'member';
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string | null): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.trim().charAt(0).toUpperCase();
  }
  if (email) return email.charAt(0).toUpperCase();
  return '?';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MemberRow({
  member,
  isCurrentUser,
  canRemove,
  onRemove,
}: {
  member: Member;
  isCurrentUser: boolean;
  canRemove: boolean;
  onRemove: (member: Member) => void;
}) {
  const initials = getInitials(member.name, member.email);
  const isOwner = member.role === 'owner';

  return (
    <View style={styles.memberRow}>
      {/* Avatar */}
      <View style={[styles.avatar, isOwner && styles.avatarOwner]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.name ?? '名前未設定'}
          </Text>
          {isCurrentUser && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>あなた</Text>
            </View>
          )}
        </View>
        {member.email ? (
          <Text style={styles.memberEmail} numberOfLines={1}>
            {member.email}
          </Text>
        ) : null}
      </View>

      {/* Role badge + remove */}
      <View style={styles.memberActions}>
        <View style={[styles.roleBadge, isOwner ? styles.roleBadgeOwner : styles.roleBadgeMember]}>
          <Text style={[styles.roleBadgeText, isOwner ? styles.roleBadgeTextOwner : styles.roleBadgeTextMember]}>
            {isOwner ? 'オーナー' : 'メンバー'}
          </Text>
        </View>
        {canRemove && !isCurrentUser && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemove(member)}
            hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
            accessibilityLabel={`${member.name ?? 'メンバー'}を削除`}
          >
            <Text style={styles.removeBtnText}>⚠</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function TeamMembersScreen() {
  const { profile, refreshProfile } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isOwner = profile?.role === 'owner';

  const fetchMembers = useCallback(async () => {
    if (!profile?.teamId) {
      setError('チームに所属していません');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('team_id', profile.teamId)
      .order('role', { ascending: false }); // owners first

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    if (!data) {
      setMembers([]);
      return;
    }

    setMembers(
      data.map((row) => ({
        id: String(row.id),
        name: (row.name as string | null) ?? null,
        email: (row.email as string | null) ?? null,
        role: ((row.role as string) === 'owner' ? 'owner' : 'member') as 'owner' | 'member',
      }))
    );
  }, [profile?.teamId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const confirmRemoveMember = (member: Member) => {
    Alert.alert(
      'メンバーを削除',
      `「${member.name ?? member.email ?? 'このメンバー'}」をチームから削除しますか？\nこの操作は元に戻せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => removeMember(member),
        },
      ]
    );
  };

  const removeMember = async (member: Member) => {
    setRemovingId(member.id);

    const { error: removeError } = await supabase
      .from('profiles')
      .update({ team_id: null, role: 'member' })
      .eq('id', member.id);

    setRemovingId(null);

    if (removeError) {
      Alert.alert('エラー', removeError.message);
      return;
    }

    // Remove from local list
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    await refreshProfile();
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderMember = ({ item }: { item: Member }) => (
    <View style={removingId === item.id ? styles.memberRowRemoving : null}>
      {removingId === item.id ? (
        <View style={styles.memberRow}>
          <ActivityIndicator color={palette.primary} style={{ marginRight: spacing['3'] }} />
          <Text style={styles.removingText}>削除中...</Text>
        </View>
      ) : (
        <MemberRow
          member={item}
          isCurrentUser={item.id === profile?.id}
          canRemove={isOwner}
          onRemove={confirmRemoveMember}
        />
      )}
    </View>
  );

  const memberCount = members.length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>チームメンバー</Text>
          {!loading && memberCount > 0 && (
            <Text style={styles.headerCount}>{memberCount}人</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={fetchMembers}
          hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
          accessibilityLabel="更新"
        >
          <Text style={styles.refreshBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Team name sub-header */}
      {profile?.teamName ? (
        <View style={styles.teamNameBanner}>
          <Text style={styles.teamNameBannerEmoji}>👥</Text>
          <Text style={styles.teamNameBannerText}>{profile.teamName}</Text>
        </View>
      ) : null}

      {/* Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>メンバーを読み込み中...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>読み込みに失敗しました</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchMembers}>
            <Text style={styles.retryBtnText}>再試行</Text>
          </TouchableOpacity>
        </View>
      ) : members.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyText}>メンバーがいません</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Owner hint */}
      {isOwner && members.length > 0 && (
        <View style={styles.ownerHint}>
          <Text style={styles.ownerHintText}>
            ⚠ ボタンでメンバーをチームから削除できます
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bgPage,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['5'],
    paddingTop: spacing['6'],
    paddingBottom: spacing['3'],
    backgroundColor: palette.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: palette.text,
  },
  headerCount: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: palette.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnText: {
    fontSize: 20,
    color: palette.primary,
    fontWeight: typography.weights.bold,
  },

  // Team name banner
  teamNameBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    backgroundColor: palette.bgSubtle,
    paddingHorizontal: spacing['5'],
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
  },
  teamNameBannerEmoji: {
    fontSize: 16,
  },
  teamNameBannerText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.primary,
  },

  // List
  listContent: {
    padding: spacing['4'],
    paddingBottom: spacing['10'],
  },
  separator: {
    height: 1,
    backgroundColor: palette.borderLight,
    marginLeft: 72,
  },

  // Member row
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.bgCard,
    borderRadius: radii.lg,
    padding: spacing['4'],
    marginBottom: 0,
    ...cardShadow,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  memberRowRemoving: {
    opacity: 0.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: palette.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
    flexShrink: 0,
  },
  avatarOwner: {
    backgroundColor: palette.primary,
  },
  avatarText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: palette.onInverse,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: palette.text,
    flexShrink: 1,
  },
  youBadge: {
    backgroundColor: palette.accentWash,
    paddingHorizontal: spacing['2'],
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  youBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: palette.accent,
  },
  memberEmail: {
    fontSize: typography.sizes.xs,
    color: palette.textSubtle,
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginLeft: spacing['2'],
    flexShrink: 0,
  },
  roleBadge: {
    paddingHorizontal: spacing['2'],
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  roleBadgeOwner: {
    backgroundColor: palette.primaryMuted,
    borderColor: palette.primary,
  },
  roleBadgeMember: {
    backgroundColor: palette.bgPage,
    borderColor: palette.border,
  },
  roleBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  roleBadgeTextOwner: {
    color: palette.primary,
  },
  roleBadgeTextMember: {
    color: palette.textMuted,
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    backgroundColor: palette.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.warningBorder,
  },
  removeBtnText: {
    fontSize: 14,
  },
  removingText: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },

  // States
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['6'],
    gap: spacing['3'],
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
  },
  errorEmoji: { fontSize: 40 },
  errorTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: palette.text,
  },
  errorMessage: {
    fontSize: typography.sizes.sm,
    color: palette.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: spacing['5'],
    paddingVertical: spacing['3'],
    borderRadius: radii.lg,
    marginTop: spacing['2'],
  },
  retryBtnText: {
    color: palette.onInverse,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: {
    fontSize: typography.sizes.base,
    color: palette.textMuted,
  },

  // Owner hint
  ownerHint: {
    backgroundColor: palette.warningBg,
    borderTopWidth: 1,
    borderTopColor: palette.warningBorder,
    paddingHorizontal: spacing['5'],
    paddingVertical: spacing['3'],
  },
  ownerHintText: {
    fontSize: typography.sizes.xs,
    color: palette.warningText,
    textAlign: 'center',
  },
});
