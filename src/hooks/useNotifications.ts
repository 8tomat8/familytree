import toast from 'react-hot-toast';

export const useNotifications = () => {
    const showSuccess = (message: string) => {
        toast.success(message);
    };

    const showError = (message: string) => {
        toast.error(message);
    };

    const showLoading = (message: string) => {
        return toast.loading(message);
    };

    const showInfo = (message: string) => {
        toast(message, {
            icon: 'ℹ️',
        });
    };

    const showWarning = (message: string) => {
        toast(message, {
            icon: '⚠️',
            style: {
                background: '#f59e0b',
                color: '#fff',
            },
        });
    };

    const dismiss = (toastId?: string) => {
        if (toastId) {
            toast.dismiss(toastId);
        } else {
            toast.dismiss();
        }
    };

    const updateToast = (toastId: string, message: string, type: 'success' | 'error') => {
        if (type === 'success') {
            toast.success(message, { id: toastId });
        } else {
            toast.error(message, { id: toastId });
        }
    };

    const promise = <T>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: Error) => string);
        }
    ) => {
        return toast.promise(promise, messages);
    };

    return {
        showSuccess,
        showError,
        showLoading,
        showInfo,
        showWarning,
        dismiss,
        updateToast,
        promise,
    };
}; 