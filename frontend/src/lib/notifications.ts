import Swal from 'sweetalert2';

// Success notification
export const showSuccess = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: message,
    confirmButtonColor: '#3B82F6',
    confirmButtonText: 'OK',
    timer: 3000,
    timerProgressBar: true,
  });
};

// Error notification
export const showError = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    confirmButtonColor: '#EF4444',
    confirmButtonText: 'OK',
  });
};

// Warning notification
export const showWarning = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: message,
    confirmButtonColor: '#F59E0B',
    confirmButtonText: 'OK',
  });
};

// Info notification
export const showInfo = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'info',
    title: title,
    text: message,
    confirmButtonColor: '#3B82F6',
    confirmButtonText: 'OK',
  });
};

// Confirmation dialog
export const showConfirm = (title: string, message?: string, confirmText = 'Yes', cancelText = 'No') => {
  return Swal.fire({
    icon: 'question',
    title: title,
    text: message,
    showCancelButton: true,
    confirmButtonColor: '#3B82F6',
    cancelButtonColor: '#6B7280',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
};

// Delete confirmation
export const showDeleteConfirm = (itemName: string) => {
  return Swal.fire({
    icon: 'warning',
    title: 'Are you sure?',
    text: `Do you want to delete ${itemName}? This action cannot be undone.`,
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  });
};

// Loading notification
export const showLoading = (title = 'Loading...', message?: string) => {
  return Swal.fire({
    title: title,
    text: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close any open Swal
export const closeSwal = () => {
  Swal.close();
};

// Toast notification (small notification at top-right)
export const showToast = (title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  return Toast.fire({
    icon: icon,
    title: title,
  });
};
