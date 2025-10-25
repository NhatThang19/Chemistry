/**
 * Khởi tạo và quản lý toàn bộ trạng thái và logic cho ứng dụng bảng tuần hoàn.
 * @returns {object} Đối tượng Alpine.js với đầy đủ state và methods.
 */
function periodicTableApp() {
    return {
        // --- State ---
        /** @type {Array<object>} Danh sách tất cả các nguyên tố. */
        elements: Object.values(periodicTableData),
        /** @type {object|null} Nguyên tố đang được chọn để hiển thị chi tiết. */
        selectedElement: null,
        /** @type {string} View hiện tại trong sidebar ('summary', 'chat', 'quiz', '3d'). */
        currentView: 'summary',
        /** @type {boolean} Trạng thái đóng/mở của sidebar. */
        isSidebarOpen: false,

        // Quiz State
        /** @type {object|null} Đối tượng câu hỏi quiz hiện tại. */
        quizQuestion: null,
        /** @type {string} Phản hồi cho câu trả lời quiz ('correct', 'incorrect', ''). */
        quizFeedback: '',
        /** @type {number|null} Index của câu trả lời người dùng đã chọn. */
        quizFeedbackSelectedIndex: null,

        // Chat State
        /** @type {Array<object>} Lịch sử cuộc trò chuyện với AI. */
        chatHistory: [],
        /** @type {string} Nội dung tin nhắn người dùng đang nhập. */
        userMessage: '',

        // General State
        /** @type {boolean} Cờ báo hiệu một tiến trình đang chạy (ví dụ: gọi API). */
        isLoading: false,

        // --- Methods ---
        /**
         * Chọn một nguyên tố để hiển thị, mở sidebar và tải trước quiz.
         * @param {string} symbol Ký hiệu của nguyên tố (ví dụ: 'H', 'O').
         */
        selectElement(symbol) {
            this.selectedElement = periodicTableData[symbol];
            this.isSidebarOpen = true;
            this.currentView = 'summary';
            this.chatHistory = [];
            this.quizQuestion = null;
            this.quizFeedback = '';
            this.quizFeedbackSelectedIndex = null;
            document.body.classList.add('sidebar-open');
            
            // Tải trước câu hỏi quiz ở chế độ nền
            this.startQuiz(true); 
        },

        /**
         * Đóng sidebar và xóa dữ liệu của nguyên tố đang chọn.
         */
        closeSidebar() {
            this.isSidebarOpen = false;
            document.body.classList.remove('sidebar-open');
            
            // Đợi animation kết thúc rồi mới xóa dữ liệu để tránh giật
            setTimeout(() => {
                this.selectedElement = null;
            }, 300);
        },

        /**
         * Bắt đầu một phiên quiz mới bằng cách gọi API để tạo câu hỏi.
         * @param {boolean} [isPreload=false] Nếu là true, quiz sẽ được tải nền mà không chuyển view.
         */
        async startQuiz(isPreload = false) {
            if (!this.selectedElement) return;

            if (!isPreload) {
                this.currentView = 'quiz';
            }
            this.isLoading = true;
            this.quizQuestion = null;
            this.quizFeedback = '';
            this.quizFeedbackSelectedIndex = null;

            const prompt = `Bạn là một AI tạo câu hỏi quiz. Hãy tạo 1 câu hỏi trắc nghiệm dạng JSON về nguyên tố: ${this.selectedElement.name} (Ký hiệu: ${this.selectedElement.symbol}, Số hiệu: ${this.selectedElement.number}).
                Hãy đa dạng hóa loại câu hỏi: có thể hỏi về tính chất vật lý, tính chất hóa học, ứng dụng quan trọng, lịch sử phát hiện, hoặc một sự thật thú vị.
                Câu hỏi có thể ở dạng "Cái nào sau đây là..." hoặc "Đâu KHÔNG phải là...".
                Sử dụng KaTeX cho công thức hóa học nếu cần (ví dụ: $H_2O$).
                JSON phải có cấu trúc: 
                { 
                  "questionText": "Nội dung câu hỏi...", 
                  "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"], 
                  "correctAnswerIndex": [số từ 0-3] 
                }
                Chỉ trả về duy nhất chuỗi JSON, không có giải thích hay markdown.`;

            try {
                const jsonResponse = await this.callGeminiAPI(prompt, true);
                this.quizQuestion = JSON.parse(jsonResponse);
                this.$nextTick(() => {
                    this.renderMath('quiz-pane');
                });
            } catch (error) {
                console.error("Lỗi tạo quiz:", error);
                if (!isPreload) {
                    this.currentView = 'chat';
                    this.chatHistory.push({ role: 'bot', text: 'Xin lỗi, tôi không thể tạo câu hỏi quiz ngay lúc này. Vui lòng thử lại sau.' });
                }
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Kiểm tra câu trả lời của người dùng và cung cấp phản hồi.
         * @param {number} selectedIndex Index của lựa chọn người dùng.
         */
        checkAnswer(selectedIndex) {
            if (!this.quizQuestion || this.quizFeedback) return; // Không cho trả lời lại

            this.quizFeedbackSelectedIndex = selectedIndex;

            if (selectedIndex === this.quizQuestion.correctAnswerIndex) {
                this.quizFeedback = 'correct';
            } else {
                this.quizFeedback = 'incorrect';
            }
        },

        /**
         * Gửi một tin nhắn nhanh được định sẵn tới AI.
         * @param {string} message Tin nhắn nhanh để gửi.
         */
        sendQuickChatMessage(message) {
            this.userMessage = message;
            this.sendChatMessage();
        },

        /**
         * Gửi tin nhắn của người dùng đến API và hiển thị câu trả lời.
         */
        async sendChatMessage() {
            if (!this.userMessage.trim() || !this.selectedElement) return;

            const msg = this.userMessage;
            this.chatHistory.push({ role: 'user', text: this.escapeHTML(msg) });
            this.userMessage = '';
            this.isLoading = true;

            this.$nextTick(() => this.scrollToChatBottom());

            const prompt = `Bạn là một chuyên gia hóa học vui tính và sâu sắc. 
                Người dùng đang xem thông tin về nguyên tố: ${this.selectedElement.name} (Ký hiệu: ${this.selectedElement.symbol}, Số hiệu: ${this.selectedElement.number}).
                Hãy trả lời câu hỏi của họ một cách chi tiết, dễ hiểu và thân thiện, liên hệ với các thông tin đã biết về nguyên tố này (nếu hợp lý). 
                Sử dụng markdown cho định dạng (ví dụ: **đậm**, *nghiêng*) và KaTeX cho công thức hóa học (ví dụ: $H_2O$, $2H_2 + O_2 \rightarrow 2H_2O$).
                Câu hỏi của người dùng: "${msg}"
                
                Hướng dẫn trả lời:
                - Nếu họ hỏi về "ứng dụng" hay "điều chế", hãy tập trung vào đó.
                - Nếu họ hỏi "phương trình", hãy cung cấp một phương trình và giải thích.
                - Nếu họ hỏi "so sánh", hãy so sánh rõ ràng.
                - Hãy giữ câu trả lời tập trung vào hóa học và giáo dục.`;

            try {
                const aiResponse = await this.callGeminiAPI(prompt);
                const htmlResponse = this.formatResponse(aiResponse);
                this.chatHistory.push({ role: 'bot', text: htmlResponse });
            } catch (error) {
                console.error("Lỗi chat:", error);
                this.chatHistory.push({ role: 'bot', text: 'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu này. Vui lòng thử lại.' });
            } finally {
                this.isLoading = false;
                this.$nextTick(() => {
                    this.scrollToChatBottom();
                    this.renderMath('chat-history');
                });
            }
        },

        /**
         * Chuyển đổi các ký tự HTML đặc biệt để tránh XSS.
         * @param {string} str Chuỗi đầu vào.
         * @returns {string} Chuỗi đã được escape.
         */
        escapeHTML(str) {
            return str.replace(/[&<>"']/g, function (m) {
                return {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                }[m];
            });
        },

        /**
         * Định dạng phản hồi từ AI, xử lý Markdown và bảo vệ các biểu thức KaTeX.
         * @param {string} text Văn bản thô từ API.
         * @returns {string} Chuỗi HTML đã được định dạng và làm sạch.
         */
        formatResponse(text) {
            if (window.marked && window.DOMPurify) {
                const placeholders = [];
                
                // Tạm thời thay thế các khối KaTeX bằng placeholder để tránh bị Markdown xử lý.
                let protectedText = text.replace(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g, (match) => {
                    const placeholder = `<!--KATEX_PLACEHOLDER_${placeholders.length}-->`;
                    placeholders.push(match);
                    return placeholder;
                });

                // Chuyển đổi Markdown sang HTML và làm sạch.
                let html = window.DOMPurify.sanitize(window.marked.parse(protectedText));

                // Khôi phục lại các khối KaTeX.
                html = html.replace(/<!--KATEX_PLACEHOLDER_(\d+)-->/g, (match, index) => {
                    return placeholders[index];
                });

                return html;
            }

            // Fallback nếu thư viện chưa tải.
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        },

        /**
         * Cuộn xuống cuối hộp chat.
         */
        scrollToChatBottom() {
            const chatHistoryEl = document.getElementById('chat-history');
            if (chatHistoryEl) {
                chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
            }
        },

        /**
         * Render các biểu thức toán học trong một element cụ thể bằng KaTeX.
         * @param {string} elementId ID của element chứa nội dung cần render.
         */
        renderMath(elementId) {
            if (window.renderMathInElement) {
                const element = document.getElementById(elementId);
                if (element) {
                    renderMathInElement(element, {
                        delimiters: [
                            { left: "$$", right: "$$", display: true },
                            { left: "$", right: "$", display: false },
                            { left: "\\(", right: "\\)", display: false },
                            { left: "\\[", right: "\\]", display: true }
                        ],
                        throwOnError: false
                    });
                }
            }
        },

        /**
         * Gọi API của Google Gemini để lấy phản hồi.
         * @param {string} prompt Câu lệnh prompt để gửi đến AI.
         * @param {boolean} [isJson=false] Nếu true, yêu cầu phản hồi dưới dạng JSON.
         * @returns {Promise<string>} Phản hồi dạng text từ AI.
         */
        async callGeminiAPI(prompt, isJson = false) {
            const apiKey = "AIzaSyASinlV_JaAKD1IZfnO9uiy5yES36HI_cY";

            if (apiKey === "") {
                console.warn("API Key chưa được thiết lập. Vui lòng thêm API Key vào hàm callGeminiAPI.");
                throw new Error("API Key không hợp lệ.");
            }
            
            const model = 'gemini-2.5-flash';
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: {
                    parts: [{ text: "Bạn là một AI hỗ trợ cho một ứng dụng giáo dục hóa học. Hãy trả lời ngắn gọn, chính xác, sử dụng markdown và KaTeX." }]
                }
            };

            if (isJson) {
                payload.generationConfig = {
                    responseMimeType: "application/json",
                };
            }

            let response;
            let retries = 3;
            let delay = 1000;

            while (retries > 0) {
                try {
                    response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
                    }

                    const result = await response.json();

                    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts[0].text) {
                        return result.candidates[0].content.parts[0].text;
                    }

                    if (result.candidates && result.candidates.length > 0 && result.candidates[0].finishReason === "SAFETY") {
                        throw new Error("Nội dung bị chặn vì lý do an toàn.");
                    }

                    throw new Error("Phản hồi AI không hợp lệ hoặc rỗng.");

                } catch (error) {
                    console.warn(`Lỗi API, đang thử lại... (${retries - 1} lần còn lại)`, error.message);
                    retries--;
                    if (retries === 0) {
                        throw error;
                    }
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                }
            }
            throw new Error("Không thể lấy phản hồi từ AI sau nhiều lần thử.");
        },

        /**
         * Hàm khởi tạo, được gọi khi component được tải.
         */
        init() {
            if (window.marked) {
                window.marked.setOptions({
                    breaks: true
                });
            }
        }
    };
}
