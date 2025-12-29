// Configuration - API calls will go through PHP proxy
const API_PROXY_URL = "api_proxy.php";

// Language data - 扩展支持更多语言
const LANGUAGES = [
    { code: 'auto', name: '自动检测' },
    { code: 'zh', name: '中文' },
    { code: 'en', name: '英语' },
    { code: 'ja', name: '日语' },
    { code: 'ko', name: '韩语' },
    { code: 'es', name: '西班牙语' },
    { code: 'fr', name: '法语' },
    { code: 'de', name: '德语' },
    { code: 'ru', name: '俄语' },
    // 新增语言
    { code: 'pt', name: '葡萄牙语' },
    { code: 'it', name: '意大利语' },
    { code: 'ar', name: '阿拉伯语' },
    { code: 'th', name: '泰语' },
    { code: 'vi', name: '越南语' },
    { code: 'id', name: '印尼语' },
    { code: 'tr', name: '土耳其语' },
    { code: 'pl', name: '波兰语' },
    { code: 'nl', name: '荷兰语' },
    { code: 'el', name: '希腊语' },
    { code: 'he', name: '希伯来语' },
    { code: 'sv', name: '瑞典语' },
    { code: 'no', name: '挪威语' },
    { code: 'da', name: '丹麦语' },
    { code: 'fi', name: '芬兰语' },
    { code: 'cs', name: '捷克语' },
    { code: 'hu', name: '匈牙利语' },
    { code: 'ro', name: '罗马尼亚语' },
    { code: 'uk', name: '乌克兰语' },
    { code: 'ms', name: '马来语' },
    { code: 'fa', name: '波斯语' }
];

