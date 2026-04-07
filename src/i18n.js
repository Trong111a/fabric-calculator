import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Auth
      "login": "Login",
      "register": "Register",
      "email": "Email",
      "password": "Password",
      "confirm_password": "Confirm Password",
      "forgot_password": "Forgot Password?",
      "no_account": "Don't have an account?",
      "have_account": "Already have an account?",
      "logging_in": "Logging in...",
      "registering": "Registering...",
      "logout": "Logout",
      
      // Project Manager
      "projects": "Projects",
      "create_project": "Create Project",
      "project_name": "Project Name",
      "delete_project": "Delete Project",
      "total_items": "items",
      "empty_projects": "No projects found.",
      
      // Project Detail & Calculation
      "update": "Update",
      "cancel": "Cancel",
      "save": "Save",
      "saving": "Saving...",
      "back": "Back",
      "area": "Area",
      "quantity": "Quantity",
      "total_area": "Total Area",
      "unit_m2": "m²",
      "scan": "Scan",
      "manual_draw": "Manual Draw",
      "download": "Download",
      "delete_confirm": "Are you sure you want to delete this?",
      
      // Messages
      "login_failed": "Login failed",
      "register_success": "Registration successful!",
      "error_fill_all": "Please fill in all fields!",
      "error_pw_short": "Password must be at least 6 characters",
      "error_pw_mismatch": "Passwords do not match"
    }
  },
  vi: {
    translation: {
      // Auth
      "login": "Đăng Nhập",
      "register": "Đăng Ký",
      "email": "Email",
      "password": "Mật khẩu",
      "confirm_password": "Xác nhận mật khẩu",
      "forgot_password": "Quên mật khẩu?",
      "no_account": "Chưa có tài khoản?",
      "have_account": "Đã có tài khoản?",
      "logging_in": "Đang đăng nhập...",
      "registering": "Đang đăng ký...",
      "logout": "Đăng xuất",
      
      // Project Manager
      "projects": "Dự án",
      "create_project": "Tạo dự án mới",
      "project_name": "Tên dự án",
      "delete_project": "Xóa project",
      "total_items": "chi tiết",
      "empty_projects": "Chưa có dự án nào.",
      
      // Project Detail & Calculation
      "update": "Cập nhật",
      "cancel": "Hủy",
      "save": "Lưu kết quả",
      "saving": "Đang lưu...",
      "back": "Quay lại",
      "area": "Diện tích",
      "quantity": "Số lượng",
      "total_area": "Tổng diện tích",
      "unit_m2": "m²",
      "scan": "Quét mẫu",
      "manual_draw": "Vẽ tay",
      "download": "Tải về",
      "delete_confirm": "Bạn có chắc chắn muốn xóa không?",
      
      // Messages
      "login_failed": "Đăng nhập thất bại",
      "register_success": "Đăng ký thành công!",
      "error_fill_all": "Vui lòng điền đầy đủ!",
      "error_pw_short": "Mật khẩu ≥ 6 ký tự!",
      "error_pw_mismatch": "Mật khẩu xác nhận không khớp!"
    }
  }
};

i18n
  .use(LanguageDetector) // Tự động nhận diện ngôn ngữ trình duyệt
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi', // Mặc định là Tiếng Việt
    debug: false,
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;