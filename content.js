// === Global Variables & Constants ===
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
const CHAT_SIDEBAR_ID = 'ai-chat-sidebar-custom';
const FAB_ID = 'ai-fab-button';
const FAB_MENU_ID = 'ai-fab-menu';

const AVAILABLE_GEMINI_MODELS = [
    { id: 'gemini-2.5-flash-preview-05-20', name: 'gemini-2.5-flash', endpoint: 'gemini-2.5-flash-preview-05-20:generateContent' },
    { id: 'gemini-2.5-pro-preview-05-06', name: 'gemini-2.5-pro', endpoint: 'gemini-2.5-pro-preview-05-06generateContent' },
    { id: 'gemini-2.0-flash', name: 'gemini-2.0-flash', endpoint: 'gemini-2.0-flash:generateContent' },
];
const DEFAULT_MODEL_ID = 'gemini-2.5-flash-preview-05-20'; // ברירת מחדל

// === API Key & Model Management ===
async function getUserApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['gemini_api_key'], (result) => {
      resolve(result.gemini_api_key || null);
    });
  });
}

async function setUserApiKey(key) {
  return new Promise((resolve) => {
    if (key === null || (typeof key === 'string' && key.trim() === '')) {
        chrome.storage.local.remove('gemini_api_key', resolve); // מחיקת המפתח
    } else {
        chrome.storage.local.set({ gemini_api_key: key }, resolve);
    }
  });
}

async function ensureApiKeyExists() {
  let currentKey = await getUserApiKey();
  if (!currentKey) {
    const userInput = await showCustomPrompt({
      title: "מפתח API נדרש",
      message: "הזן את מפתח ה־API שלך ל־Gemini (Google Generative AI):",
      inputPlaceholder: "AIza...",
      defaultValue: ""
    });
    if (userInput && userInput.trim().startsWith("AIza")) {
      await setUserApiKey(userInput.trim());
      showTooltipPopup("המפתח נשמר בהצלחה."); // שימוש בפונקציית פופאפ קיימת
      return userInput.trim();
    } else {
      showTooltipPopup("מפתח לא חוקי או ריק. לא ניתן לבצע פעולות AI ללא מפתח.");
      return null;
    }
  }
  return currentKey;
}

async function getUserSelectedModel() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['gemini_selected_model_id'], (result) => {
      resolve(result.gemini_selected_model_id || DEFAULT_MODEL_ID);
    });
  });
}

async function setUserSelectedModel(modelId) {
  return new Promise((resolve) => {
    if (AVAILABLE_GEMINI_MODELS.some(model => model.id === modelId)) {
      chrome.storage.local.set({ gemini_selected_model_id: modelId }, resolve);
    } else {
      console.error("Attempted to set an invalid model ID:", modelId, "Reverting to default.");
      chrome.storage.local.set({ gemini_selected_model_id: DEFAULT_MODEL_ID }, resolve);
    }
  });
}


// פונקציית Placeholder להצגת דיאלוג הגדרות - יש לממש אותה!
async function showSettingsDialog() {
    console.log("showSettingsDialog called. Implement this function.");
    const currentApiKey = await getUserApiKey();
    const currentModelId = await getUserSelectedModel();

    // כאן ניתן לבנות דיאלוג HTML מורכב או להשתמש בסדרת קריאות ל-showCustomPrompt
    // דוגמה בסיסית מאוד עם prompt עבור המפתח:
    const newApiKey = await showCustomPrompt({
        title: "הגדרות AI",
        message: `מפתח API נוכחי: ${currentApiKey ? currentApiKey.substring(0, 4) + "..." + currentApiKey.substring(currentApiKey.length - 4) : "לא הוגדר"}\nהזן מפתח API חדש (או השאר ריק למחיקה):`,
        inputPlaceholder: "AIza...",
        defaultValue: "" // לא מציגים את המפתח הישן כדי לאלץ את המשתמש להזין מחדש אם רוצה לשנות, או להשאיר ריק למחיקה.
    });

    if (newApiKey !== null) { // אם המשתמש לא לחץ "ביטול"
        if (newApiKey.trim() === "") {
            await setUserApiKey(null); // מחיקת המפתח
            showTooltipPopup("מפתח API נמחק.");
        } else if (newApiKey.trim().startsWith("AIza")) {
            await setUserApiKey(newApiKey.trim());
            showTooltipPopup("מפתח API עודכן בהצלחה.");
        } else {
            showTooltipPopup("המפתח שהוזן אינו תקין ולא נשמר.");
        }
    }

    // לאחר מכן, דיאלוג לבחירת מודל (דוגמה עם select פשוט):
    // זה ידרוש מימוש של showCustomPrompt שיכול לקבל select או בניית דיאלוג ייעודי.
    // כרגע, רק מדפיסים לקונסול:
    const modelsOptions = AVAILABLE_GEMINI_MODELS.map(m => `${m.id} (${m.name})`).join('\n');
    console.log(`Current model: ${currentModelId}. Available models:\n${modelsOptions}`);
    const selectedModelInput = await showCustomPrompt({
        title: "בחירת מודל Gemini",
        message: `המודל הנוכחי: ${AVAILABLE_GEMINI_MODELS.find(m=>m.id === currentModelId)?.name || 'לא ידוע'}\nהזן ID של מודל חדש (לדוגמה, gemini-1.5-flash-latest):\n${AVAILABLE_GEMINI_MODELS.map(m => `- ${m.id} (${m.name.substring(0,25)}...)`).join('\n')}`,
        inputPlaceholder: "gemini-1.0-pro",
        defaultValue: currentModelId
    });

    if (selectedModelInput && AVAILABLE_GEMINI_MODELS.some(m => m.id === selectedModelInput)) {
        await setUserSelectedModel(selectedModelInput);
        showTooltipPopup(`המודל הוחלף ל: ${AVAILABLE_GEMINI_MODELS.find(m=>m.id === selectedModelInput).name}`);
    } else if (selectedModelInput !== null) { // אם לא בוטל אבל לא תקין
        showTooltipPopup("בחירת המודל לא תקינה או בוטלה.");
    }
}


