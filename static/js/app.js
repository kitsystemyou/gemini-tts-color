/**
 * Gemini TTS Studio - フロントエンド制御スクリプト
 */

document.addEventListener("DOMContentLoaded", () => {
  // アプリケーション状態
  const state = {
    apiKey: localStorage.getItem("gemini_tts_api_key") || "",
    voices: [],
    selectedVoice: "Kore",
    speakerMode: "single", // "single" | "multi"
    multiSpeakers: [
      { speaker: "Speaker 1", voice_name: "Kore" },
      { speaker: "Speaker 2", voice_name: "Puck" }
    ],
    currentAudioData: null, // base64 または blob
    currentAudioUrl: null,
    audioDuration: 0,
    history: JSON.parse(localStorage.getItem("gemini_tts_history") || "[]"),
    audioContext: null,
    audioBuffer: null,
  };

  // DOM 要素の参照
  const elements = {
    // APIキー
    apiKeyInput: document.getElementById("apiKeyInput"),
    toggleKeyVisibilityBtn: document.getElementById("toggleKeyVisibilityBtn"),
    saveKeyBtn: document.getElementById("saveKeyBtn"),
    keyStatusIndicator: document.getElementById("keyStatusIndicator"),

    // モデル
    modelSelect: document.getElementById("modelSelect"),
    customModelInput: document.getElementById("customModelInput"),

    // 話者・音声
    speakerModeTabs: document.getElementById("speakerModeTabs"),
    singleSpeakerSection: document.getElementById("singleSpeakerSection"),
    multiSpeakerSection: document.getElementById("multiSpeakerSection"),
    voiceSearchInput: document.getElementById("voiceSearchInput"),
    voiceCategoryFilter: document.getElementById("voiceCategoryFilter"),
    voiceGridContainer: document.getElementById("voiceGridContainer"),
    selectedVoiceBanner: document.getElementById("selectedVoiceBanner"),
    activeVoiceAvatar: document.getElementById("activeVoiceAvatar"),
    activeVoiceName: document.getElementById("activeVoiceName"),
    activeVoiceDesc: document.getElementById("activeVoiceDesc"),
    speakersList: document.getElementById("speakersList"),
    addSpeakerBtn: document.getElementById("addSpeakerBtn"),

    // ディレクター演出
    directorStyleInput: document.getElementById("directorStyleInput"),
    directorPacingInput: document.getElementById("directorPacingInput"),
    directorAccentInput: document.getElementById("directorAccentInput"),
    sceneInput: document.getElementById("sceneInput"),
    audioProfileInput: document.getElementById("audioProfileInput"),

    // 詳細パラメータ
    languageCodeSelect: document.getElementById("languageCodeSelect"),
    temperatureInput: document.getElementById("temperatureInput"),
    temperatureVal: document.getElementById("temperatureVal"),
    useTopP: document.getElementById("useTopP"),
    topPInput: document.getElementById("topPInput"),
    topPVal: document.getElementById("topPVal"),
    topKInput: document.getElementById("topKInput"),
    seedInput: document.getElementById("seedInput"),
    usePresencePenalty: document.getElementById("usePresencePenalty"),
    presencePenaltyInput: document.getElementById("presencePenaltyInput"),
    presencePenaltyVal: document.getElementById("presencePenaltyVal"),
    useFrequencyPenalty: document.getElementById("useFrequencyPenalty"),
    frequencyPenaltyInput: document.getElementById("frequencyPenaltyInput"),
    frequencyPenaltyVal: document.getElementById("frequencyPenaltyVal"),
    maxTokensInput: document.getElementById("maxTokensInput"),
    systemInstructionInput: document.getElementById("systemInstructionInput"),

    // テキスト入力 & コントロール
    textInput: document.getElementById("textInput"),
    charCount: document.getElementById("charCount"),
    clearTextBtn: document.getElementById("clearTextBtn"),
    generateBtn: document.getElementById("generateBtn"),
    tagsPalette: document.querySelector(".tags-palette"),

    // プレイヤー & 波形
    playerCard: document.getElementById("playerCard"),
    waveformCanvas: document.getElementById("waveformCanvas"),
    audioElement: document.getElementById("audioElement"),
    playPauseBtn: document.getElementById("playPauseBtn"),
    playIcon: document.getElementById("playIcon"),
    pauseIcon: document.getElementById("pauseIcon"),
    stopBtn: document.getElementById("stopBtn"),
    seekBar: document.getElementById("seekBar"),
    currentTimeDisplay: document.getElementById("currentTimeDisplay"),
    totalTimeDisplay: document.getElementById("totalTimeDisplay"),
    playbackSpeedSelect: document.getElementById("playbackSpeedSelect"),
    downloadWavBtn: document.getElementById("downloadWavBtn"),
    sentPromptView: document.getElementById("sentPromptView"),

    // メタバッジ
    badgeModel: document.getElementById("badgeModel"),
    badgeVoice: document.getElementById("badgeVoice"),
    badgeDuration: document.getElementById("badgeDuration"),
    badgeSize: document.getElementById("badgeSize"),

    // 履歴
    historyList: document.getElementById("historyList"),
    clearHistoryBtn: document.getElementById("clearHistoryBtn"),
    toastContainer: document.getElementById("toastContainer"),
  };

  // =========================================================================
  // 初期化フロー
  // =========================================================================
  initApp();

  async function initApp() {
    setupApiKeyUI();
    setupAccordions();
    setupParamListeners();
    setupTextControls();
    setupAudioPlayer();
    setupPresets();
    renderHistory();

    await loadVoices();
    await checkServerStatus();
  }

  // =========================================================================
  // トースト通知ユーティリティ
  // =========================================================================
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // =========================================================================
  // APIキー関連
  // =========================================================================
  function setupApiKeyUI() {
    if (state.apiKey) {
      elements.apiKeyInput.value = state.apiKey;
      elements.keyStatusIndicator.classList.add("valid");
      elements.keyStatusIndicator.title = "ブラウザにAPIキーが保存されています";
    }

    elements.saveKeyBtn.addEventListener("click", () => {
      const val = elements.apiKeyInput.value.trim();
      state.apiKey = val;
      if (val) {
        localStorage.setItem("gemini_tts_api_key", val);
        elements.keyStatusIndicator.classList.add("valid");
        elements.keyStatusIndicator.title = "APIキーを保存しました";
        showToast("APIキーを保存しました", "success");
      } else {
        localStorage.removeItem("gemini_tts_api_key");
        elements.keyStatusIndicator.classList.remove("valid");
        showToast("APIキーを削除しました", "info");
      }
    });

    elements.toggleKeyVisibilityBtn.addEventListener("click", () => {
      const isPass = elements.apiKeyInput.type === "password";
      elements.apiKeyInput.type = isPass ? "text" : "password";
    });
  }

  async function checkServerStatus() {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        if (data.has_server_api_key && !state.apiKey) {
          elements.keyStatusIndicator.classList.add("valid");
          elements.keyStatusIndicator.title = "サーバー側の環境変数 API キーが利用可能です";
          elements.apiKeyInput.placeholder = "サーバー環境変数のAPIキーが利用可能です";
        }
      }
    } catch (e) {
      console.error("サーバー状態チェックエラー:", e);
    }
  }

  // =========================================================================
  // ボイス一覧取得 & レンダリング
  // =========================================================================
  async function loadVoices() {
    try {
      const res = await fetch("/api/voices");
      if (!res.ok) throw new Error("ボイス一覧の取得に失敗しました");
      const data = await res.json();
      state.voices = data.voices || [];
      renderVoiceGrid();
      updateSelectedVoiceUI(state.selectedVoice);
      renderMultiSpeakersList();
    } catch (err) {
      showToast("ボイス一覧の読み込みに失敗しました: " + err.message, "error");
    }
  }

  function renderVoiceGrid() {
    const search = elements.voiceSearchInput.value.toLowerCase().trim();
    const cat = elements.voiceCategoryFilter.value;

    elements.voiceGridContainer.innerHTML = "";

    const filtered = state.voices.filter((v) => {
      const matchCat = cat === "all" || v.category === cat;
      const matchSearch =
        !search ||
        v.name.toLowerCase().includes(search) ||
        v.trait.toLowerCase().includes(search) ||
        v.desc.toLowerCase().includes(search);
      return matchCat && matchSearch;
    });

    filtered.forEach((voice) => {
      const card = document.createElement("div");
      card.className = `voice-card ${voice.name === state.selectedVoice ? "selected" : ""}`;
      card.dataset.voice = voice.name;
      card.innerHTML = `
        <div class="voice-card-name">${voice.name}</div>
        <div class="voice-card-trait">${voice.trait}</div>
        <div class="voice-card-desc" title="${voice.desc}">${voice.desc}</div>
      `;

      card.addEventListener("click", () => {
        state.selectedVoice = voice.name;
        document.querySelectorAll(".voice-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        updateSelectedVoiceUI(voice.name);
      });

      elements.voiceGridContainer.appendChild(card);
    });
  }

  function updateSelectedVoiceUI(voiceName) {
    const v = state.voices.find((item) => item.name === voiceName);
    if (!v) return;
    elements.activeVoiceAvatar.textContent = voiceName.charAt(0);
    elements.activeVoiceName.textContent = `${voiceName} (${v.trait})`;
    elements.activeVoiceDesc.textContent = `${v.desc} / トーン: ${v.category} / 傾向: ${v.gender_hint}`;
  }

  elements.voiceSearchInput.addEventListener("input", renderVoiceGrid);
  elements.voiceCategoryFilter.addEventListener("change", renderVoiceGrid);

  // =========================================================================
  // 話者モード切り替え & 複数話者管理
  // =========================================================================
  elements.speakerModeTabs.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      elements.speakerModeTabs.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.speakerMode = btn.dataset.mode;

      if (state.speakerMode === "single") {
        elements.singleSpeakerSection.classList.remove("hidden");
        elements.multiSpeakerSection.classList.add("hidden");
      } else {
        elements.singleSpeakerSection.classList.add("hidden");
        elements.multiSpeakerSection.classList.remove("hidden");
        renderMultiSpeakersList();
      }
    });
  });

  function renderMultiSpeakersList() {
    elements.speakersList.innerHTML = "";
    state.multiSpeakers.forEach((sp, idx) => {
      const item = document.createElement("div");
      item.className = "speaker-item";

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "form-input form-input-sm";
      nameInput.value = sp.speaker;
      nameInput.placeholder = `話者名 (例: Speaker ${idx + 1})`;
      nameInput.addEventListener("input", (e) => {
        sp.speaker = e.target.value;
      });

      const select = document.createElement("select");
      select.className = "form-select form-select-sm";
      state.voices.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.trait} - ${v.desc})`;
        if (v.name === sp.voice_name) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("change", (e) => {
        sp.voice_name = e.target.value;
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn-ghost btn-sm text-danger";
      delBtn.innerHTML = "&times;";
      delBtn.title = "削除";
      delBtn.addEventListener("click", () => {
        if (state.multiSpeakers.length <= 1) {
          showToast("最低1人の話者が必要です", "info");
          return;
        }
        state.multiSpeakers.splice(idx, 1);
        renderMultiSpeakersList();
      });

      item.appendChild(nameInput);
      item.appendChild(select);
      item.appendChild(delBtn);
      elements.speakersList.appendChild(item);
    });
  }

  elements.addSpeakerBtn.addEventListener("click", () => {
    const nextIdx = state.multiSpeakers.length + 1;
    const defaultVoice = state.voices[nextIdx % state.voices.length]?.name || "Puck";
    state.multiSpeakers.push({
      speaker: `Speaker ${nextIdx}`,
      voice_name: defaultVoice,
    });
    renderMultiSpeakersList();
  });

  // =========================================================================
  // アコーディオン & モデル切り替え
  // =========================================================================
  function setupAccordions() {
    document.querySelectorAll(".accordion-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const targetId = toggle.dataset.target;
        const content = document.getElementById(targetId);
        const arrow = toggle.querySelector(".accordion-arrow");
        if (content.classList.contains("collapsed")) {
          content.classList.remove("collapsed");
          arrow.textContent = "▲";
        } else {
          content.classList.add("collapsed");
          arrow.textContent = "▼";
        }
      });
    });

    elements.modelSelect.addEventListener("change", (e) => {
      if (e.target.value === "__custom__") {
        elements.customModelInput.classList.remove("hidden");
        elements.customModelInput.focus();
      } else {
        elements.customModelInput.classList.add("hidden");
      }
    });
  }

  // =========================================================================
  // パラメータスライダー & リスナー
  // =========================================================================
  function setupParamListeners() {
    elements.temperatureInput.addEventListener("input", (e) => {
      elements.temperatureVal.textContent = parseFloat(e.target.value).toFixed(2);
    });

    elements.topPInput.addEventListener("input", (e) => {
      elements.topPVal.textContent = parseFloat(e.target.value).toFixed(2);
    });
    elements.useTopP.addEventListener("change", (e) => {
      elements.topPVal.textContent = e.target.checked
        ? parseFloat(elements.topPInput.value).toFixed(2)
        : "未指定";
    });

    elements.presencePenaltyInput.addEventListener("input", (e) => {
      elements.presencePenaltyVal.textContent = parseFloat(e.target.value).toFixed(1);
    });
    elements.usePresencePenalty.addEventListener("change", (e) => {
      elements.presencePenaltyVal.textContent = e.target.checked
        ? parseFloat(elements.presencePenaltyInput.value).toFixed(1)
        : "未指定";
    });

    elements.frequencyPenaltyInput.addEventListener("input", (e) => {
      elements.frequencyPenaltyVal.textContent = parseFloat(e.target.value).toFixed(1);
    });
    elements.useFrequencyPenalty.addEventListener("change", (e) => {
      elements.frequencyPenaltyVal.textContent = e.target.checked
        ? parseFloat(elements.frequencyPenaltyInput.value).toFixed(1)
        : "未指定";
    });
  }

  // =========================================================================
  // テキスト入力 & オーディオタグ挿入
  // =========================================================================
  function setupTextControls() {
    elements.textInput.addEventListener("input", () => {
      elements.charCount.textContent = `${elements.textInput.value.length} 文字`;
    });

    elements.clearTextBtn.addEventListener("click", () => {
      elements.textInput.value = "";
      elements.charCount.textContent = "0 文字";
    });

    // オーディオタグ挿入
    elements.tagsPalette.querySelectorAll(".tag-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const tag = pill.dataset.tag;
        insertTextAtCursor(elements.textInput, tag + " ");
        elements.charCount.textContent = `${elements.textInput.value.length} 文字`;
      });
    });
  }

  function insertTextAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    textarea.value = current.substring(0, start) + text + current.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
  }

  // =========================================================================
  // プリセット設定
  // =========================================================================
  function setupPresets() {
    const presets = {
      news: {
        voice: "Charon",
        model: "gemini-3.1-flash-tts-preview",
        mode: "single",
        style: "客観的で明瞭、信頼感のあるニュースキャスター調",
        pacing: "テンポよく安定したニュースアナウンス",
        scene: "報道番組のニュースデスクスタジオ",
        text: "[serious] 今日の主なニュースをお伝えいたします。[short pause] 本日未明、最新のAI音声合成技術が公開され、世界中で大きな注目を集めています。専門家は、「感情表現と発話スピードの制御が格段に向上した」と述べています。",
      },
      energetic: {
        voice: "Zephyr",
        model: "gemini-3.1-flash-tts-preview",
        mode: "single",
        style: "元気いっぱい、笑顔が声にあふれるようなトーン",
        pacing: "軽快で弾むようなリズム",
        scene: "晴れ渡る青空の下のアウトドアイベント会場",
        text: "[excitedly] みなさん、こんにちは！[laughs] 今日も最高の1日が始まりましたね！[short pause] さあ、思いっきり楽しんでいきましょう！[shouting] レッツゴー！",
      },
      podcast: {
        model: "gemini-3.1-flash-tts-preview",
        mode: "multi",
        speakers: [
          { speaker: "Anya", voice_name: "Kore" },
          { speaker: "Liam", voice_name: "Puck" },
        ],
        scene: "カフェの片隅で収録するカジュアルなポッドキャスト",
        text: `Anya: [excitedly] こんにちは、テックトークポッドキャストへようこそ！リアム、今日のテーマは何でしたっけ？\n\nLiam: [laughs] よくぞ聞いてくれました！今日はね、Geminiの新しいTTSモデルについてじっくり語り合いますよ。[whispers] 実はこれ、すごく自然に喋るんですよ。\n\nAnya: 本当にそうですね！[gasp] まるで人間が目の前で話しているみたい！`,
      },
      whisper: {
        voice: "Enceladus",
        model: "gemini-3.1-flash-tts-preview",
        mode: "single",
        style: "静寂を切り裂くような冷徹で囁くような怪談の語り口",
        pacing: "息づかいを強調し、言葉の間に十分な間を取る",
        scene: "深夜1時、街灯の消えた誰もいない古い洋館の廊下",
        text: "[whispers] あなたは...気づいていましたか？[short pause] [sighs] 足音が一つ...増えていることに。[trembling] 振り返ってはいけませんよ...すぐ後ろに...[gasp] います。",
      },
      english: {
        voice: "Puck",
        model: "gemini-3.1-flash-tts-preview",
        mode: "single",
        style: "Bright, engaging, friendly podcast host with British English tone",
        pacing: "Fast-paced, smooth cadence without hesitation",
        scene: "Modern podcast broadcasting studio in London",
        text: "Say cheerfully: [excitedly] Welcome back to the morning show! [laughs] We've got a fantastic lineup for you today. [whispers] Make sure you stay tuned until the very end, because we have a huge announcement coming up!",
      },
    };

    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.preset;
        const p = presets[key];
        if (!p) return;

        elements.textInput.value = p.text;
        elements.charCount.textContent = `${p.text.length} 文字`;

        if (p.model) elements.modelSelect.value = p.model;
        if (p.style) elements.directorStyleInput.value = p.style;
        if (p.pacing) elements.directorPacingInput.value = p.pacing;
        if (p.scene) elements.sceneInput.value = p.scene;

        if (p.mode === "single") {
          elements.speakerModeTabs.querySelector('[data-mode="single"]').click();
          if (p.voice) {
            state.selectedVoice = p.voice;
            updateSelectedVoiceUI(p.voice);
            renderVoiceGrid();
          }
        } else if (p.mode === "multi") {
          elements.speakerModeTabs.querySelector('[data-mode="multi"]').click();
          if (p.speakers) {
            state.multiSpeakers = p.speakers;
            renderMultiSpeakersList();
          }
        }

        showToast(`プリセット「${btn.textContent.trim()}」を適用しました`, "info");
      });
    });
  }

  // =========================================================================
  // 音声生成 (POST /api/tts)
  // =========================================================================
  elements.generateBtn.addEventListener("click", handleGenerateTTS);

  async function handleGenerateTTS() {
    const text = elements.textInput.value.trim();
    if (!text) {
      showToast("読み上げテキストを入力してください", "error");
      elements.textInput.focus();
      return;
    }

    // モデル名決定
    let model = elements.modelSelect.value;
    if (model === "__custom__") {
      model = elements.customModelInput.value.trim() || "gemini-3.1-flash-tts-preview";
    }

    // リクエストペイロード構築
    const payload = {
      text: text,
      model: model,
      is_multi_speaker: state.speakerMode === "multi",
      voice_name: state.selectedVoice,
      speakers: state.speakerMode === "multi" ? state.multiSpeakers : null,
      scene: elements.sceneInput.value.trim() || null,
      audio_profile: elements.audioProfileInput.value.trim() || null,
      director_style: elements.directorStyleInput.value.trim() || null,
      director_pacing: elements.directorPacingInput.value.trim() || null,
      director_accent: elements.directorAccentInput.value.trim() || null,
      system_instruction: elements.systemInstructionInput.value.trim() || null,
      language_code: elements.languageCodeSelect.value || null,
      temperature: parseFloat(elements.temperatureInput.value),
      top_p: elements.useTopP.checked ? parseFloat(elements.topPInput.value) : null,
      top_k: elements.topKInput.value ? parseInt(elements.topKInput.value, 10) : null,
      seed: elements.seedInput.value ? parseInt(elements.seedInput.value, 10) : null,
      presence_penalty: elements.usePresencePenalty.checked ? parseFloat(elements.presencePenaltyInput.value) : null,
      frequency_penalty: elements.useFrequencyPenalty.checked ? parseFloat(elements.frequencyPenaltyInput.value) : null,
      max_output_tokens: elements.maxTokensInput.value ? parseInt(elements.maxTokensInput.value, 10) : null,
    };

    // UI ローディング状態
    setLoading(true);

    try {
      const headers = { "Content-Type": "application/json" };
      if (state.apiKey) {
        headers["X-API-Key"] = state.apiKey;
      }

      const startTime = performance.now();
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      const responseTime = ((performance.now() - startTime) / 1000).toFixed(1);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || "音声生成に失敗しました");
      }

      const data = await res.json();
      handleTTSSuccess(data, payload, responseTime);
    } catch (err) {
      showToast(err.message, "error");
      console.error("TTS生成エラー:", err);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(isLoading) {
    elements.generateBtn.disabled = isLoading;
    const btnText = elements.generateBtn.querySelector(".btn-text");
    const btnSpinner = elements.generateBtn.querySelector(".btn-spinner");
    const btnIcon = elements.generateBtn.querySelector(".btn-icon");

    if (isLoading) {
      btnText.textContent = "音声を生成中...";
      btnSpinner.classList.remove("hidden");
      btnIcon.classList.add("hidden");
    } else {
      btnText.textContent = "音声を生成する";
      btnSpinner.classList.add("hidden");
      btnIcon.classList.remove("hidden");
    }
  }

  function handleTTSSuccess(data, requestPayload, responseTime) {
    showToast(`音声生成完了！ (${responseTime}秒)`, "success");

    // 音声データをプレイヤーにセット
    const wavDataUri = `data:audio/wav;base64,${data.audio_base64}`;
    state.currentAudioData = data.audio_base64;
    state.currentAudioUrl = wavDataUri;
    state.audioDuration = data.duration_seconds;

    // メタバッジ更新
    elements.badgeModel.textContent = `Model: ${data.applied_model}`;
    elements.badgeVoice.textContent = data.applied_voice;
    elements.badgeDuration.textContent = `長さ: ${data.duration_seconds}秒`;
    elements.badgeSize.textContent = `サイズ: ${(data.file_size_bytes / 1024).toFixed(1)} KB`;

    // 送信プロンプト確認
    elements.sentPromptView.textContent = data.full_prompt_sent;

    // オーディオ要素にセット
    elements.audioElement.src = wavDataUri;
    elements.audioElement.load();

    // 波形描画
    drawWaveformFromBase64(data.audio_base64);

    // 自動再生
    elements.audioElement.play().then(() => {
      elements.playIcon.classList.add("hidden");
      elements.pauseIcon.classList.remove("hidden");
    }).catch(() => {
      // 自動再生ポリシー対策
    });

    // 履歴に追加
    addToHistory({
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      text: requestPayload.text,
      model: data.applied_model,
      voice: data.applied_voice,
      duration: data.duration_seconds,
      audioBase64: data.audio_base64,
      payload: requestPayload,
    });
  }

  // =========================================================================
  // オーディオプレイヤー制御 & 波形描画
  // =========================================================================
  function setupAudioPlayer() {
    const audio = elements.audioElement;

    // 再生/一時停止
    elements.playPauseBtn.addEventListener("click", () => {
      if (!audio.src) return;
      if (audio.paused) {
        audio.play();
        elements.playIcon.classList.add("hidden");
        elements.pauseIcon.classList.remove("hidden");
      } else {
        audio.pause();
        elements.playIcon.classList.remove("hidden");
        elements.pauseIcon.classList.add("hidden");
      }
    });

    // 停止
    elements.stopBtn.addEventListener("click", () => {
      if (!audio.src) return;
      audio.pause();
      audio.currentTime = 0;
      elements.playIcon.classList.remove("hidden");
      elements.pauseIcon.classList.add("hidden");
      elements.seekBar.value = 0;
      elements.currentTimeDisplay.textContent = "0:00";
    });

    // 時間更新
    audio.addEventListener("timeupdate", () => {
      if (!audio.duration) return;
      const progress = (audio.currentTime / audio.duration) * 100;
      elements.seekBar.value = progress;
      elements.currentTimeDisplay.textContent = formatTime(audio.currentTime);
      elements.totalTimeDisplay.textContent = formatTime(audio.duration);
    });

    // 再生終了
    audio.addEventListener("ended", () => {
      elements.playIcon.classList.remove("hidden");
      elements.pauseIcon.classList.add("hidden");
      elements.seekBar.value = 0;
      elements.currentTimeDisplay.textContent = "0:00";
    });

    // シークバー操作
    elements.seekBar.addEventListener("input", (e) => {
      if (!audio.duration) return;
      audio.currentTime = (e.target.value / 100) * audio.duration;
    });

    // 再生速度切り替え
    elements.playbackSpeedSelect.addEventListener("change", (e) => {
      audio.playbackRate = parseFloat(e.target.value);
    });

    // WAV ダウンロード
    elements.downloadWavBtn.addEventListener("click", () => {
      if (!state.currentAudioData) {
        showToast("ダウンロード可能な音声がありません", "info");
        return;
      }
      downloadCurrentWav();
    });
  }

  function downloadCurrentWav(customFilename = null) {
    const filename = customFilename || `gemini_tts_${new Date().toISOString().replace(/[:.]/g, "-")}.wav`;
    const byteCharacters = atob(state.currentAudioData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    showToast(`WAV ファイルをダウンロードしました: ${filename}`, "success");
  }

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  }

  // =========================================================================
  // 波形描画 (Waveform Visualizer)
  // =========================================================================
  async function drawWaveformFromBase64(b64) {
    const canvas = elements.waveformCanvas;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    try {
      if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      const binaryStr = atob(b64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const decodedBuffer = await state.audioContext.decodeAudioData(bytes.buffer.slice(0));
      const channelData = decodedBuffer.getChannelData(0);
      const step = Math.ceil(channelData.length / width);
      const amp = height / 2;

      // グラデーション背景とバー描画
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#06b6d4");
      gradient.addColorStop(0.5, "#8b5cf6");
      gradient.addColorStop(1, "#ec4899");

      ctx.fillStyle = gradient;

      for (let i = 0; i < width; i += 3) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
          const datum = channelData[i * step + j];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }

        const barHeight = Math.max(2, (max - min) * amp * 0.9);
        const y = amp - barHeight / 2;
        ctx.fillRect(i, y, 2, barHeight);
      }
    } catch (e) {
      console.warn("波形生成のフォールバック:", e);
      // フォールバックの簡易描画
      ctx.fillStyle = "#8b5cf6";
      ctx.fillRect(0, height / 2 - 1, width, 2);
    }
  }

  // =========================================================================
  // 履歴管理
  // =========================================================================
  function addToHistory(entry) {
    state.history.unshift(entry);
    // 最大20件保持
    if (state.history.length > 20) {
      state.history.pop();
    }
    localStorage.setItem("gemini_tts_history", JSON.stringify(state.history));
    renderHistory();
  }

  function renderHistory() {
    elements.historyList.innerHTML = "";
    if (state.history.length === 0) {
      elements.historyList.innerHTML = `
        <div class="empty-state">まだ音声の生成履歴がありません。上の入力欄からテキストを入力して生成してみてください。</div>
      `;
      return;
    }

    state.history.forEach((item) => {
      const el = document.createElement("div");
      el.className = "history-item";
      el.innerHTML = `
        <div class="history-info">
          <div class="history-text" title="${item.text}">${item.text}</div>
          <div class="history-meta">
            <span>⏱️ ${item.timestamp}</span>
            <span>🎙️ ${item.voice}</span>
            <span>⏱️ ${item.duration}s</span>
          </div>
        </div>
        <div class="history-actions">
          <button type="button" class="btn btn-secondary btn-sm play-hist-btn" title="再生">▶ 再生</button>
          <button type="button" class="btn btn-secondary btn-sm dl-hist-btn" title="ダウンロード">💾</button>
          <button type="button" class="btn btn-ghost btn-sm restore-hist-btn" title="設定を復元">↺ 復元</button>
        </div>
      `;

      // 再生ボタン
      el.querySelector(".play-hist-btn").addEventListener("click", () => {
        const url = `data:audio/wav;base64,${item.audioBase64}`;
        state.currentAudioData = item.audioBase64;
        state.currentAudioUrl = url;
        state.audioDuration = item.duration;

        elements.badgeModel.textContent = `Model: ${item.model}`;
        elements.badgeVoice.textContent = item.voice;
        elements.badgeDuration.textContent = `長さ: ${item.duration}秒`;

        elements.audioElement.src = url;
        elements.audioElement.play();
        elements.playIcon.classList.add("hidden");
        elements.pauseIcon.classList.remove("hidden");
        drawWaveformFromBase64(item.audioBase64);
        elements.playerCard.scrollIntoView({ behavior: "smooth" });
      });

      // ダウンロードボタン
      el.querySelector(".dl-hist-btn").addEventListener("click", () => {
        state.currentAudioData = item.audioBase64;
        downloadCurrentWav(`gemini_tts_${item.id}.wav`);
      });

      // 復元ボタン
      el.querySelector(".restore-hist-btn").addEventListener("click", () => {
        elements.textInput.value = item.text;
        elements.charCount.textContent = `${item.text.length} 文字`;
        if (item.payload) {
          if (item.payload.director_style) elements.directorStyleInput.value = item.payload.director_style;
          if (item.payload.director_pacing) elements.directorPacingInput.value = item.payload.director_pacing;
          if (item.payload.scene) elements.sceneInput.value = item.payload.scene;
        }
        showToast("履歴からテキストと設定を復元しました", "info");
      });

      elements.historyList.appendChild(el);
    });
  }

  elements.clearHistoryBtn.addEventListener("click", () => {
    if (confirm("生成履歴をすべて消去しますか？")) {
      state.history = [];
      localStorage.removeItem("gemini_tts_history");
      renderHistory();
      showToast("履歴を消去しました", "info");
    }
  });
});
