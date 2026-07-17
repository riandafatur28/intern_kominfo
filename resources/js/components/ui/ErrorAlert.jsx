import { AlertCircle } from 'lucide-react';

export default function ErrorAlert({ message, onRetry }) {
    if (!message) return null;

    return (
        <div className="flex items-start gap-3 p-4 bg-error-bg border border-error-border rounded-lg text-sm text-error">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1">{message}</span>
            {onRetry && (
                <button onClick={onRetry} className="underline hover:no-underline shrink-0 font-medium">
                    Ulangi
                </button>
            )}
        </div>
    );
}
