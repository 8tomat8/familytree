'use client';

import { useState, useEffect, useCallback } from 'react';

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

export function DatePicker({ dateTaken, datePrecision, onChange }: DatePickerProps) {
    // Parse existing dateTaken into year, month, day based on precision
    const parseExistingDate = useCallback((): DateValues => {
        if (dateTaken) {
            const date = new Date(dateTaken);
            const year = date.getFullYear();

            if (datePrecision === 'year') {
                return { year, month: 0, day: 0 };
            } else if (datePrecision === 'month') {
                return { year, month: date.getMonth() + 1, day: 0 };
            } else if (datePrecision === 'day') {
                return { year, month: date.getMonth() + 1, day: date.getDate() };
            } else {
                // No precision specified, assume full date for backward compatibility
                return { year, month: date.getMonth() + 1, day: date.getDate() };
            }
        }
        return { year: 0, month: 0, day: 0 };
    }, [dateTaken, datePrecision]);

    const [dateValues, setDateValues] = useState<DateValues>(parseExistingDate());

    // Update state when props change
    useEffect(() => {
        setDateValues(parseExistingDate());
    }, [dateTaken, datePrecision, parseExistingDate]);

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

    return (
        <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Taken
            </label>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Year</label>
                    <select
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
                    >
                        <option value=""></option>
                        {Array.from({ length: new Date().getFullYear() - 1880 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Month</label>
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
                        <option value=""></option>
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Day</label>
                    <select
                        value={dateValues.day || ''}
                        onChange={(e) => handleDateChange({ ...dateValues, day: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-200"
                    >
                        <option value=""></option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
} 