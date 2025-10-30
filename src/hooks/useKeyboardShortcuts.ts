import { useEffect, useRef } from 'react';

export type ShortcutKey = string;
export type ShortcutHandler = () => void;
export type ShortcutMap = Record<ShortcutKey, ShortcutHandler>;

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略在输入框中的按键
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key;
      let shortcutKey = '';

      // 构建快捷键字符串
      if (event.ctrlKey || event.metaKey) shortcutKey += 'Ctrl+';
      if (event.shiftKey) shortcutKey += 'Shift+';
      if (event.altKey) shortcutKey += 'Alt+';

      // 特殊键处理
      if (key === 'Escape') {
        shortcutKey = 'Escape';
      } else if (key === 'Enter') {
        shortcutKey += 'Enter';
      } else if (key === 'ArrowLeft') {
        shortcutKey = 'ArrowLeft';
      } else if (key === 'ArrowRight') {
        shortcutKey = 'ArrowRight';
      } else if (key === ' ') {
        shortcutKey = 'Space';
      } else if (key === 'Delete' || key === 'Backspace') {
        shortcutKey = 'Delete';
      } else {
        shortcutKey += key.toLowerCase();
      }

      const handler = shortcutsRef.current[shortcutKey];
      if (handler) {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
