'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface DateValues {
    year: number;
    month: number;
    day: number;
}

interface DatePickerProps {
    dateTaken?: string;
    datePrecision?: string;
    onChange: (dateTaken?: string, datePrecision?: string) => void;
}

export function DatePicker({ dateTaken, onChange }: DatePickerProps) {
    const { t } = useTranslation();

    // Parse existing dateTaken into year, month, day based on precision
    const [dateValues, setDateValues] = useState<DateValues>(() => {
        if (!dateTaken) return { year: 0, month: 0, day: 0 };

        const date = new Date(dateTaken);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1, // JavaScript months are 0-indexed
            day: date.getDate(),
        };
    });

    // Update state when props change
    useEffect(() => {
        if (!dateTaken) {
            setDateValues({ year: 0, month: 0, day: 0 });
            return;
        }

        const date = new Date(dateTaken);
        setDateValues({
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
        });
    }, [dateTaken]);

    // Handle date changes and notify parent
    const handleDateChange = (newDateValues: DateValues) => {
        setDateValues(newDateValues);

        // Construct dateTaken and datePrecision based on provided values
        let newDateTaken: string | undefined;
        let newDatePrecision: string | undefined;

        if (newDateValues.year > 0) {
            if (newDateValues.month > 0 && newDateValues.day > 0) {
                // Full date provided
                newDateTaken = new Date(newDateValues.year, newDateValues.month - 1, newDateValues.day).toISOString();
                newDatePrecision = 'day';
            } else if (newDateValues.month > 0) {
                // Year and month provided
                newDateTaken = new Date(newDateValues.year, newDateValues.month - 1, 1).toISOString();
                newDatePrecision = 'month';
            } else {
                // Only year provided
                newDateTaken = new Date(newDateValues.year, 0, 1).toISOString();
                newDatePrecision = 'year';
            }
        }

        onChange(newDateTaken, newDatePrecision);
    };

    // Generate days for the selected month
    const daysInMonth = dateValues.month > 0 ? new Date(dateValues.year || new Date().getFullYear(), dateValues.month, 0).getDate() : 31;

    // Month options with translations
    const monthOptions = [
        { value: '', label: '' },
        { value: '1', label: t('date.months.january') },
        { value: '2', label: t('date.months.february') },
        { value: '3', label: t('date.months.march') },
        { value: '4', label: t('date.months.april') },
        { value: '5', label: t('date.months.may') },
        { value: '6', label: t('date.months.june') },
        { value: '7', label: t('date.months.july') },
        { value: '8', label: t('date.months.august') },
        { value: '9', label: t('date.months.september') },
        { value: '10', label: t('date.months.october') },
        { value: '11', label: t('date.months.november') },
        { value: '12', label: t('date.months.december') },
    ];

    return (
        <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('metadata.dateTaken')}
            </label>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('date.year')}</label>
                    <input
                        type="number"
                        placeholder="YYYY"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={dateValues.year || ''}
                        onChange={(e) => {
                            const year = parseInt(e.target.value) || 0;
                            // If year is cleared, clear month and day too
                            if (year === 0) {
                                handleDateChange({ year: 0, month: 0, day: 0 });
                            } else {
                                handleDateChange({ ...dateValues, year });
                            }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200"
                    />
                </div>

                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('date.month')}</label>
                    <select
                        value={dateValues.month || ''}
                        onChange={(e) => {
                            const month = parseInt(e.target.value) || 0;
                            // If month is cleared, clear day too
                            if (month === 0) {
                                handleDateChange({ ...dateValues, month: 0, day: 0 });
                            } else {
                                handleDateChange({ ...dateValues, month });
                            }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200"
                    >
                        {monthOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('date.day')}</label>
                    <select
                        value={dateValues.day || ''}
                        onChange={(e) => {
                            const day = parseInt(e.target.value) || 0;
                            handleDateChange({ ...dateValues, day });
                        }}
                        disabled={!dateValues.month}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200 disabled:opacity-50"
                    >
                        <option value=""></option>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>
                                {day}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
} 