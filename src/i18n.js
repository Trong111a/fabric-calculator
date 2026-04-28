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
            "login_subtitle": "Log in to continue using the system",
            "register_subtitle": "Create an account to use the system",
            "full_name": "Full Name",
            "full_name_placeholder": "Enter your full name",
            "redirecting_login": "Redirecting to login page...",
            "error_email_invalid": "Invalid email format",

            "about_folder": "<strong>PATECH</strong> – Pattern Analysis To Estimate Costing & Handling is a graduation folder developed by a group of students majoring in <em>Garment Technology</em>,<br/>Class K22 – Faculty of Fashion & Tourism – Ho Chi Minh City University of Technology and Education.",
            "about_desc": "Project Title: <em>&quot;Research and Proposal of a Supporting Tool for Material Consumption Calculation Based on Pattern Data&quot;</em> — aimed at small and medium-sized garment enterprises,helping to reduce the time required for calculating material consumption from technical patterns and actual products.",
            "about_students": "Students",
            "about_supervisor": "Supervisor",
            "about_support": "Technical Support",

            "faculty": "Faculty of Fashion and Tourism",
            "major": "Major in Garment Technology",

            "tagline": "Fabric Area Measurement<br/>Management System",

            // Forgot Password
            "forgot_title": "Forgot Password",
            "forgot_sub": "Enter your email to receive a reset link",
            "send_email": "Send Email",
            "sending": "Sending...",
            "forgot_sent_title": "Reset link sent!",
            "forgot_sent_sub": "Check your inbox at {{email}} and follow the instructions.",
            "back_to_login": "Back to Login",

            // Reset Password
            "reset_title": "Set New Password",
            "reset_sub": "Enter your new password",
            "new_password_placeholder": "New password (at least 6 characters)",
            "confirm_password_placeholder": "Confirm password",
            "resetting": "Processing...",
            "reset_btn": "Reset Password",
            "reset_success_title": "Password reset!",
            "reset_success_sub": "You can now log in with your new password.",
            "login_now": "Log In Now",
            "pw_too_short": "Too short",
            "pw_medium": "Medium",
            "pw_strong": "Strong",
            "error_pw_complex": "Password must include uppercase, lowercase, number, and special character",

            // Folder Manager
            "folders": "Folders",
            "manage_folders": "Manage Folders",
            "create_folder": "Create folder",
            "creating_folder": "Creating...",
            "create_folder_failed": "Create folder failed",
            "folder_name": "Folder Name",
            "folder_name_placeholder": "Enter folder name...",
            "delete_folder": "Delete Folder",
            "total_folders": "Total Folders",
            "total_details": "Total Details",
            "total_area": "Total Area",
            "total_items": "items",
            "files": "files",
            "empty_folders": "No folders yet",
            "empty_folders_sub": "Create a folder to organize your patterns",
            "create_first_folder": "Create First Folder",
            "confirm_delete_folder": "Delete this folder?",
            "rename": "Rename",

            // Folder Detail – header & tabs
            "back": "Back",
            "list_tab": "List ({{count}})",
            "scan_tab": "Auto Scan",
            "manual_tab": "Draw Polygon",
            "export_tab": "Export CSV",

            // Folder Detail – stats
            "stat_details": "Details",
            "stat_quantity": "Total Quantity",
            "stat_total_area": "Total Area",

            // Folder Detail – list
            "loading": "Loading...",
            "folder_empty": "Empty Folder",
            "folder_empty_sub": "No details saved in this folder yet",
            "measure_first": "Measure First Detail",
            "view_detail": "View Detail",
            "delete_confirm": "Delete this detail?",
            "edit_name_qty": "Edit name / quantity",

            // Folder Detail – edit modal
            "edit_detail": "Edit Detail",
            "detail_name": "Detail Name",
            "detail_name_placeholder": "Detail name...",
            "detail_name_required": "Please enter a name",
            "quantity": "Quantity",
            "area_one": "Area (1 detail)",
            "total_area_qty": "Total ({{qty}} details)",
            "updating": "Updating...",
            "update": "Update",
            "cancel": "Cancel",
            "save": "Save",
            "saving": "Saving...",
            "save_to_folder": "Save to Folder",

            // FolderDetail – view modal
            "measured_at": "Measured at",
            "px_per_cm": "px/cm ratio",
            "vertices": "Vertices",

            // Scan Panel
            "scan_badge_ready": "✓ OpenCV Ready",
            "scan_badge_loading": "⏳ Loading OpenCV...",
            "step_upload": "Upload",
            "step_calibrate": "Calibrate",
            "step_pick_color": "Pick Color",
            "step_scan": "Scan",
            "step_adjust": "Adjust",
            "step_result": "Result",
            "step_draw": "Draw Polygon",
            "scan_upload_title": "Measure New Detail",
            "scan_upload_sub": "Upload or take a photo of your pattern to measure and save into folder <strong>{{name}}</strong>",
            "upload_image": "Upload Image",
            "upload_formats": "JPG, PNG, WEBP",
            "take_photo": "Take Photo",
            "use_camera": "Use Camera",
            "guide_calibrate_title": "Calibrate Ruler",
            "guide_calibrate_sub": "Drag ruler to a 30cm reference · adjust length & angle below",
            "guide_pick_title": "Pick Pattern Color",
            "guide_pick_sub": "Tap / click on the pattern surface — system will detect the edge",
            "guide_scan_title": "Scan & Detect Pattern",
            "guide_adjust_title": "Adjust Polygon — drag each point to match the edge",
            "guide_adjust_sub": "Area updates in realtime · Confirm to name & save",
            "guide_result_title": "Done — saved successfully",
            "ruler_length": "Ruler Length",
            "direct_px_cm": "Or enter px/cm directly",
            "rotation_angle": "Rotation Angle",
            "pattern_color": "Pattern color:",
            "area_label": "Area",
            "convert_m2": "In m²",
            "ratio": "Ratio",
            "vertices_label": "Vertices",
            "area_one_detail": "Area (1 detail)",
            "total_qty_detail": "Total ({{qty}} details)",
            "redo": "Redo",
            "confirm_calibrate": "Confirm · {{value}} px/cm",
            "recalibrate": "← Recalibrate",
            "repick_color": "Re-pick Color",
            "scan_calculate": "Scan & Calculate",
            "rescan": "← Rescan",
            "confirm_area": "Confirm · {{value}} m²",
            "measure_another": "Measure Another",
            "save_detail_title": "Save Detail",
            "save_area_info": "Area: <strong>{{area}} m²</strong> · Folder: <strong>{{folder}}</strong>",
            "detail_name_label": "Detail Name",
            "detail_name_eg": "E.g.: Front Body, Sleeve, Collar...",
            "area_one_preview": "Area (1 detail)",
            "total_preview": "Total ({{qty}} details)",

            // Manual Draw Panel
            "manual_badge": "✏️ Manual Polygon Draw",
            "manual_upload_title": "Draw Polygon Manually",
            "manual_upload_sub": "Upload image, calibrate ruler, then <strong>tap/click each point</strong> on the pattern edge to calculate area",
            "guide_draw_title": "Tap/click to place points · {{count}} points{{area}}",
            "guide_draw_sub": "Drag points to adjust · Need ≥ 3 points · Scale: {{scale}} px/cm · Scroll to zoom",
            "zoom_label": "Zoom:",
            "zoom_reset": "Reset",
            "zoom_hint": "· Scroll or pinch to zoom",
            "delete_last_point": "← Delete Last Point",
            "draw_another": "Draw Another Detail (same image)",
            "new_image": "New Image",
            "points_label": "Points",

            // Download Panel
            "export_title": "Export CSV Data",
            "export_sub": "Download all details from folder <b>{{name}}</b> as Excel/CSV",
            "preview_title": "Data Preview",
            "col_name": "Detail Name",
            "col_area_one": "Area (1 detail)",
            "col_quantity": "Quantity",
            "col_total_area": "Total Area",
            "col_date": "Date",
            "no_data": "No data yet",
            "grand_total": "Grand Total",
            "download_csv": "Download CSV",

            // ViewMain
            "app_title": "PATECH",
            "cv_ready": "✓ Ready",
            "cv_loading": "⏳ Loading OpenCV...",
            "change_folder": "Change Folder",
            "folder": "Folder",
            "measure_title": "Measure Pattern Area",
            "measure_sub": "Upload or take a photo of your pattern to start auto measurement",
            "scan_result_area": "Area",
            "scan_result_ratio": "Ratio",
            "save_result": "Save Result",
            "measure_another_vm": "Measure Another Pattern",

            // Messages
            "login_failed": "Login failed",
            "register_success": "Registration successful!",
            "error_fill_all": "Please fill in all fields!",
            "error_pw_short": "Password must be at least 8 characters",
            "error_pw_mismatch": "Passwords do not match",
            "delete_failed": "Delete failed",
            "save_error": "Save error: {{msg}}",
            "update_error": "Update error: {{msg}}",
            "calibrate_warning": "⚠️ Please calibrate first or OpenCV is not ready",
            "no_pattern_found": "Pattern not found! Try picking a different color or use Manual Draw.",
            "enter_detail_name": "Please enter detail name",
            "no_area": "No area yet",
            "link_invalid": "Link is invalid or has expired",
            "reset_failed": "Reset failed, please try again",

            // Backend error codes
            "errors": {
                // Generic
                "SERVER_ERROR": "A server error occurred. Please try again.",
                "MISSING_DATA": "Please fill in all required fields.",
                "NOT_FOUND": "The requested item was not found.",
                "UNKNOWN_ERROR": "An unknown error occurred.",

                // Auth – register
                "EMAIL_ALREADY_EXISTS": "This email is already registered.",
                "EMAIL_NOT_REGISTERED": "This email is not registered.",
                "EMAIL_INVALID": "Invalid email format.",
                "PASSWORD_WEAK": "Password must include uppercase, lowercase, number, and special character.",

                // Auth – login
                "INVALID_CREDENTIALS": "Incorrect email or password.",

                // Auth – forgot/reset password
                "RESET_EMAIL_SENT": "Password reset email sent. Check your inbox.",
                "MISSING_EMAIL": "Please enter your email address.",
                "TOKEN_INVALID_OR_EXPIRED": "This reset link is invalid or has expired. Please request a new one.",
                "PASSWORD_TOO_SHORT": "Password must be at least 8 characters.",

                // Measurements
                "INVALID_QUANTITY": "Quantity must be a whole number greater than 0.",

                // Projects
                "DELETED": "Deleted successfully.",
                "ADDED": "Added to folder successfully."
            }
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
            "login_subtitle": "Đăng nhập để tiếp tục sử dụng hệ thống",
            "register_subtitle": "Tạo tài khoản để sử dụng hệ thống",
            "full_name": "Họ và tên",
            "full_name_placeholder": "Nhập họ và tên của bạn",
            "about_folder": "<strong>PATECH</strong> - Pattern Analysis To Estimate Costing & Handling là sản phẩm đồ án Tốt nghiệp của Nhóm sinh viên ngành <em>Công nghệ May.</em><br/>Khóa K22 - Khoa Thời trang & Du lịch - Trường Đại học Công nghệ Kỹ thuật Thành Phố Hồ Chí Minh.",
            "about_desc": "Đề tài: <em>&quot;Nghiên cứu đề xuất công cụ hỗ trợ tính định mức dựa trên dữ liệu bộ mẫu&quot;</em> — hướng đến các doanh nghiệp may mặc vừa và nhỏ,<br/>hỗ trợ rút ngắn thời gian tính toán định mức nguyên liệu từ bộ mẫu kỹ thuật và sản phẩm thực tế.",
            "about_students": "Sinh viên thực hiện",
            "about_supervisor": "Giảng viên hướng dẫn",
            "about_support": "Hỗ trợ kỹ thuật",
            "redirecting_login": "Đang chuyển hướng đến trang đăng nhập...",
            "error_email_invalid": "Định dạng email không hợp lệ",

            "faculty": "KHOA THỜI TRANG & DU LỊCH",
            "major": "NGÀNH CÔNG NGHỆ MAY",

            "tagline": "Hệ thống quản lý<br/>đo diện tích vải",

            // Forgot Password
            "forgot_title": "Quên Mật Khẩu",
            "forgot_sub": "Nhập email để nhận link đặt lại mật khẩu",
            "send_email": "Gửi email",
            "sending": "Đang gửi...",
            "forgot_sent_title": "Đã gửi link đặt lại mật khẩu!",
            "forgot_sent_sub": "Kiểm tra hộp thư của {{email}} và làm theo hướng dẫn trong email.",
            "back_to_login": "Quay lại đăng nhập",

            // Reset Password
            "reset_title": "Đặt mật khẩu mới",
            "reset_sub": "Nhập mật khẩu mới cho tài khoản của bạn",
            "new_password_placeholder": "Mật khẩu mới (ít nhất 6 ký tự)",
            "confirm_password_placeholder": "Xác nhận mật khẩu",
            "resetting": "Đang xử lý...",
            "reset_btn": "Đặt lại mật khẩu",
            "reset_success_title": "Mật khẩu đã được đặt lại!",
            "reset_success_sub": "Bạn có thể đăng nhập bằng mật khẩu mới.",
            "login_now": "Đăng nhập ngay",
            "pw_too_short": "Quá ngắn",
            "pw_medium": "Trung bình",
            "pw_strong": "Mạnh",
            "error_pw_complex": "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt",

            // Folder Manager
            "folders": "Thư mục",
            "manage_folders": "Quản lý Thư mục",
            "create_folder": "Tạo thư mục",
            "creating_folder": "Đang tạo...",
            "create_folder_failed": "Tạo thư mục thất bại",
            "folder_name": "Tên thư mục",
            "folder_name_placeholder": "Nhập tên thư mục...",
            "delete_folder": "Xóa thư mục",
            "total_folders": "Tổng thư mục",
            "total_details": "Tổng chi tiết",
            "total_area": "Tổng diện tích",
            "total_items": "chi tiết",
            "files": "files",
            "empty_folders": "Chưa có thư mục nào",
            "empty_folders_sub": "Tạo thư mục để tổ chức các bản rập của bạn",
            "create_first_folder": "Tạo thư mục đầu tiên",
            "confirm_delete_folder": "Xóa thư mục này?",
            "rename": "Đổi tên",

            // Folder Detail – header & tabs
            "back": "Quay lại",
            "list_tab": "Danh sách ({{count}})",
            "scan_tab": "Đo tự động",
            "manual_tab": "Vẽ polygon",
            "export_tab": "Xuất CSV",

            // Folder Detail – stats
            "stat_details": "Số chi tiết",
            "stat_quantity": "Tổng số lượng",
            "stat_total_area": "Tổng diện tích",

            // Folder Detail – list
            "loading": "Đang tải...",
            "folder_empty": "Folder trống",
            "folder_empty_sub": "Chưa có chi tiết nào được lưu vào folder này",
            "measure_first": "Đo chi tiết đầu tiên",
            "view_detail": "Xem chi tiết",
            "delete_confirm": "Xóa chi tiết này?",
            "edit_name_qty": "Sửa tên / số lượng",

            // Folder Detail – edit modal
            "edit_detail": "Sửa chi tiết",
            "detail_name": "Tên chi tiết",
            "detail_name_placeholder": "Tên chi tiết...",
            "detail_name_required": "Vui lòng nhập tên",
            "quantity": "Số lượng",
            "area_one": "Diện tích 1 chi tiết",
            "total_area_qty": "Tổng ({{qty}} chi tiết)",
            "updating": "Đang lưu...",
            "update": "Cập nhật",
            "cancel": "Hủy",
            "save": "Lưu vào folder",
            "saving": "Đang lưu...",
            "save_to_folder": "Lưu vào folder",

            // Folder Detail – view modal
            "measured_at": "Đo lúc:",
            "px_per_cm": "Tỷ lệ px/cm",
            "vertices": "Số đỉnh",

            // Scan Panel
            "scan_badge_ready": "✓ OpenCV sẵn sàng",
            "scan_badge_loading": "⏳ Đang tải OpenCV...",
            "step_upload": "Tải ảnh",
            "step_calibrate": "Hiệu chuẩn",
            "step_pick_color": "Chọn màu",
            "step_scan": "Quét rập",
            "step_adjust": "Chỉnh sửa",
            "step_result": "Kết quả",
            "step_draw": "Vẽ polygon",
            "scan_upload_title": "Đo chi tiết mới",
            "scan_upload_sub": "Tải ảnh hoặc chụp ảnh bản rập để đo & lưu vào folder <strong>{{name}}</strong>",
            "upload_image": "Tải ảnh lên",
            "upload_formats": "JPG, PNG, WEBP",
            "take_photo": "Chụp ảnh",
            "use_camera": "Dùng thiết bị di động",
            "guide_calibrate_title": "Hiệu chuẩn thước đo",
            "guide_calibrate_sub": "Kéo thước vào vật chuẩn 30cm · chỉnh độ dài & góc bên dưới",
            "guide_pick_title": "Chọn màu rập",
            "guide_pick_sub": "click vào bề mặt rập để nhận màu và tìm biên",
            "guide_scan_title": "Quét & nhận diện rập",
            "guide_adjust_title": "Chỉnh polygon — kéo từng điểm để khớp viền rập",
            "guide_adjust_sub": "Diện tích cập nhật realtime · Xác nhận để đặt tên & lưu",
            "guide_result_title": "Hoàn tất — đã lưu thành công",
            "ruler_length": "Chiều dài thước",
            "direct_px_cm": "Hoặc nhập trực tiếp px/cm",
            "rotation_angle": "Góc xoay",
            "pattern_color": "Màu rập:",
            "area_label": "Diện tích",
            "convert_m2": "Quy đổi",
            "ratio": "Tỷ lệ",
            "vertices_label": "Số đỉnh",
            "area_one_detail": "Diện tích 1 chi tiết",
            "total_qty_detail": "Tổng ({{qty}} chi tiết)",
            "redo": "Làm lại",
            "confirm_calibrate": "Xác nhận · {{value}} px/cm",
            "recalibrate": "← Hiệu chuẩn lại",
            "repick_color": "Chọn lại màu",
            "scan_calculate": "Quét & Tính",
            "rescan": "← Quét lại",
            "confirm_area": "Xác nhận · {{value}} m²",
            "measure_another": "Đo chi tiết khác",
            "save_detail_title": "Lưu chi tiết",
            "save_area_info": "Diện tích: <strong>{{area}} m²</strong> · Folder: <strong>{{folder}}</strong>",
            "detail_name_label": "Tên chi tiết",
            "detail_name_eg": "VD: Thân trước, Tay áo, Cổ áo...",
            "area_one_preview": "Diện tích 1 chi tiết",
            "total_preview": "Tổng ({{qty}} chi tiết)",

            // Manual Draw Panel
            "manual_badge": "✏️ Vẽ thủ polygon",
            "manual_upload_title": "Vẽ polygon thủ công",
            "manual_upload_sub": "Tải ảnh, hiệu chuẩn thước đo rồi <strong>chạm/click từng điểm</strong> trên viền rập để tính diện tích",
            "guide_draw_title": "Chạm/click để đặt điểm · {{count}} điểm{{area}}",
            "guide_draw_sub": "Kéo điểm để chỉnh · Cần ≥ 3 điểm · Tỷ lệ: {{scale}} px/cm · Cuộn để zoom",
            "zoom_label": "Zoom:",
            "zoom_reset": "Reset",
            "zoom_hint": "· Cuộn chuột hoặc pinch để zoom",
            "delete_last_point": "← Xóa điểm cuối",
            "draw_another": "Vẽ chi tiết khác (cùng ảnh)",
            "new_image": "Ảnh mới",
            "points_label": "Số điểm",

            // Download Panel
            "export_title": "Xuất dữ liệu CSV",
            "export_sub": "Tải toàn bộ chi tiết trong folder <b>{{name}}</b> ra file Excel/CSV",
            "preview_title": "Xem trước dữ liệu",
            "col_name": "Tên chi tiết",
            "col_area_one": "DT 1 chi tiết",
            "col_quantity": "Số lượng",
            "col_total_area": "Tổng diện tích",
            "col_date": "Ngày đo",
            "no_data": "Chưa có dữ liệu",
            "grand_total": "Tổng cộng",
            "download_csv": "Tải xuống CSV",

            // ViewMain
            "app_title": "PATECH",
            "cv_ready": "✓ Sẵn sàng",
            "cv_loading": "⏳ Đang tải OpenCV...",
            "change_folder": "Đổi folder",
            "folder": "Folder",
            "measure_title": "Đo diện tích bản rập",
            "measure_sub": "Tải ảnh hoặc chụp ảnh bản rập để bắt đầu đo tự động",
            "scan_result_area": "Diện tích",
            "scan_result_ratio": "Tỷ lệ",
            "save_result": "Lưu kết quả",
            "measure_another_vm": "Đo rập khác",

            // Messages
            "login_failed": "Đăng nhập thất bại",
            "register_success": "Đăng ký thành công!",
            "error_fill_all": "Vui lòng điền đầy đủ!",
            "error_pw_short": "Mật khẩu ≥ 8 ký tự!",
            "error_pw_mismatch": "Mật khẩu xác nhận không khớp!",
            "delete_failed": "Xóa thất bại",
            "save_error": "Lỗi lưu: {{msg}}",
            "update_error": "Lỗi cập nhật: {{msg}}",
            "calibrate_warning": "⚠️ Chưa hiệu chuẩn hoặc OpenCV chưa sẵn sàng",
            "no_pattern_found": "Không tìm thấy rập! Hãy chọn lại màu rập hoặc dùng Vẽ thủ công.",
            "enter_detail_name": "Vui lòng nhập tên chi tiết",
            "no_area": "Chưa có diện tích",
            "link_invalid": "Link không hợp lệ hoặc đã hết hạn",
            "reset_failed": "Đặt lại thất bại, thử lại sau",

            // Backend error codes
            "errors": {
                // Generic
                "SERVER_ERROR": "Đã xảy ra lỗi máy chủ. Vui lòng thử lại.",
                "MISSING_DATA": "Vui lòng điền đầy đủ thông tin bắt buộc.",
                "NOT_FOUND": "Không tìm thấy dữ liệu yêu cầu.",
                "UNKNOWN_ERROR": "Đã xảy ra lỗi không xác định.",

                // Auth – register
                "EMAIL_ALREADY_EXISTS": "Email này đã được đăng ký.",
                "EMAIL_NOT_REGISTERED": "Email này chưa được đăng ký.",
                "EMAIL_INVALID": "Định dạng email không hợp lệ.",
                "PASSWORD_WEAK": "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.",

                // Auth – login
                "INVALID_CREDENTIALS": "Email hoặc mật khẩu không đúng.",

                // Auth – forgot/reset password
                "RESET_EMAIL_SENT": "Đã gửi email đặt lại mật khẩu. Kiểm tra hộp thư của bạn.",
                "MISSING_EMAIL": "Vui lòng nhập địa chỉ email.",
                "TOKEN_INVALID_OR_EXPIRED": "Link đặt lại không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.",
                "PASSWORD_TOO_SHORT": "Mật khẩu phải có ít nhất 8 ký tự.",

                // Measurements
                "INVALID_QUANTITY": "Số lượng phải là số nguyên lớn hơn 0.",

                // Projects
                "DELETED": "Đã xóa thành công.",
                "ADDED": "Đã thêm vào thư mục thành công."
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        // lng: 'vi',
        fallbackLng: 'vi',
        debug: false,
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;