document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        header: document.getElementById('header'),
        inputTab: document.getElementById('inputTab'),
        outputTab: document.getElementById('outputTab'),
        inputText: document.getElementById('inputText'),
        outputView: document.getElementById('outputView'),
        textContainer: document.getElementById('textContainer'),
        charCounter: document.getElementById('charCounter'),
        charCount: document.getElementById('charCount'),
        progressBar: document.getElementById('progressBar'),
        translateBtn: document.getElementById('translateBtn'),
        clearBtn: document.getElementById('clearBtn'),
        swapLangBtn: document.getElementById('swapLangBtn'),
        copyBtn: document.getElementById('copyBtn'),
        sourceLangBtn: document.getElementById('sourceLangBtn'),
        targetLangBtn: document.getElementById('targetLangBtn'),
        sourceLangDisplay: document.getElementById('sourceLangDisplay'),
        targetLangDisplay: document.getElementById('targetLangDisplay'),

        // Language Modal Elements
        langModal: document.getElementById('langModal'),
        langModalHeader: document.getElementById('langModalHeader'),
        langModalList: document.getElementById('langModalList'),
        langSearchInput: document.getElementById('langSearchInput'),
        cancelLangBtn: document.getElementById('cancelLangBtn'),

        // Image Upload Elements
        imageUploadBtn: document.getElementById('imageUploadBtn'),
        imageInput: document.getElementById('imageInput'),
        imagePreview: document.getElementById('imagePreview'),
        previewImg: document.getElementById('previewImg'),
        removeImageBtn: document.getElementById('removeImageBtn'),
        ocrStatus: document.getElementById('ocrStatus'),

        // App Container for drag events
        appContainer: document.querySelector('.app-container')
    };

    let isTranslating = false;
    let currentMode = 'input';
    let translatedText = '';
    let currentLangSelect = 'source';
    let selectedImage = null;
    let isDragging = false;

    // Theme Manager
    const ThemeManager = {
        init() {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            let theme = savedTheme || (prefersDark ? 'dark' : 'light');

            if (!savedTheme) {
                theme = 'light';
            }

            this.apply(theme);

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.apply(e.matches ? 'dark' : 'light');
                }
            });
        },

        apply(theme) {
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }

            localStorage.setItem('theme', theme);
        }
    };

    // Language Selection Manager
    const LangManager = {
        sourceLang: 'auto',
        targetLang: 'en',

        init() {
            this.updateDisplay();
        },

        updateDisplay() {
            const sourceLangData = LANGUAGES.find(l => l.code === this.sourceLang);
            const targetLangData = LANGUAGES.find(l => l.code === this.targetLang);

            elements.sourceLangDisplay.textContent = sourceLangData ? sourceLangData.name : '自动检测';
            elements.targetLangDisplay.textContent = targetLangData ? targetLangData.name : '英语';
        },

        swap() {
            if (this.sourceLang === 'auto') {
                return;
            }

            const temp = this.sourceLang;
            this.sourceLang = this.targetLang;
            this.targetLang = temp;
            this.updateDisplay();
        },

        showSelection(type) {
            currentLangSelect = type;
            const isSource = type === 'source';

            elements.langModalHeader.textContent = isSource ? '选择源语言' : '选择目标语言';
            elements.langSearchInput.value = '';

            this.renderList('');
            elements.langModal.classList.add('show');
            elements.langSearchInput.focus();
        },

        renderList(searchTerm) {
            const isSource = currentLangSelect === 'source';
            const currentLang = isSource ? this.sourceLang : this.targetLang;

            const filtered = LANGUAGES.filter(lang => {
                if (!searchTerm) return true;
                return lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       lang.code.toLowerCase().includes(searchTerm.toLowerCase());
            });

            const groups = {
                main: filtered.filter(l => l.code !== 'auto'),
                special: filtered.filter(l => l.code === 'auto')
            };

            const list = searchTerm ? filtered : [...groups.special, ...groups.main];

            let html = '';
            let lastSection = '';

            list.forEach(lang => {
                const isSelected = lang.code === currentLang;
                const section = searchTerm ? '' : (lang.code === 'auto' ? '特殊' : '常用');

                if (!searchTerm && section !== lastSection) {
                    if (lastSection !== '') html += '<div style="height: 8px;"></div>';
                    html += `<div class="lang-modal-section">${section}</div>`;
                    lastSection = section;
                }

                html += `
                    <div class="lang-modal-item ${isSelected ? 'selected' : ''}"
                         data-code="${lang.code}"
                         data-name="${lang.name}">
                        <span>${lang.name}</span>
                    </div>
                `;
            });

            elements.langModalList.innerHTML = html;

            elements.langModalList.querySelectorAll('.lang-modal-item').forEach(item => {
                item.addEventListener('click', () => {
                    const code = item.dataset.code;
                    const name = item.dataset.name;

                    if (isSource) {
                        this.sourceLang = code;
                    } else {
                        this.targetLang = code;
                    }

                    this.updateDisplay();
                    this.hideSelection();
                });
            });
        },

        hideSelection() {
            elements.langModal.classList.remove('show');
        }
    };

    // Image OCR & Auto-Translation Manager
    const ImageManager = {
        async processImage(file) {
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.updateStatus('请选择图片文件', 'error');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.updateStatus('图片大小不能超过5MB', 'error');
                return;
            }

            selectedImage = file;
            this.showPreview(file);
            this.updateStatus('正在识别并翻译图片内容...', 'loading');

            // Add processing animation to image preview
            elements.imagePreview.classList.add('processing');

            // Add loading animation to upload button
            elements.imageUploadBtn.classList.add('loading');
            elements.imageUploadBtn.innerHTML = '<span class="icon">⏳</span> 处理中...';

            try {
                const base64Image = await this.fileToBase64(file);

                // Step 1: OCR识别 + 翻译（一次性完成）
                const translatedResult = await this.callOCRAndTranslateAPI(base64Image);

                if (translatedResult) {
                    // 自动切换到输出标签
                    elements.outputView.textContent = translatedResult;
                    translatedText = translatedResult;

                    // Remove processing animation
                    elements.imagePreview.classList.remove('processing');

                    // Update status with success animation
                    this.updateStatus('识别并翻译完成！', 'success');
                    elements.imageUploadBtn.classList.add('success');
                    elements.imageUploadBtn.innerHTML = '<span class="icon">✅</span> 完成！';

                    // 自动切换到输出标签
                    setTimeout(() => {
                        switchTab('output');
                    }, 500);

                    // 2秒后重置按钮状态
                    setTimeout(() => {
                        elements.imageUploadBtn.classList.remove('loading', 'success');
                        elements.imageUploadBtn.innerHTML = '<span class="icon">📷</span> 导入图片自动翻译';
                    }, 2000);
                } else {
                    throw new Error('处理失败');
                }
            } catch (error) {
                console.error('Image processing error:', error);
                this.updateStatus(`处理失败: ${error.message}`, 'error');

                // Remove processing animations
                elements.imagePreview.classList.remove('processing');
                elements.imageUploadBtn.classList.add('error');
                elements.imageUploadBtn.innerHTML = '<span class="icon">❌</span> 失败';

                setTimeout(() => {
                    elements.imageUploadBtn.classList.remove('loading', 'error');
                    elements.imageUploadBtn.innerHTML = '<span class="icon">📷</span> 导入图片自动翻译';
                }, 2000);
            }
        },

        fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },

        async callOCRAndTranslateAPI(base64Image) {
            const srcLang = LangManager.sourceLang;
            const tgtLang = LangManager.targetLang;

            // 构建系统提示词，同时完成OCR和翻译任务
            const langMap = {
                'zh': '中文',
                'en': '英语',
                'ja': '日语',
                'ko': '韩语',
                'es': '西班牙语',
                'fr': '法语',
                'de': '德语',
                'ru': '俄语',
                'pt': '葡萄牙语',
                'it': '意大利语',
                'ar': '阿拉伯语',
                'th': '泰语',
                'vi': '越南语',
                'id': '印尼语',
                'tr': '土耳其语',
                'pl': '波兰语',
                'nl': '荷兰语',
                'el': '希腊语',
                'he': '希伯来语',
                'sv': '瑞典语',
                'no': '挪威语',
                'da': '丹麦语',
                'fi': '芬兰语',
                'cs': '捷克语',
                'hu': '匈牙利语',
                'ro': '罗马尼亚语',
                'uk': '乌克兰语',
                'ms': '马来语',
                'fa': '波斯语'
            };

            const targetLangName = langMap[tgtLang] || tgtLang;
            const sourceLangName = langMap[srcLang] || srcLang;

            let systemPrompt = "";
            if (srcLang !== 'auto') {
                systemPrompt = `你是一个专业的OCR识别和翻译助手。请完成以下任务：
1. 识别图片中的所有文字内容
2. 将识别出的${sourceLangName}文字翻译成${targetLangName}
3. 只返回翻译后的文本，不要任何解释或说明`;
            } else {
                systemPrompt = `你是一个专业的OCR识别和翻译助手。请完成以下任务：
1. 识别图片中的所有文字内容
2. 将识别出的文字翻译成${targetLangName}
3. 只返回翻译后的文本，不要任何解释或说明`;
            }

            const payload = {
                model: "doubao-seed-1-6-flash-250828",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            },
                            {
                                type: "text",
                                text: "请识别图片中的文字并翻译。"
                            }
                        ]
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            };

            const response = await fetch(API_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API错误 (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API响应格式无效');
            }

            return data.choices[0].message.content.trim();
        },

        showPreview(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                elements.previewImg.src = e.target.result;
                elements.imagePreview.classList.add('show');
            };
            reader.readAsDataURL(file);
        },

        removeImage() {
            selectedImage = null;
            elements.imagePreview.classList.remove('show', 'processing');
            elements.previewImg.src = '';
            elements.imageInput.value = '';
            this.updateStatus('', '');
            elements.imageUploadBtn.classList.remove('loading', 'success', 'error');
            elements.imageUploadBtn.innerHTML = '<span class="icon">📷</span> 导入图片自动翻译';
        },

        updateStatus(message, type) {
            elements.ocrStatus.textContent = message;
            elements.ocrStatus.className = 'ocr-status';
            if (type) {
                elements.ocrStatus.classList.add(type);
            }
        }
    };

    function switchTab(mode) {
        currentMode = mode;

        if (mode === 'input') {
            elements.inputTab.classList.add('active');
            elements.outputTab.classList.remove('active');
            elements.inputText.classList.remove('hidden');
            elements.outputView.classList.add('hidden');
            elements.charCounter.style.display = 'block';
            elements.textContainer.classList.add('active');
            elements.textContainer.classList.remove('readonly');
        } else {
            elements.inputTab.classList.remove('active');
            elements.outputTab.classList.add('active');
            elements.inputText.classList.add('hidden');
            elements.outputView.classList.remove('hidden');
            elements.charCounter.style.display = 'none';
            elements.textContainer.classList.remove('active');
            elements.textContainer.classList.add('readonly');
        }
    }

    elements.inputText.addEventListener('input', function() {
        const length = elements.inputText.value.length;
        elements.charCount.textContent = length;

        if (length > 500) {
            elements.inputText.value = elements.inputText.value.substring(0, 500);
            elements.charCount.textContent = 500;
        }
    });

    elements.swapLangBtn.addEventListener('click', function() {
        LangManager.swap();
    });

    elements.clearBtn.addEventListener('click', function() {
        if (currentMode === 'input') {
            elements.inputText.value = '';
            elements.charCount.textContent = '0';
            // Also clear image
            ImageManager.removeImage();
        } else {
            elements.outputView.textContent = '';
            translatedText = '';
        }
    });

    elements.copyBtn.addEventListener('click', function() {
        const text = currentMode === 'input' ? elements.inputText.value : elements.outputView.textContent;

        if (!text.trim()) return;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch((err) => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    });

    function fallbackCopy(text) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    }

    elements.inputTab.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab('input');
    });

    elements.outputTab.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab('output');
    });

    // Image Upload Events
    elements.imageUploadBtn.addEventListener('click', function() {
        elements.imageInput.click();
    });

    elements.imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            ImageManager.processImage(file);
        }
    });

    elements.removeImageBtn.addEventListener('click', function() {
        ImageManager.removeImage();
    });

    // Language Modal Events
    elements.sourceLangBtn.addEventListener('click', function() {
        LangManager.showSelection('source');
    });

    elements.targetLangBtn.addEventListener('click', function() {
        LangManager.showSelection('target');
    });

    elements.langSearchInput.addEventListener('input', function() {
        LangManager.renderList(this.value);
    });

    elements.cancelLangBtn.addEventListener('click', function() {
        LangManager.hideSelection();
    });

    elements.langModal.addEventListener('click', function(e) {
        if (e.target === elements.langModal) {
            LangManager.hideSelection();
        }
    });

    elements.translateBtn.addEventListener('click', async function() {
        if (isTranslating) return;

        const text = elements.inputText.value.trim();
        if (!text) {
            switchTab('input');
            return;
        }

        const srcLang = LangManager.sourceLang;
        const tgtLang = LangManager.targetLang;

        if (tgtLang === srcLang && srcLang !== 'auto') {
            return;
        }

        isTranslating = true;
        elements.translateBtn.disabled = true;
        elements.translateBtn.classList.add('loading');
        elements.progressBar.classList.add('active');

        // Add processing animation to container
        elements.textContainer.classList.add('processing');

        try {
            const result = await callVolcAPI(text, srcLang, tgtLang);
            translatedText = result;
            elements.outputView.textContent = result;

            elements.progressBar.classList.remove('active');
            elements.textContainer.classList.remove('processing');
            elements.textContainer.style.animation = 'containerSuccess 0.4s ease-out';

            setTimeout(() => {
                switchTab('output');
            }, 500);
        } catch (error) {
            console.error('Translation error:', error);
            elements.progressBar.classList.remove('active');
            elements.textContainer.classList.remove('processing');
            elements.textContainer.style.animation = 'containerShake 0.4s ease-out';
        } finally {
            isTranslating = false;
            elements.translateBtn.disabled = false;
            elements.translateBtn.classList.remove('loading');

            setTimeout(() => {
                elements.textContainer.style.animation = '';
            }, 800);
        }
    });

    // VolcEngine API Integration (Text Translation) - Now via PHP
    async function callVolcAPI(text, srcLang, tgtLang) {
        let systemContent = "你是一个翻译助手。将用户的文本翻译成目标语言。保持意思准确自然。";

        const langMap = {
            'zh': '中文',
            'en': '英语',
            'ja': '日语',
            'ko': '韩语',
            'es': '西班牙语',
            'fr': '法语',
            'de': '德语',
            'ru': '俄语',
            'pt': '葡萄牙语',
            'it': '意大利语',
            'ar': '阿拉伯语',
            'th': '泰语',
            'vi': '越南语',
            'id': '印尼语',
            'tr': '土耳其语',
            'pl': '波兰语',
            'nl': '荷兰语',
            'el': '希腊语',
            'he': '希伯来语',
            'sv': '瑞典语',
            'no': '挪威语',
            'da': '丹麦语',
            'fi': '芬兰语',
            'cs': '捷克语',
            'hu': '匈牙利语',
            'ro': '罗马尼亚语',
            'uk': '乌克兰语',
            'ms': '马来语',
            'fa': '波斯语'
        };

        const targetLangName = langMap[tgtLang] || tgtLang;
        const sourceLangName = langMap[srcLang] || srcLang;

        if (srcLang !== 'auto') {
            systemContent = `你是一个专业翻译。从${sourceLangName}翻译到${targetLangName}。保留语气和含义。只返回翻译后的文本。`;
        } else {
            systemContent = `你是一个专业翻译。翻译成${targetLangName}。保留语气和含义。只返回翻译后的文本。`;
        }

        const payload = {
            model: "deepseek-v3-250324",
            messages: [
                {"role": "system", "content": systemContent},
                {"role": "user", "content": text}
            ],
            temperature: 0.3,
            max_tokens: 500
        };

        try {
            const response = await fetch(API_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API错误 (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API响应格式无效');
            }

            return data.choices[0].message.content.trim();

        } catch (error) {
            console.error('VolcAPI Error:', error);
            if (error.message.includes('401')) {
                throw new Error('API密钥无效，请检查后端配置');
            } else if (error.message.includes('429')) {
                throw new Error('请求过于频繁，请稍后重试');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('网络错误，请检查连接');
            }
            throw error;
        }
    }

    // Drag and Drop Import Functionality
    function setupDragAndDrop() {
        const appContainer = elements.appContainer;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            appContainer.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight drop zone when dragging over
        appContainer.addEventListener('dragenter', function(e) {
            if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
                isDragging = true;
                appContainer.classList.add('drag-over');
                elements.ocrStatus.textContent = '释放图片以导入并翻译';
                elements.ocrStatus.className = 'ocr-status loading';
            }
        });

        appContainer.addEventListener('dragover', function(e) {
            if (isDragging) {
                appContainer.classList.add('drag-over');
            }
        });

        appContainer.addEventListener('dragleave', function(e) {
            if (e.target === appContainer) {
                isDragging = false;
                appContainer.classList.remove('drag-over');
                if (!selectedImage) {
                    elements.ocrStatus.textContent = '';
                    elements.ocrStatus.className = 'ocr-status';
                }
            }
        });

        appContainer.addEventListener('drop', function(e) {
            isDragging = false;
            appContainer.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    ImageManager.processImage(file);
                } else {
                    elements.ocrStatus.textContent = '请拖入图片文件';
                    elements.ocrStatus.className = 'ocr-status error';
                    setTimeout(() => {
                        if (!selectedImage) {
                            elements.ocrStatus.textContent = '';
                            elements.ocrStatus.className = 'ocr-status';
                        }
                    }, 2000);
                }
            }
        });
    }

    // Paste Import Functionality
    function setupPasteImport() {
        document.addEventListener('paste', function(e) {
            // Only handle paste when not in a text input
            if (e.target === elements.inputText || e.target === elements.langSearchInput) {
                return;
            }

            const items = e.clipboardData.items;
            if (!items) return;

            // Look for image files in clipboard
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                        e.preventDefault(); // Prevent default paste behavior for images
                        ImageManager.processImage(file);
                        break;
                    }
                }
            }
        });
    }

    // Initialize
    ThemeManager.init();
    LangManager.init();
    setupDragAndDrop();
    setupPasteImport();

    if (!elements.inputText.value) {
        elements.inputText.value = "你好，谢谢！";
        elements.charCount.textContent = elements.inputText.value.length;
    }
});
