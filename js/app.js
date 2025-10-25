function periodicTableApp() {
    return {
        // --- Trạng thái (State) ---
        elements: Object.values(periodicTableData),
        selectedElement: null,
        currentView: 'chat', // 'summary', 'chat', 'quiz', '3d'
        isSidebarOpen: false,

        // Trạng thái Quiz
        quizQuestion: null,
        quizFeedback: '',
        quizFeedbackSelectedIndex: null,

        // Trạng thái Chat
        chatHistory: [],
        userMessage: '',

        // Trạng thái chung
        isLoading: false,

        // --- Hành động (Actions) ---
        selectElement(symbol) {
            this.selectedElement = periodicTableData[symbol];
            this.isSidebarOpen = true;
            this.currentView = 'summary'; // Bắt đầu ở tab tóm tắt (summary)
            this.chatHistory = [];
            this.quizQuestion = null;
            this.quizFeedback = '';
            this.quizFeedbackSelectedIndex = null;
            document.body.classList.add('sidebar-open');
            
            // Tải trước câu hỏi quiz ở chế độ nền
            this.startQuiz(true); 
        },

        closeSidebar() {
            this.isSidebarOpen = false;
            document.body.classList.remove('sidebar-open');
            
            // Đợi 300ms (cho animation) rồi mới xóa dữ liệu
            setTimeout(() => {
                this.selectedElement = null;
            }, 300);
        },

        async startQuiz(isPreload = false) {
            if (!this.selectedElement) return;

            if (!isPreload) {
                // Chỉ chuyển view nếu đây là hành động click, không phải preload
                this.currentView = 'quiz';
            }
            this.isLoading = true;
            this.quizQuestion = null;
            this.quizFeedback = '';
            this.quizFeedbackSelectedIndex = null;

            // Prompt đã được cải thiện
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
                // Render KaTeX cho câu hỏi và các lựa chọn
                this.$nextTick(() => {
                    this.renderMath('quiz-pane');
                });
            } catch (error) {
                console.error("Lỗi tạo quiz:", error);
                if (!isPreload) {
                    // Nếu không phải preload, báo lỗi cho người dùng
                    this.currentView = 'chat';
                    this.chatHistory.push({ role: 'bot', text: 'Xin lỗi, tôi không thể tạo câu hỏi quiz ngay lúc này. Vui lòng thử lại sau.' });
                }
            } finally {
                this.isLoading = false;
            }
        },

        checkAnswer(selectedIndex) {
            if (!this.quizQuestion || this.quizFeedback) return; // Không cho trả lời lại

            this.quizFeedbackSelectedIndex = selectedIndex;

            if (selectedIndex === this.quizQuestion.correctAnswerIndex) {
                this.quizFeedback = 'correct';
            } else {
                this.quizFeedback = 'incorrect';
            }
            
            // Không cần renderMath ở đây
        },

        sendQuickChatMessage(message) {
            this.userMessage = message;
            this.sendChatMessage();
        },

        async sendChatMessage() {
            if (!this.userMessage.trim() || !this.selectedElement) return;

            const msg = this.userMessage;
            this.chatHistory.push({ role: 'user', text: this.escapeHTML(msg) });
            this.userMessage = '';
            this.isLoading = true;

            this.$nextTick(() => this.scrollToChatBottom());

            // Prompt đã được cải thiện
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

        // ==========================================================
        // ===== THAY ĐỔI QUAN TRỌNG Ở ĐÂY =====
        // ==========================================================
        formatResponse(text) {
            if (window.marked && window.DOMPurify) {
                const placeholders = [];
                
                // 1. "Ẩn" các khối KaTeX ($...$ và $$...$$) bằng một mã giữ chỗ (placeholder)
                // THAY ĐỔI: Sử dụng <!-- ... --> làm placeholder để Markdown bỏ qua
                let protectedText = text.replace(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g, (match) => {
                    const placeholder = `<!--KATEX_PLACEHOLDER_${placeholders.length}-->`;
                    placeholders.push(match); // Lưu lại khối KaTeX gốc
                    return placeholder;
                });

                // 2. Chạy Markdown và DOMPurify trên văn bản đã được "bảo vệ"
                let html = window.DOMPurify.sanitize(window.marked.parse(protectedText));

                // 3. Khôi phục lại các khối KaTeX nguyên bản vào đúng vị trí
                // THAY ĐỔI: Regex tìm kiếm placeholder <!-- ... -->
                html = html.replace(/<!--KATEX_PLACEHOLDER_(\d+)-->/g, (match, index) => {
                    return placeholders[index];
                });

                return html;
            }

            // Fallback nếu thư viện chưa tải
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        },
        // ==========================================================
        // ===== KẾT THÚC THAY ĐỔI =====
        // ==========================================================

        scrollToChatBottom() {
            const chatHistoryEl = document.getElementById('chat-history');
            if (chatHistoryEl) {
                chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
            }
        },

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

        async callGeminiAPI(prompt, isJson = false) {
            const apiKey = "AIzaSyASinlV_JaAKD1IZfnO9uiy5yES36HI_cY"; // API Key của bạn

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
                        const text = result.candidates[0].content.parts[0].text;
                        return text;
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

        init() {
            if (window.marked) {
                window.marked.setOptions({
                    breaks: true
                });
            }
        }
    };
}
