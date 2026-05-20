import { toast } from 'sonner';
import Swal from 'sweetalert2';

/**
 * Professional Notification Service
 * Combines Sonner (Toasts) and SweetAlert2 (Dialogs)
 */
export const notify = {
  // Toasts (Short, non-intrusive)
  success: (message) => {
    toast.success(message, {
      style: {
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        color: '#10b981',
      },
    });
  },
  
  error: (message) => {
    toast.error(message, {
      style: {
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: '#ef4444',
      },
    });
  },

  info: (message) => {
    toast.info(message);
  },

  warning: (message) => {
    toast.warning(message);
  },

  // Dialogs (Heavy, require action)
  confirm: async (title, text, confirmButtonText = 'Ya, Lanjutkan') => {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Batal',
      background: '#1e293b',
      color: '#f8fafc',
      customClass: {
        popup: 'professional-swal-popup',
        confirmButton: 'professional-swal-confirm',
        cancelButton: 'professional-swal-cancel',
      }
    });
  },

  alert: (title, text, icon = 'success') => {
    Swal.fire({
      title: title,
      text: text,
      icon: icon,
      confirmButtonColor: '#3b82f6',
      background: '#1e293b',
      color: '#f8fafc',
    });
  }
};
