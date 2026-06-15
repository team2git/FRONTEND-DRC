import { toast, ToastOptions } from 'react-toastify';

export const useToast = () => {
    const defaultOptions: ToastOptions = {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored", // Using colored theme for better visibility
    };

    const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, options?: ToastOptions) => {
        switch (type) {
            case 'success':
                toast.success(message, { ...defaultOptions, ...options });
                break;
            case 'error':
                toast.error(message, { ...defaultOptions, ...options });
                break;
            case 'info':
                toast.info(message, { ...defaultOptions, ...options });
                break;
            case 'warning':
                toast.warning(message, { ...defaultOptions, ...options });
                break;
            default:
                toast(message, { ...defaultOptions, ...options });
        }
    };

    return {
        success: (message: string, options?: ToastOptions) => showToast('success', message, options),
        error: (message: string, options?: ToastOptions) => showToast('error', message, options),
        info: (message: string, options?: ToastOptions) => showToast('info', message, options),
        warning: (message: string, options?: ToastOptions) => showToast('warning', message, options),
    };
};
