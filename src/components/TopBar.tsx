import { ReactNode } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface TopBarProps {
    centerText?: string;
    rightActions?: ReactNode;
}

export function TopBar({ centerText, rightActions }: TopBarProps) {
    return (
        <div className="flex items-center justify-between p-1 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20">
            <div className="flex-1">
                <LanguageSwitcher />
            </div>

            {centerText && (
                <div className="flex items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {centerText}
                    </p>
                </div>
            )}

            <div className="flex-1 flex justify-end gap-2">
                {rightActions}
            </div>
        </div>
    );
} 