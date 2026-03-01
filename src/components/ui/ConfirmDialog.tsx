import { useState, useCallback } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void;
}

/**
 * Styled confirmation dialog — replaces window.confirm() throughout the app.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
}: ConfirmDialogProps) {
    const Icon = variant === 'destructive' ? Trash2 : AlertTriangle;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${variant === 'destructive' ? 'text-destructive' : 'text-amber-500'}`} />
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/**
 * Hook for imperatively showing confirm dialogs.
 * Returns [confirmFn, DialogElement] — render the DialogElement and call confirmFn to trigger.
 */
export function useConfirmDialog() {
    const [state, setState] = useState<{
        open: boolean;
        title: string;
        description: string;
        confirmLabel?: string;
        variant?: 'default' | 'destructive';
        resolve?: (confirmed: boolean) => void;
    }>({
        open: false,
        title: '',
        description: '',
    });

    const confirm = useCallback((opts: {
        title: string;
        description: string;
        confirmLabel?: string;
        variant?: 'default' | 'destructive';
    }): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                open: true,
                ...opts,
                resolve,
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        state.resolve?.(true);
        setState(prev => ({ ...prev, open: false }));
    }, [state.resolve]);

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) {
            state.resolve?.(false);
        }
        setState(prev => ({ ...prev, open }));
    }, [state.resolve]);

    const dialog = (
        <ConfirmDialog
            open={state.open}
            onOpenChange={handleOpenChange}
            title={state.title}
            description={state.description}
            confirmLabel={state.confirmLabel}
            variant={state.variant}
            onConfirm={handleConfirm}
        />
    );

    return [confirm, dialog] as const;
}
