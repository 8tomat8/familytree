import toast from 'react-hot-toast';

// Common notification patterns
export const notifications = {
    // Success notifications
    success: (message: string) => toast.success(message),

    // Error notifications
    error: (message: string) => toast.error(message),

    // Info notifications
    info: (message: string) => toast(message, { icon: 'ℹ️' }),

    // Warning notifications
    warning: (message: string) => toast(message, {
        icon: '⚠️',
        style: {
            background: '#f59e0b',
            color: '#fff',
        },
    }),

    // Loading notifications
    loading: (message: string) => toast.loading(message),

    // Promise-based notifications for async operations
    promise: <T>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: Error) => string);
        }
    ) => toast.promise(promise, messages),

    // Dismiss notifications
    dismiss: (toastId?: string) => {
        if (toastId) {
            toast.dismiss(toastId);
        } else {
            toast.dismiss();
        }
    },

    // Update existing toast
    update: (toastId: string, message: string, type: 'success' | 'error') => {
        if (type === 'success') {
            toast.success(message, { id: toastId });
        } else {
            toast.error(message, { id: toastId });
        }
    },
};

// Specific notification helpers for common app actions
export const appNotifications = {
    // File operations
    fileUploaded: (filename: string) =>
        notifications.success(`${filename} uploaded successfully`),

    fileDeleted: (filename: string) =>
        notifications.success(`${filename} deleted`),

    fileUploadError: (error: string) =>
        notifications.error(`Upload failed: ${error}`),

    // Metadata operations
    metadataSaved: () =>
        notifications.success('Metadata saved successfully'),

    metadataSaveError: (error: string) =>
        notifications.error(`Failed to save metadata: ${error}`),

    // Image rotation operations
    imageRotated: () =>
        notifications.success('Image rotated successfully'),

    imageRotateError: (error: string) =>
        notifications.error(`Failed to rotate image: ${error}`),

    // Generic operations
    operationSuccess: (operation: string) =>
        notifications.success(`${operation} completed successfully`),

    operationError: (operation: string, error?: string) =>
        notifications.error(`${operation} failed${error ? `: ${error}` : ''}`),

    // Network errors
    networkError: () =>
        notifications.error('Network error. Please check your connection.'),

    // Validation errors
    validationError: (field: string) =>
        notifications.error(`Please check the ${field} field`),
}; 