//שליחת הבקשה
async function sendToGemini(promptText) {
  const apiKey = await getUserApiKey(); // אין צורך ב-ensureApiKeyExists כאן, כי פעולות בדרך כלל קוראות לו לפני
  if (!apiKey) {
    // אם בכל זאת מגיעים לכאן ללא מפתח, נזרוק שגיאה שתטופל על ידי הקורא
    throw new Error("מפתח API של Gemini חסר. אנא הגדר אותו דרך ההגדרות.");
  }

  const selectedModelId = await getUserSelectedModel();
  const modelConfig = AVAILABLE_GEMINI_MODELS.find(m => m.id === selectedModelId) ||
                      AVAILABLE_GEMINI_MODELS.find(m => m.id === DEFAULT_MODEL_ID);

  const modelEndpoint = modelConfig.endpoint;
  const fullApiUrl = `${GEMINI_API_BASE_URL}${modelEndpoint}?key=${apiKey}`;

  console.log("Sending to Gemini with model:", modelConfig.name, "URL:", fullApiUrl);

  const requestBody = {
    contents: [{ parts: [{ text: promptText }] }]
  };

  //   if (selectedModelId.startsWith('gemini-1.5')) {
  //     requestBody.systemInstruction = { parts: [{ text: "You are a helpful AI assistant." }] };
  //   }

  const response = await fetch(fullApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => response.text());
    console.error("Gemini API Error:", errorBody);
    let errorMessage = `שגיאת Gemini (${response.status}) עם מודל ${modelConfig.name}`;
    if (typeof errorBody === 'object' && errorBody.error && errorBody.error.message) {
        errorMessage += `: ${errorBody.error.message}`;
    } else if (typeof errorBody === 'string') {
        errorMessage += `: ${errorBody.substring(0, 200)}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (data.candidates && data.candidates.length > 0 &&
      data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
    return data.candidates[0].content.parts[0].text;
  } else if (data.promptFeedback && data.promptFeedback.blockReason) {
    console.warn("Gemini prompt blocked:", data.promptFeedback);
    return `הבקשה נחסמה על ידי Gemini. סיבה: ${data.promptFeedback.blockReason}${data.promptFeedback.blockReasonMessage ? ' - ' + data.promptFeedback.blockReasonMessage : ''}.`;
  } else {
    console.warn("Gemini response format unexpected:", data);
    return "לא התקבלה תשובה תקינה מ-Gemini, או שהתשובה ריקה.";
  }
}


// --- Tooltip State & Variables ---
let currentTooltip = null;
let tooltipAiHelperWrapper = null;
let tooltipActionListVisible = false;

// --- Chat State & Variables ---
let aiChatSidebarInstance = null;

// --- FAB State & Variables ---
let fabMenuVisible = false;
let fabButtonElement = null;
let fabMenuElement = null;

// === Helper Functions for Custom Actions ===
function searchSelectedOnGoogle(selectionObject) {
    const query = selectionObject ? selectionObject.toString().trim() : "";
    if (query) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    } else {
        alert("אנא סמן טקסט לחיפוש בגוגל.");
    }
}

async function shareCurrentPage() {
    const pageTitle = document.title;
    const pageUrl = window.location.href;
    if (navigator.share) {
        try {
            await navigator.share({ title: pageTitle, text: `בדוק את הדף הזה: ${pageTitle}`, url: pageUrl });
        } catch (error) {
            console.error('Error sharing page:', error);
            copyLinkToClipboard(pageUrl, pageTitle, "שגיאה בשיתוף, הקישור הועתק במקום:");
        }
    } else {
        copyLinkToClipboard(pageUrl, pageTitle, "שיתוף Web API לא נתמך, הקישור הועתק:");
    }
}

function copyLinkToClipboard(url, title = "", prefixMessage = "") {
    navigator.clipboard.writeText(url)
        .then(() => {
            const message = `${prefixMessage ? prefixMessage + " " : ""}הקישור לדף "${title || url}" הועתק ללוח!`;
            showTooltipPopup(message);
        })
        .catch(err => {
            console.error('Failed to copy link: ', err);
            alert('שגיאה בהעתקת הקישור.');
        });
}

// === CONFIGURATIONS ===
const QUICK_ACTION_IDS = [ 'summarize_selected', 'translate_selected_custom_dialog', 'explain_contextual_selected', 'google_search_selected', 'share_page', 'open_ai_chat', 'settings_panel' ];

const allActionsConfig = {
    settings_panel: {
        id: 'settings_panel',
        label: '⚙️',
        title: 'הגדרות AI',
        shortLabel: 'הגדרות',
        type: 'custom_action',
        actionFn: async () => {
            await showSettingsDialog();
        }
    },
    summarize_selected: { id: 'summarize_selected', label: '📝', title: 'סכם מסומן', shortLabel: 'סכם', command: 'סכם את הטקסט המסומן הבא בצורה תמציתית: ', type: 'selected_text' },
    translate_selected_custom_dialog: { id: 'translate_selected_custom_dialog', label: '🌐', title: 'תרגם מסומן...', shortLabel: 'תרגם', type: 'prompt_language_selected_custom_dialog', baseCommand: 'תרגם את הטקסט המסומן הבא ל{LANG}: ' },
    explain_contextual_selected: { id: 'explain_contextual_selected', label: '💡', title: 'הסבר מסומן בהקשר', shortLabel: 'הסבר', type: 'explain_with_context' },
    google_search_selected: { id: 'google_search_selected', label: '🔍', title: 'חפש מסומן בגוגל', shortLabel: 'חפש', type: 'custom_action', actionFn: () => searchSelectedOnGoogle(window.getSelection()) },
    share_page: { id: 'share_page', label: '🔗', title: 'שתף דף זה', shortLabel: 'שתף', type: 'custom_action', actionFn: shareCurrentPage },
    open_ai_chat: { id: 'open_ai_chat', label: '💬', title: 'פתח צ\'אט AI', shortLabel: 'צ\'אט', type: 'custom_action', actionFn: launchAIChatSidebar },
    page_analysis: { categoryLabel: 'ניתוח כל הדף', actions: [
        { id: 'summarize_page', label: '📄', title: 'סכם את כל הדף', command: 'סכם את תוכן הדף הבא: ', type: 'full_page_text' },
        { id: 'keywords_page', label: '🔑', title: 'מילות מפתח מהדף', command: 'חלץ מילות מפתח עיקריות מתוכן הדף הבא: ', type: 'full_page_text' },
        { id: 'translate_page_custom_dialog', label: '🌍', title: 'תרגם את כל הדף...', type: 'prompt_language_page_custom_dialog', baseCommand: 'תרגם את כל תוכן הדף הבא ל{LANG}: ' },
        { id: 'fact_check_page', label: '✔️', title: 'אמת את העובדות שבדף הזה', command: 'בדוק את העובדות המוצגות בטקסט הבא וחפש אישורים או סתירות ממקורות אמינים: ', type: 'full_page_text' },
        { id: 'teach_me_page_info', label: '🧑‍🏫', title: 'למד אותי את המידע שבדף', command: 'הסבר לי את המושגים והמידע העיקריים המוצגים בטקסט הבא בצורה פשוטה וברורה, כאילו אתה מלמד אותי את הנושא: ', type: 'full_page_text' },
        { id: 'page_to_qa', label: '❓️', title: 'הפוך תוכן דף לשאלות ותשובות', command: 'הפוך את תוכן הדף הבא לפורמט של שאלות ותשובות המסכמות את המידע העיקרי: ', type: 'full_page_text' }
    ]},
    selected_text_extended: { categoryLabel: 'פעולות נוספות על מסומן', actions: [
        { id: 'improve_selected', label: '✍️', title: 'שפר ניסוח (מסומן)', command: 'תקן ושפר ניסוח של הטקסט המסומן הבא: ', type: 'selected_text' },
        { id: 'ask_on_selected_custom_dialog', label: '❓', title: 'שאל על המסומן...', type: 'prompt_question_custom_dialog', baseCommand: 'בהתייחס לטקסט המסומן הבא: "{TEXT}". ענה על השאלה: "{QUESTION}"' },
    ]}
};

// === UI HELPER FUNCTIONS ===
function getPageContentForAI() { let text = ""; if (document.body) text = (document.querySelector('main article') || document.querySelector('article') || document.querySelector('main') || document.body).innerText || ""; return text.substring(0, 10000); }
function ensureTooltipAiHelperWrapper() { if (!tooltipAiHelperWrapper) { tooltipAiHelperWrapper = document.createElement('div'); tooltipAiHelperWrapper.id = 'ai-text-helper-wrapper'; document.body.appendChild(tooltipAiHelperWrapper); } }
function showTooltipProcessingUI(actionText = "מעבד...") { ensureTooltipAiHelperWrapper(); tooltipAiHelperWrapper.innerHTML = ''; const banner = document.createElement("div"); banner.className = "processing-banner"; banner.innerText = actionText; tooltipAiHelperWrapper.appendChild(banner); const progressContainer = document.createElement("div"); progressContainer.className = "progress-container"; const progressBar = document.createElement("div"); progressBar.className = "progress-bar"; progressContainer.appendChild(progressBar); tooltipAiHelperWrapper.appendChild(progressContainer); let startTime = Date.now(); let intervalId = setInterval(() => { let progress = Math.min(100, (Date.now() - startTime) / 80); progressBar.style.width = progress + "%"; }, 100); return () => { clearInterval(intervalId); if(tooltipAiHelperWrapper) tooltipAiHelperWrapper.innerHTML = '';}; }
function showTooltipPopup(responseText, originalText = "") { ensureTooltipAiHelperWrapper(); tooltipAiHelperWrapper.innerHTML = ''; const popupOverlay = document.createElement("div"); popupOverlay.className = "popup-overlay visible"; const popup = document.createElement("div"); popup.className = "popup"; popup.tabIndex = -1; const popupContent = document.createElement("div"); popupContent.className = "popup-content"; popupContent.innerHTML = ''; const lines = responseText.split('\n'); lines.forEach((line, index) => { if (index > 0) popupContent.appendChild(document.createElement('br')); popupContent.appendChild(document.createTextNode(line)); }); popup.appendChild(popupContent); const actionsBar = document.createElement("div"); actionsBar.className = "popup-actions"; const closeButton = document.createElement("button"); closeButton.className = "close"; closeButton.innerHTML = "✖"; closeButton.title = "סגור"; closeButton.onclick = () => { if (tooltipAiHelperWrapper) tooltipAiHelperWrapper.innerHTML = ''; }; actionsBar.appendChild(closeButton); popup.appendChild(actionsBar); popupOverlay.appendChild(popup); tooltipAiHelperWrapper.appendChild(popupOverlay); popup.focus(); popupOverlay.addEventListener("keydown", (e) => { if (e.key === "Escape") closeButton.click(); }); popupOverlay.addEventListener('click', (event) => { if (event.target === popupOverlay) closeButton.click(); }); }
function getSentenceAroundSelection(selection) { if (!selection || selection.rangeCount === 0) return null; const range = selection.getRangeAt(0); const selectedText = selection.toString(); if (!selectedText.trim()) return null; let node = range.commonAncestorContainer; if (node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode; if (!node || typeof node.innerText !== 'string') return null; const fullText = node.innerText; const selectionStartIndex = fullText.indexOf(selectedText); if (selectionStartIndex === -1) return selectedText; let sentenceStart = selectionStartIndex; while (sentenceStart > 0 && !['.', '!', '?', '\n'].includes(fullText[sentenceStart - 1])) { sentenceStart--; } while (sentenceStart < selectionStartIndex && /\s/.test(fullText[sentenceStart])) { sentenceStart++; } let sentenceEnd = selectionStartIndex + selectedText.length; while (sentenceEnd < fullText.length && !['.', '!', '?', '\n'].includes(fullText[sentenceEnd])) { sentenceEnd++; } if (sentenceEnd < fullText.length && ['.', '!', '?'].includes(fullText[sentenceEnd])) { sentenceEnd++; } let sentence = fullText.substring(sentenceStart, sentenceEnd).trim(); if (!sentence.includes(selectedText)) { const searchWindow = 200; const windowStart = Math.max(0, selectionStartIndex - searchWindow); const windowEnd = Math.min(fullText.length, selectionStartIndex + selectedText.length + searchWindow); const textWindow = fullText.substring(windowStart, windowEnd); const localSelectionStart = selectedText ? textWindow.indexOf(selectedText) : -1; if(localSelectionStart !== -1) { let localSentenceStart = localSelectionStart; while(localSentenceStart > 0 && !['.','!','?','\n'].includes(textWindow[localSentenceStart-1])) localSentenceStart--; while(localSentenceStart < localSelectionStart && /\s/.test(textWindow[localSentenceStart])) localSentenceStart++; let localSentenceEnd = localSelectionStart + selectedText.length; while(localSentenceEnd < textWindow.length && !['.','!','?','\n'].includes(textWindow[localSentenceEnd])) localSentenceEnd++; if(localSentenceEnd < textWindow.length && ['.','!','?'].includes(textWindow[localSentenceEnd])) localSentenceEnd++; sentence = textWindow.substring(localSentenceStart, localSentenceEnd).trim(); } else { sentence = selectedText; } } return sentence; }
function showCustomPrompt({ title = "קלט נדרש", message, inputPlaceholder = "", inputType = "text", defaultValue = "" }) { return new Promise((resolve) => { const existingOverlay = document.querySelector('.ai-custom-prompt-overlay'); if (existingOverlay) existingOverlay.remove(); const overlay = document.createElement('div'); overlay.className = 'ai-custom-prompt-overlay'; const dialog = document.createElement('div'); dialog.className = 'ai-custom-prompt-dialog'; dialog.innerHTML = ` <div class="prompt-header"> ${title ? `<div class="prompt-title">${title}</div>` : ''} </div> ${message ? `<div class="prompt-message">${message.replace(/\n/g, '<br>')}</div>` : ''} <input type="${inputType}" class="prompt-input-field" placeholder="${inputPlaceholder}" value="${defaultValue}"> <div class="prompt-actions"> <button class="prompt-button secondary cancel-btn">ביטול</button> <button class="prompt-button primary confirm-btn">אישור</button> </div> `; overlay.appendChild(dialog); document.body.appendChild(overlay); const inputField = dialog.querySelector('.prompt-input-field'); const confirmBtn = dialog.querySelector('.confirm-btn'); const cancelBtn = dialog.querySelector('.cancel-btn'); requestAnimationFrame(() => { overlay.classList.add('visible'); inputField.focus(); inputField.select(); }); const closeDialog = (value) => { overlay.classList.remove('visible'); setTimeout(() => { overlay.remove(); resolve(value); }, 200); }; confirmBtn.onclick = () => closeDialog(inputField.value); cancelBtn.onclick = () => closeDialog(null); overlay.onclick = (e) => { if (e.target === overlay) closeDialog(null); }; inputField.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); closeDialog(inputField.value); } else if (e.key === 'Escape') { e.preventDefault(); closeDialog(null);}}; }); }

// === TOOLTIP/ACTION BUTTON CREATION & HANDLING ===
async function createTooltipActionButton(actionId, actionConfig, selectionObject, type = 'quick') {
    const button = document.createElement('button'); button.className = 'tooltip-button'; button.title = actionConfig.title || '';
    const iconSpan = document.createElement('span'); iconSpan.className = 'tooltip-icon'; iconSpan.textContent = actionConfig.label || ''; button.appendChild(iconSpan);
    if (type === 'quick' && actionConfig.shortLabel) { const textSpan = document.createElement('span'); textSpan.textContent = actionConfig.shortLabel || ''; button.appendChild(textSpan); }
    else if (type === 'list' && actionConfig.title) { const textSpan = document.createElement('span'); textSpan.textContent = actionConfig.title || ''; button.appendChild(textSpan); }
    button.addEventListener('click', async (e) => {
        e.stopPropagation(); removeTooltip();
        if (actionConfig.type === 'custom_action') {
            if (actionConfig.actionFn) {
                // עבור פעולות כמו הגדרות, ייתכן שנרצה לוודא שהמפתח קיים *לפני* שהן רצות
                // אבל מכיוון ש-ensureApiKeyExists גם מציג UI, נשאיר את זה כך כרגע
                actionConfig.actionFn();
            } else {
                console.warn("Custom action with no actionFn:", actionConfig.id);
            }
            return;
        }

        // עבור כל שאר הפעולות שדורשות API, ודא שהמפתח קיים קודם
        const apiKey = await ensureApiKeyExists();
        if (!apiKey) {
          return; // הפונקציה ensureApiKeyExists כבר הציגה התראה
        }

        let fullPrompt = ""; let contentForAI = ""; let actionTitleForDisplay = actionConfig.title;
        const selectedText = selectionObject ? selectionObject.toString().trim() : "";
        switch (actionConfig.type) {
            case 'selected_text': if (!selectedText) { alert("אנא סמן טקסט."); return; } contentForAI = selectedText; fullPrompt = actionConfig.command + contentForAI; break;
            case 'explain_with_context': if (!selectedText) { alert("אנא סמן טקסט להסבר."); return; } const sentence = getSentenceAroundSelection(selectionObject); contentForAI = sentence || selectedText; fullPrompt = `הסבר את החלק המסומן (בתוך גרשיים כפולות) בהקשר של המשפט המלא: "${selectedText}".\nהמשפט המלא הוא: ${contentForAI}`; actionTitleForDisplay = "הסבר בהקשר"; break;
            case 'full_page_text': contentForAI = getPageContentForAI(); if (!contentForAI) { alert("אין תוכן בדף."); return; } fullPrompt = actionConfig.command + contentForAI; break;
            case 'prompt_language_selected_custom_dialog': if (!selectedText) { alert("אנא סמן טקסט."); return; } contentForAI = selectedText; const targetLangSel = await showCustomPrompt({ title: "תרגום טקסט מסומן", message: `לאיזו שפה לתרגם את הטקסט: "${selectedText.substring(0,50)}..."?`, inputPlaceholder: "לדוגמה: אנגלית, ספרדית" }); if (targetLangSel && targetLangSel.trim() !== "") { fullPrompt = actionConfig.baseCommand.replace('{LANG}', targetLangSel) + contentForAI; actionTitleForDisplay = `תרגום ל${targetLangSel}`; } else return; break;
            case 'prompt_language_page_custom_dialog': contentForAI = getPageContentForAI(); if (!contentForAI) { alert("אין תוכן בדף."); return; } const targetLangPage = await showCustomPrompt({ title: "תרגום כל הדף", message: "לאיזו שפה לתרגם את כל תוכן הדף הנוכחי?", inputPlaceholder: "לדוגמה: אנגלית, צרפתית" }); if (targetLangPage && targetLangPage.trim() !== "") { fullPrompt = actionConfig.baseCommand.replace('{LANG}', targetLangPage) + contentForAI; actionTitleForDisplay = `תרגום דף ל${targetLangPage}`; } else return; break;
            case 'prompt_question_custom_dialog': if (!selectedText) { alert("אנא סמן טקסט."); return; } contentForAI = selectedText; const userQ = await showCustomPrompt({ title: "שאל על הטקסט המסומן", message: `הקלד את שאלתך על הטקסט: "${selectedText.substring(0,100)}..."`, inputPlaceholder: "שאלתך כאן..." }); if (userQ && userQ.trim() !== "") { fullPrompt = actionConfig.baseCommand.replace('{TEXT}', selectedText).replace('{QUESTION}', userQ); } else return; break;
            default: if (actionConfig.command) { fullPrompt = actionConfig.command + (selectedText || ""); } else { console.warn("Tooltip action default case with no command:", actionConfig); return; } break;
        }
        if (fullPrompt) await handleTooltipAIAction(fullPrompt, contentForAI, actionTitleForDisplay);
    });
    return button;
}

function removeTooltip() { const tooltipToRemove = currentTooltip; tooltipActionListVisible = false; currentTooltip = null; if (tooltipToRemove) { tooltipToRemove.classList.remove('visible'); setTimeout(() => { if (tooltipToRemove && tooltipToRemove.parentNode) tooltipToRemove.remove(); }, 200); } }

async function createTooltip(x, y, selectionObject) {
    removeTooltip();
    const newTooltipElement = document.createElement('div');
    newTooltipElement.className = 'ai-helper-tooltip';
    const quickActionsBar = document.createElement('div');
    quickActionsBar.className = 'tooltip-quick-actions';

    const buttonPromises = QUICK_ACTION_IDS.map(id => {
        const cfg = allActionsConfig[id];
        if (cfg) return createTooltipActionButton(id, cfg, selectionObject, 'quick');
        return Promise.resolve(null); // החזרת Promise שמסתיימת ב-null אם אין קונפיגורציה
    });

    try {
        const buttonElements = await Promise.all(buttonPromises);
        buttonElements.forEach(buttonElement => {
            if (buttonElement) { // בודק אם הכפתור לא null
                quickActionsBar.appendChild(buttonElement);
            }
        });
    } catch (error) {
        console.error("createTooltip: Error awaiting quick action buttons:", error);
    }

    newTooltipElement.appendChild(quickActionsBar);
    const moreToggle = document.createElement('button');
    moreToggle.className = 'tooltip-more-actions-toggle';
    moreToggle.innerHTML = 'עוד <span class="tooltip-icon">▾</span>';
    moreToggle.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleTooltipActionList(newTooltipElement, selectionObject);
    });
    newTooltipElement.appendChild(moreToggle);

    try {
        document.body.appendChild(newTooltipElement);
    } catch (error) {
        console.error("createTooltip: Error appending tooltip to body:", error);
        return;
    }

    const rect = newTooltipElement.getBoundingClientRect();
    let left = x - rect.width / 2;
    let top = y - rect.height - 10;
    if (left < 0) left = 5;
    if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 5;
    if (top < 0) top = y + 15;
    newTooltipElement.style.left = `${left + window.scrollX}px`;
    newTooltipElement.style.top = `${top + window.scrollY}px`;
    currentTooltip = newTooltipElement;
    tooltipActionListVisible = false;
    setTimeout(() => {
        if (currentTooltip === newTooltipElement && newTooltipElement.parentNode) {
            newTooltipElement.classList.add('visible');
        } else if (newTooltipElement.parentNode) {
            newTooltipElement.remove(); // נקה אם כבר הוסר
        }
    }, 10);
}

async function toggleTooltipActionList(tooltipElement, selectionObject) {
    if (!tooltipElement) {
        console.warn("toggleTooltipActionList: tooltipElement is null");
        return;
    }
    let actionList = tooltipElement.querySelector('.tooltip-action-list');
    if (!actionList) {
        actionList = document.createElement('div');
        actionList.className = 'tooltip-action-list';
        const allButtonPromisesWithDetails = [];
        Object.keys(allActionsConfig).forEach(categoryKey => {
            const categoryConfig = allActionsConfig[categoryKey];
            if (categoryConfig.categoryLabel && categoryConfig.actions && Array.isArray(categoryConfig.actions)) {
                categoryConfig.actions.forEach(actionCfg => {
                    if (actionCfg && actionCfg.id && !QUICK_ACTION_IDS.includes(actionCfg.id)) {
                        const buttonPromise = createTooltipActionButton(actionCfg.id, actionCfg, selectionObject, 'list')
                            .then(buttonNode => ({ button: buttonNode, categoryKey: categoryKey, originalConfig: actionCfg }))
                            .catch(error => {
                                console.error(`Error creating button for ${actionCfg.id} in category ${categoryKey}:`, error);
                                const errorPlaceholder = document.createElement('span');
                                errorPlaceholder.textContent = `Error: ${actionCfg.id}`;
                                errorPlaceholder.style.color = 'red';
                                return { button: errorPlaceholder, categoryKey: categoryKey, originalConfig: actionCfg };
                            });
                        allButtonPromisesWithDetails.push(buttonPromise);
                    }
                });
            }
        });

        try {
            const resolvedButtonsWithDetails = await Promise.all(allButtonPromisesWithDetails);
            const buttonsByCategory = {};
            resolvedButtonsWithDetails.forEach(item => {
                if (item && item.button) { // בדוק ש-item ו-item.button קיימים
                    if (!buttonsByCategory[item.categoryKey]) buttonsByCategory[item.categoryKey] = [];
                    buttonsByCategory[item.categoryKey].push(item.button);
                }
            });
            Object.keys(allActionsConfig).forEach(categoryKey => {
                const categoryConfig = allActionsConfig[categoryKey];
                if (categoryConfig.categoryLabel && buttonsByCategory[categoryKey] && buttonsByCategory[categoryKey].length > 0) {
                    const categoryTitleElement = document.createElement('div');
                    categoryTitleElement.className = 'tooltip-category-title';
                    categoryTitleElement.textContent = categoryConfig.categoryLabel;
                    actionList.appendChild(categoryTitleElement);
                    buttonsByCategory[categoryKey].forEach(buttonNode => {
                        if (buttonNode && buttonNode instanceof Node) actionList.appendChild(buttonNode);
                    });
                }
            });
        } catch (error) {
            console.error("toggleTooltipActionList: Error awaiting list action buttons:", error);
        }
        tooltipElement.appendChild(actionList);
    }
    tooltipActionListVisible = !tooltipActionListVisible;
    actionList.style.display = tooltipActionListVisible ? 'block' : 'none';
}

async function handleTooltipAIAction(fullPrompt, contextText = "", actionName = "פעולה") {
    // אין צורך ב-ensureApiKeyExists כאן, כי הוא נקרא ב-createTooltipActionButton
    const cleanupProcessingUI = showTooltipProcessingUI(actionName);
    try {
        const aiResponseText = await sendToGemini(fullPrompt);
        cleanupProcessingUI();
        if (aiResponseText) {
            showTooltipPopup(aiResponseText, contextText);
        } else {
            showTooltipPopup("לא התקבלה תשובה תקינה מהשרת (Gemini).", contextText);
        }
    } catch (error) {
        cleanupProcessingUI();
        console.error("AI Tooltip Error (Gemini):", error);
        showTooltipPopup(`שגיאת תקשורת עם Gemini: ${error.message}`, contextText);
    }
}

// === FAB (Floating Action Button) CODE ===
async function createFabMenuItem(actionId, actionConfig) {
    const button = document.createElement('button');
    button.className = 'fab-menu-button';
    button.title = actionConfig.title || '';
    const iconSpan = document.createElement('span');
    iconSpan.className = 'fab-menu-icon';
    iconSpan.textContent = actionConfig.label || '';
    button.appendChild(iconSpan);
    const textSpan = document.createElement('span');
    textSpan.className = 'fab-menu-text';
    textSpan.textContent = actionConfig.title || ''; // השתמש ב-title המלא כאן
    button.appendChild(textSpan);

    button.addEventListener('click', async (e) => {
        e.stopPropagation();
        hideFabMenu();

        if (actionConfig.type === 'custom_action') {
            if (actionConfig.actionFn) {
                actionConfig.actionFn();
            } else {
                console.warn("FAB custom action with no actionFn:", actionConfig.id);
            }
            return;
        }

        // עבור פעולות שדורשות API
        const apiKey = await ensureApiKeyExists();
        if (!apiKey) {
            return;
        }

        let fullPrompt = "";
        let contentForAI = "";
        let actionTitleForDisplay = actionConfig.title;

        switch (actionConfig.type) {
            case 'full_page_text':
                contentForAI = getPageContentForAI();
                if (!contentForAI) { alert("אין תוכן בדף."); return; }
                fullPrompt = actionConfig.command + contentForAI;
                break;
            case 'prompt_language_page_custom_dialog':
                contentForAI = getPageContentForAI();
                if (!contentForAI) { alert("אין תוכן בדף."); return; }
                const targetLangPage = await showCustomPrompt({
                    title: "תרגום כל הדף",
                    message: "לאיזו שפה לתרגם את כל תוכן הדף הנוכחי?",
                    inputPlaceholder: "לדוגמה: אנגלית, צרפתית"
                });
                if (targetLangPage && targetLangPage.trim() !== "") {
                    fullPrompt = actionConfig.baseCommand.replace('{LANG}', targetLangPage) + contentForAI;
                    actionTitleForDisplay = `תרגום דף ל${targetLangPage}`;
                } else return;
                break;
            default:
                console.warn("FAB action with unhandled type or no command:", actionConfig);
                return;
        }
        if (fullPrompt) {
            await handleTooltipAIAction(fullPrompt, contentForAI, actionTitleForDisplay);
        }
    });
    return button;
}

async function populateFabMenu() {
    if (!fabMenuElement) return;
    fabMenuElement.innerHTML = '';
    const fabActionPromises = [];

    // 1. הוסף "פתח צ'אט AI"
    if (allActionsConfig.open_ai_chat) {
        fabActionPromises.push(createFabMenuItem('open_ai_chat_fab', {
            ...allActionsConfig.open_ai_chat,
            title: "פתח צ'אט AI" // כותרת ספציפית לתפריט ה-FAB
        }));
    }

    // 2. הוסף פאנל "הגדרות"
    if (allActionsConfig.settings_panel) {
        fabActionPromises.push(createFabMenuItem('settings_panel_fab', allActionsConfig.settings_panel));
    }

    // 3. הוסף פעולות נוספות על כל הדף
    Object.values(allActionsConfig).forEach(categoryOrAction => {
        if (categoryOrAction.categoryLabel && categoryOrAction.actions) { // אם זה אובייקט קטגוריה
            categoryOrAction.actions.forEach(actionCfg => {
                if ((actionCfg.type === 'full_page_text' || actionCfg.type === 'prompt_language_page_custom_dialog') &&
                    actionCfg.id !== 'open_ai_chat' && actionCfg.id !== 'settings_panel') { // ודא שלא מוסיפים כפילויות
                    fabActionPromises.push(createFabMenuItem(actionCfg.id + '_fab', actionCfg));
                }
            });
        } else if (categoryOrAction.id && (categoryOrAction.type === 'full_page_text' || categoryOrAction.type === 'prompt_language_page_custom_dialog')) {
            // אם זו פעולה ישירה (לא בתוך קטגוריה)
            if (categoryOrAction.id !== 'open_ai_chat' && categoryOrAction.id !== 'settings_panel') { // ודא שלא מוסיפים כפילויות
                fabActionPromises.push(createFabMenuItem(categoryOrAction.id + '_fab', categoryOrAction));
            }
        }
    });

    const buttons = await Promise.all(fabActionPromises);
    buttons.forEach(button => {
        if (button) fabMenuElement.appendChild(button);
    });
}


function showFabMenu() {
    if (!fabMenuElement || !fabButtonElement) return;
    populateFabMenu(); // קריאה לאכלוס התפריט לפני חישוב מיקום

    const fabRect = fabButtonElement.getBoundingClientRect();
    fabMenuElement.style.display = 'block'; // כדי למדוד את גובהו
    const menuRect = fabMenuElement.getBoundingClientRect();
    fabMenuElement.style.display = ''; // החזר למצב רגיל

    let bottomPosition, topPosition = 'auto';
    let rightPosition = window.innerWidth - fabRect.right;
    let leftPosition = 'auto';

    // בדיקה אם יש מקום מעל ה-FAB
    if (fabRect.top - menuRect.height - 10 > 0) {
        bottomPosition = window.innerHeight - fabRect.top + 10; // 10px מעל הכפתור
    } else { // אם אין מספיק מקום מעל, נסה למקם מתחת
        topPosition = fabRect.bottom + 10;
        // אם גם מתחת חורג מהמסך, נסה להצמיד לקצה העליון של החלון
        if (topPosition + menuRect.height > window.innerHeight) {
            topPosition = '10px'; // 10px מהקצה העליון של החלון
            // במקרה כזה, ייתכן שתפריט יהיה ארוך, אפשר להוסיף max-height ו-overflow ב-CSS
        }
        bottomPosition = 'auto';
    }

    fabMenuElement.style.bottom = bottomPosition !== 'auto' ? `${bottomPosition}px` : 'auto';
    fabMenuElement.style.top = topPosition !== 'auto' ? `${topPosition}px` : 'auto';


    // התאמת מיקום אופקי
    if (rightPosition + menuRect.width > window.innerWidth) { // אם חורג מימין
        leftPosition = fabRect.left - menuRect.width;
        if (leftPosition < 10) { // אם גם חורג משמאל, מקם באמצע
            leftPosition = (window.innerWidth - menuRect.width) / 2;
        }
        rightPosition = 'auto';
    }

    fabMenuElement.style.right = rightPosition !== 'auto' ? `${rightPosition}px` : 'auto';
    fabMenuElement.style.left = leftPosition !== 'auto' ? `${leftPosition}px` : 'auto';

    fabMenuElement.classList.add('visible');
    fabMenuVisible = true;
}


function hideFabMenu() {
    if (!fabMenuElement) return;
    fabMenuElement.classList.remove('visible');
    fabMenuVisible = false;
}

function toggleFabMenu() {
    if (fabMenuVisible) {
        hideFabMenu();
    } else {
        showFabMenu();
    }
}

function createFab() {
    if (document.getElementById(FAB_ID)) return;
    fabButtonElement = document.createElement('button');
    fabButtonElement.id = FAB_ID;
    fabButtonElement.title = "פעולות AI על הדף";
    fabButtonElement.innerHTML = `🧠`;
    fabButtonElement.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFabMenu();
    });
    document.body.appendChild(fabButtonElement);

    fabMenuElement = document.createElement('div');
    fabMenuElement.id = FAB_MENU_ID;
    document.body.appendChild(fabMenuElement);
}

// קריאה ליצירת ה-FAB כשהמסמך מוכן
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    createFab();
} else {
    document.addEventListener('DOMContentLoaded', createFab);
}

// === EVENT LISTENERS ===
document.addEventListener('mouseup', (event) => {
    // סגירת תפריט FAB בלחיצה מחוץ לו
    if (fabMenuVisible && fabMenuElement && !fabMenuElement.contains(event.target) && event.target !== fabButtonElement && !fabButtonElement.contains(event.target)) {
        hideFabMenu();
    }

    // לוגיקה של ה-tooltip
    if (event.target.closest('#ai-text-helper-wrapper') ||
        event.target.closest('.ai-helper-tooltip') ||
        event.target.closest(`#${CHAT_SIDEBAR_ID}`) ||
        event.target.closest('.ai-custom-prompt-overlay') ||
        event.target.matches('input, textarea, [contenteditable="true"]') ||
        event.target.closest(`#${FAB_ID}`) ||
        event.target.closest(`#${FAB_MENU_ID}`)) {
        return;
    }

    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";
    if (selectedText.length > 1 && selectedText.length < 10000) {
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect && (rect.width > 0 || rect.height > 0)) {
                createTooltip(rect.left + rect.width / 2, rect.top, selection);
            } else if (!tooltipActionListVisible) {
                removeTooltip();
            }
        } else if (!tooltipActionListVisible) {
            removeTooltip();
        }
    } else if (!tooltipActionListVisible) {
        removeTooltip();
    }
});

