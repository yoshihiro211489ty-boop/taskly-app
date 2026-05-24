/**
 * React Native Web では Alert.alert がデフォルトで何もしない（サイレント）。
 * window.alert / window.confirm を使って単純なダイアログを再現する。
 *
 * - 1 ボタン以下: window.alert + その1つの onPress を呼ぶ
 * - 2 ボタン以上: window.confirm
 *     - OK → 'cancel' 以外の最初のボタン onPress
 *     - キャンセル → style: 'cancel' のボタン onPress
 *
 * 副作用: App 起動時に 1 回だけ Alert.alert を上書きする。
 */
import { Alert, Platform } from 'react-native';

type AlertButton = {
  text?: string;
  onPress?: (value?: string) => void;
  style?: 'default' | 'cancel' | 'destructive';
};

let installed = false;

export function installAlertWebPolyfill(): void {
  if (installed) return;
  if (Platform.OS !== 'web') return;
  if (typeof window === 'undefined') return;
  installed = true;

  const original = Alert.alert.bind(Alert);

  Alert.alert = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    _options?: unknown,
  ): void => {
    const text = message ? `${title}\n\n${message}` : title;
    try {
      const list = buttons ?? [];
      if (list.length <= 1) {
        window.alert(text);
        list[0]?.onPress?.();
        return;
      }
      // 2 ボタン以上 → confirm
      const ok = window.confirm(text);
      const cancelBtn = list.find((b) => b.style === 'cancel');
      const otherBtns = list.filter((b) => b.style !== 'cancel');
      // destructive を優先、なければ最初の non-cancel
      const confirmBtn =
        otherBtns.find((b) => b.style === 'destructive') ?? otherBtns[0];
      if (ok) confirmBtn?.onPress?.();
      else cancelBtn?.onPress?.();
    } catch {
      // フォールバック：元の実装を呼ぶ（無音だが少なくともクラッシュしない）
      original(title, message, buttons);
    }
  };
}
