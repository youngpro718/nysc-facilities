import { useEffect } from 'react';

type KeyCombo = {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
};

interface ShortcutBinding {
    combo: KeyCombo;
    description: string;
    handler: () => void;
    // Ignore shortcuts when user is typing in inputs or textareas
    preventInInputs?: boolean;
}

export function useKeyboardShortcuts(bindings: ShortcutBinding[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input, textarea, or contenteditable
            const target = event.target as HTMLElement;
            const isInput =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable ||
                target.hasAttribute('data-editable'); // from SessionsTable inline edit

            bindings.forEach(({ combo, handler, preventInInputs = true }) => {
                if (preventInInputs && isInput) return;

                const matchKey = event.key.toLowerCase() === combo.key.toLowerCase();
                const matchCtrl = !!combo.ctrl === event.ctrlKey;
                const matchMeta = !!combo.meta === event.metaKey;
                const matchShift = !!combo.shift === event.shiftKey;
                const matchAlt = !!combo.alt === event.altKey;

                if (matchKey && matchCtrl && matchMeta && matchShift && matchAlt) {
                    event.preventDefault();
                    handler();
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [bindings]);
}