document.addEventListener('mousedown', (event) => {
    if (currentTooltip && !currentTooltip.contains(event.target) &&
        !event.target.closest(`#${CHAT_SIDEBAR_ID}`) &&
        !event.target.closest('.ai-custom-prompt-overlay') &&
        !event.target.closest('#ai-text-helper-wrapper')) {
        removeTooltip();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const customPromptOverlay = document.querySelector('.ai-custom-prompt-overlay.visible');
        if (customPromptOverlay) {
             // אל תעשה כלום, ה-prompt יטפל ב-Escape
            return;
        }
        if (fabMenuVisible) {
            hideFabMenu();
        } else if (currentTooltip) {
            removeTooltip();
        } else if (tooltipAiHelperWrapper && tooltipAiHelperWrapper.innerHTML !== '') {
            tooltipAiHelperWrapper.innerHTML = ''; // מנקה פופאפים של תוצאות AI
        } else if (aiChatSidebarInstance && aiChatSidebarInstance.isOpen()) {
            aiChatSidebarInstance.close();
        }
    }
});

// === AI CHAT SIDEBAR ===
function launchAIChatSidebar() {
    if (aiChatSidebarInstance && aiChatSidebarInstance.isOpen()) {
        aiChatSidebarInstance.close();
        return;
    }
    if (aiChatSidebarInstance) {
        aiChatSidebarInstance.open();
        return;
    }
    aiChatSidebarInstance = (() => {
        let sidebarElement = null;
        let chatTitleEl, clearChatBtnEl, closeChatBtnEl, messagesAreaEl, inputFieldEl, sendBtnEl;
        let chatMessages = [];
        let isLoading = false;
        let _isOpen = false;
        const MAX_HISTORY_MESSAGES_TO_SEND = 10;

        function createSidebarDOM() {
            sidebarElement = document.createElement('aside');
            sidebarElement.id = CHAT_SIDEBAR_ID;
            sidebarElement.innerHTML = `
                <header class="chat-header">
                    <span class="chat-title" id="ai-chat-title">AI Chat</span>
                    <div class="header-controls">
                        <button id="ai-chat-clear-btn" class="chat-control-btn" title="נקה צ'אט">🗑️</button>
                        <button id="ai-chat-close-btn" class="chat-control-btn" title="סגור (Esc)">✖</button>
                    </div>
                </header>
                <main class="chat-main-content">
                    <div class="chat-messages-area" id="ai-chat-messages-area"></div>
                </main>
                <div class="chat-input-container">
                    <textarea class="chat-input-field" id="ai-chat-input-field" placeholder="הקלד הודעה..." rows="1"></textarea>
                    <button class="chat-send-button" id="ai-chat-send-btn" title="שלח">
                        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                    </button>
                </div>
            `;
            document.body.appendChild(sidebarElement);
            chatTitleEl = sidebarElement.querySelector('#ai-chat-title');
            clearChatBtnEl = sidebarElement.querySelector('#ai-chat-clear-btn');
            closeChatBtnEl = sidebarElement.querySelector('#ai-chat-close-btn');
            messagesAreaEl = sidebarElement.querySelector('#ai-chat-messages-area');
            inputFieldEl = sidebarElement.querySelector('#ai-chat-input-field');
            sendBtnEl = sidebarElement.querySelector('#ai-chat-send-btn');
            attachEventListeners();
        }

        function attachEventListeners() {
            closeChatBtnEl.onclick = close;
            clearChatBtnEl.onclick = () => {
                if (messagesAreaEl) messagesAreaEl.innerHTML = '';
                chatMessages = [];
                addMessageToUI("הצ'אט נוקה. איך אפשר לעזור היום?", "assistant", false);
            };
            sendBtnEl.onclick = handleSendMessage;
            inputFieldEl.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
            });
            inputFieldEl.addEventListener('input', autoResizeInput);
        }

        function autoResizeInput() {
            if (!inputFieldEl) return;
            inputFieldEl.style.height = 'auto';
            inputFieldEl.style.height = (Math.min(inputFieldEl.scrollHeight, 120)) + 'px'; // הגבלת גובה מקסימלי
        }

        function setLoadingState(loading) {
            isLoading = loading;
            if (sendBtnEl) sendBtnEl.disabled = loading;
            if (inputFieldEl) inputFieldEl.disabled = loading;

            if (!messagesAreaEl) return;

            let loadingDiv = messagesAreaEl.querySelector('.chat-message.loading');
            if (loading) {
                if (!loadingDiv) {
                    loadingDiv = document.createElement('div');
                    loadingDiv.className = 'chat-message loading';
                    const dots = document.createElement('div');
                    dots.className = 'loading-dots';
                    for (let i = 0; i < 3; i++) dots.appendChild(document.createElement('span'));
                    loadingDiv.appendChild(dots);
                    messagesAreaEl.appendChild(loadingDiv);
                }
                messagesAreaEl.scrollTop = messagesAreaEl.scrollHeight;
            } else if (loadingDiv) {
                loadingDiv.remove();
            }
        }

        function addMessageToHistory(role, content) {
            chatMessages.push({ role, content });
        }

        function addMessageToUI(text, type, addToHistory = true) {
            if (!messagesAreaEl) {
                console.error("addMessageToUI: messagesAreaEl is not defined yet!");
                return;
            }
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${type}`;
            const lines = String(text).split('\n');
            lines.forEach((line, index) => {
                if (index > 0) msgDiv.appendChild(document.createElement('br'));
                const parts = line.split(/\*\*(.*?)\*\*/g); // תמיכה ב-markdown bold
                parts.forEach((part, partIndex) => {
                    if (partIndex % 2 === 1) {
                        const strong = document.createElement('strong');
                        strong.textContent = part;
                        msgDiv.appendChild(strong);
                    } else {
                        msgDiv.appendChild(document.createTextNode(part));
                    }
                });
            });

            const loadingDiv = messagesAreaEl.querySelector('.chat-message.loading');
            if (loadingDiv) {
                messagesAreaEl.insertBefore(msgDiv, loadingDiv);
            } else {
                messagesAreaEl.appendChild(msgDiv);
            }
            messagesAreaEl.scrollTop = messagesAreaEl.scrollHeight;

            if (addToHistory && (type === 'user' || type === 'assistant')) {
                addMessageToHistory(type, text);
            }
        }

        async function sendQueryToAPI() {
            const apiKey = await ensureApiKeyExists(); // בדיקה בכל שליחת הודעה בצ'אט
            if (!apiKey) {
                addMessageToUI("לא הוגדר מפתח API של Gemini. אנא הגדר אותו דרך ההגדרות כדי להשתמש בצ'אט.", 'server-error', false);
                setLoadingState(false);
                return;
            }

            const currentUserInput = inputFieldEl ? inputFieldEl.value.trim() : "";

            if (currentUserInput) {
                addMessageToUI(currentUserInput, 'user');
                if (inputFieldEl) inputFieldEl.value = '';
                autoResizeInput();
            } else if (chatMessages.length === 0) {
                // אל תשלח אם אין קלט והיסטוריה ריקה, פשוט הצג את הודעת הפתיחה (אם לא הוצגה כבר)
                 if (!messagesAreaEl.querySelector('.chat-message.assistant')) {
                    addMessageToUI("שלום! איך אוכל לעזור לך היום?", "assistant", false);
                 }
                return;
            } else if (!currentUserInput && chatMessages.length > 0){
                // אם אין קלט חדש אבל יש היסטוריה, אין מה לשלוח
                setLoadingState(false);
                return;
            }


            setLoadingState(true);
            const messagesForPrompt = chatMessages.slice(-MAX_HISTORY_MESSAGES_TO_SEND);
            let promptString = "";
            messagesForPrompt.forEach(msg => {
                const prefix = msg.role === 'user' ? 'User' : 'AI'; // התאמה אפשרית לפורמט שהמודל מצפה לו
                promptString += `${prefix}: ${msg.content}\n`;
            });

            try {
                const aiReplyText = await sendToGemini(promptString.trim()); // שולחים את כל ההיסטוריה כפרומפט אחד
                addMessageToUI(aiReplyText, 'assistant');
            } catch (e) {
                console.error("AI Chat API Error (Gemini):", e.message);
                // מניעת הצגת הודעות שגיאה כפולות אם אחת כבר קיימת
                if (messagesAreaEl && !messagesAreaEl.querySelector('.chat-message.server-error')) {
                    addMessageToUI(`שגיאה בתקשורת עם Gemini: ${e.message}`, 'server-error', false);
                }
            } finally {
                setLoadingState(false);
                if (inputFieldEl) inputFieldEl.focus();
            }
        }

        function handleSendMessage() {
            sendQueryToAPI();
        }

        function open() {
            if (!sidebarElement) createSidebarDOM();
            requestAnimationFrame(() => {
                if (sidebarElement) sidebarElement.classList.add('open');
            });
            _isOpen = true;
            if (inputFieldEl) inputFieldEl.focus();
            // הצג הודעת פתיחה רק אם הצ'אט ריק לגמרי
            if (chatMessages.length === 0 && messagesAreaEl && messagesAreaEl.children.length === 0) {
                addMessageToUI("שלום! איך אוכל לעזור לך היום?", "assistant", false);
            }
        }

        function close() {
            if (sidebarElement) sidebarElement.classList.remove('open');
            _isOpen = false;
        }

        return {
            open,
            close,
            isOpen: () => _isOpen,
        };
    })();
    aiChatSidebarInstance.open();
}
// === END OF CHAT SIDEBAR CODE ===

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "TOGGLE_AI_CHAT_SIDEBAR") {
        if (!aiChatSidebarInstance) {
            launchAIChatSidebar();
            sendResponse({status: "Sidebar launched and opened"});
        } else if (aiChatSidebarInstance.isOpen()) {
            aiChatSidebarInstance.close();
            sendResponse({status: "Sidebar closed"});
        } else {
            aiChatSidebarInstance.open();
            sendResponse({status: "Sidebar opened"});
        }
        return true; // Indicate that the response will be sent asynchronously (or synchronously here)
    }
});

console.log("AI Suite Pro (Tooltip, Chat, FAB, Custom Dialog) content script loaded.");