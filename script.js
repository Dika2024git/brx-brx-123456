document.addEventListener("DOMContentLoaded", () => {
  /**
 * Variabel untuk menyimpan riwayat percakapan dalam sesi saat ini.
 * Ini memungkinkan AI untuk "mengingat" pesan-pesan sebelumnya.
 */
let conversationHistory = [];
// Batasi riwayat hingga 10 pesan terakhir (5 giliran percakapan) untuk efisiensi.
const MAX_HISTORY_LENGTH = 20;

  // URL untuk avatar bot. Ganti dengan URL gambar avatar Anda.
const botAvatarUrl = './web-app-manifest-512x512.png';

let systemConfig = {}; // Variabel global untuk menyimpan konfigurasi

// --- FITUR MODE MAINTENANCE (Tambahkan di bagian atas script.js) ---
    async function checkMaintenanceStatus() {
        try {
            // Cek kunci akses di URL untuk bypass
            const urlParams = new URLSearchParams(window.location.search);
            const accessKey = urlParams.get('access');

            // Ambil konfigurasi dari file system.json
            // `cache: 'no-store'` memastikan file selalu diambil dari server
            const response = await fetch('system.json', { cache: 'no-store' });

            if (!response.ok) {
                console.log('File system.json tidak ditemukan, melanjutkan secara normal.');
                return; // Jika file tidak ada, anggap maintenance off
            }

            const config = await response.json();
            systemConfig = config; // <-- TAMBAHKAN BARIS INI

            // Tampilkan overlay jika maintenance mode aktif DAN kunci akses tidak cocok
            if (config.maintenance_mode && accessKey !== config.allow_access_key) {
                showMaintenanceOverlay(config.maintenance_message);
            }

        } catch (error) {
            console.error('Gagal memeriksa status maintenance:', error);
            // Jika ada error (misal: JSON tidak valid), anggap tidak maintenance
        }
    }

    function showMaintenanceOverlay(message) {
        // Hentikan interaksi scroll pada halaman utama
        document.documentElement.style.overflow = 'hidden';

        const overlayId = 'maintenance-overlay-container';
        if (document.getElementById(overlayId)) return; // Cegah duplikasi

        const overlayContainer = document.createElement('div');
        overlayContainer.id = overlayId;

        // Terapkan style langsung ke elemen untuk memastikan prioritas tertinggi
        Object.assign(overlayContainer.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100vh',
            backgroundColor: 'rgba(20, 20, 25, 0.98)',
            color: '#E0E0E0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '999999',
            fontFamily: `'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`,
            textAlign: 'center',
            padding: '20px',
            flexDirection: 'column',
            backdropFilter: 'blur(5px)' // Efek blur untuk background
        });
        
        // Isi konten dari overlay
        overlayContainer.innerHTML = `
            <div style="max-width: 600px; animation: fadeIn 0.5s ease-in-out;">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 20px;">
                    <path d="M16.604 9.22238C17.0624 8.76402 17.0624 8.01428 16.604 7.55592C16.1457 7.09756 15.3959 7.09756 14.9375 7.55592L12 10.4935L9.06253 7.55592C8.60417 7.09756 7.85443 7.09756 7.39607 7.55592C6.93771 8.01428 6.93771 8.76402 7.39607 9.22238L10.3336 12.16L7.39607 15.0975C6.93771 15.5558 6.93771 16.3056 7.39607 16.7639C7.85443 17.2223 8.60417 17.2223 9.06253 16.7639L12 13.8264L14.9375 16.7639C15.3959 17.2223 16.1457 17.2223 16.604 16.7639C17.0624 16.3056 17.0624 15.5558 16.604 15.0975L13.6665 12.16L16.604 9.22238Z" fill="#FFB74D"></path>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z" fill="#FFB74D"></path>
                </svg>
                <h1 style="color: #FFFFFF; margin-top: 10px; margin-bottom: 15px; font-size: 2em; font-weight: 600;">Segera Kembali</h1>
                <p style="font-size: 1.1em; line-height: 1.6; opacity: 0.9;">${message || 'Situs sedang dalam perbaikan. Mohon kembali lagi nanti.'}</p>
            </div>
            <style> @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } </style>
        `;

        // Tambahkan overlay ke body
        document.body.appendChild(overlayContainer);
    }

    // Panggil fungsi pengecekan saat DOM siap
    checkMaintenanceStatus();
    // --- AKHIR DARI KODE FITUR MODE MAINTENANCE ---
    
  // Variabel untuk sistem feedback periodik
let messageCounter = 0;
const minMessages = 2;
const maxMessages = 4;
let messagesUntilFeedback = Math.floor(Math.random() * (maxMessages - minMessages + 1)) + minMessages;

/**
 * Mereset penghitung pesan dan mengacak target baru untuk siklus berikutnya.
 */
function resetFeedbackCycle() {
  messageCounter = 0; // Reset penghitung ke nol
  // Acak lagi target untuk kemunculan berikutnya
  messagesUntilFeedback = Math.floor(Math.random() * (maxMessages - minMessages + 1)) + minMessages;
  console.log(`Siklus feedback direset. Prompt berikutnya akan muncul dalam ${messagesUntilFeedback} pesan.`);
}

/**
 * Menambah hitungan pesan dan memicu prompt secara acak jika target tercapai.
 */
function checkMessageCount() {
  messageCounter++;
  console.log(`Pesan ke-${messageCounter} (Target: ${messagesUntilFeedback})`);

  // Jika jumlah pesan sudah mencapai target
  if (messageCounter >= messagesUntilFeedback) {
    const showDelay = 1500; // Jeda agar tidak muncul tiba-tiba

    // Pilih secara acak (50/50) kotak mana yang akan ditampilkan
    if (Math.random() < 0.5) {
      setTimeout(showLikeDislikePrompt, showDelay);
    } else {
      setTimeout(showFeedbackPrompt, showDelay);
    }
  }
}

/**
 * Menampilkan kotak rating Suka/Tidak Suka.
 */
function showLikeDislikePrompt() {
  if (document.querySelector('.like-dislike-prompt')) return;

  const promptContainer = document.createElement('div');
  promptContainer.className = 'like-dislike-prompt';
  promptContainer.innerHTML = `
      <p>Apakah percakapan ini membantu?</p>
      <div class="like-dislike-actions">
          <button data-choice="like" title="Suka"><i class="far fa-thumbs-up"></i></button>
          <button data-choice="dislike" title="Tidak Suka"><i class="far fa-thumbs-down"></i></button>
      </div>
  `;
  chatBox.appendChild(promptContainer);
  scrollToBottom();

  promptContainer.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
          console.log(`Pilihan rating: ${button.dataset.choice}`);
          promptContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
          button.classList.add('selected');

          setTimeout(() => {
              promptContainer.innerHTML = `<p>Terima kasih atas masukan Anda!</p>`;
              setTimeout(() => {
                  promptContainer.remove();
                  resetFeedbackCycle(); // Panggil reset di sini
              }, 1200);
          }, 800);
      });
  });
}

/**
 * Menampilkan kotak prompt untuk meminta feedback atau survei.
 */
function showFeedbackPrompt() {
  if (document.getElementById('feedback-prompt-container')) return;

  const feedbackContainer = document.createElement('div');
  feedbackContainer.id = 'feedback-prompt-container';
  feedbackContainer.innerHTML = `
      <div class="feedback-prompt-content">
          <button class="feedback-prompt-close">&times;</button>
          <p><strong>Bantu kami jadi lebih baik!</strong></p>
          <p>Bagaimana pengalaman Anda sejauh ini? Beri kami masukan.</p>
          <div class="feedback-prompt-actions">
              <button class="feedback-prompt-btn survey">Isi Survei</button>
              <button class="feedback-prompt-btn later">Nanti Saja</button>
          </div>
      </div>
  `;
  chatBox.appendChild(feedbackContainer);
  scrollToBottom();

  const closePrompt = () => {
      feedbackContainer.remove();
      resetFeedbackCycle(); // Panggil fungsi reset yang terpusat
  };

  feedbackContainer.querySelector('.feedback-prompt-close').addEventListener('click', closePrompt);
  feedbackContainer.querySelector('.later').addEventListener('click', closePrompt);
  feedbackContainer.querySelector('.survey').addEventListener('click', () => {
      window.open('https://forms.gle/v1Y8G1S2pZ3t4qA57', '_blank');
      closePrompt();
  });
}

  // --- TUTORIAL FITUR V7 (PENEMPATAN & VISIBILITAS FINAL) ---
    const TutorialManagerV7 = {
        isInitialized: false,
        currentStepIndex: 0,
        popperInstance: null,
        elements: {},
        steps: [
            { text: "Selamat datang di BroRAX AI! 👋 Ikuti tur singkat ini untuk mengenal fitur-fitur utama." },
            { element: '#userInput', text: 'Ketik pesan atau pertanyaanmu di sini. BroRAX bisa menjawab apa saja, dari yang santai hingga teknis.', shape: 'rect' },
            { element: '#sendBtn', text: 'Klik tombol ini atau tekan "Enter" untuk mengirim pesanmu.', shape: 'circle' },
            { element: '#suggestion-btn', text: 'Bingung mau tanya apa? Klik ikon ini untuk mendapatkan saran prompt yang menarik!', shape: 'circle' },
            { element: '#menu-toggle', text: 'Akses menu lainnya, seperti menghapus riwayat chat atau info tentang kami di sini.', shape: 'circle' },
            { text: 'Kamu siap! Sekarang, silakan mulai percakapanmu. Selamat mencoba!' }
        ],

        init() {
            if (this.isInitialized || localStorage.getItem('tutorialShown_v7') === 'true') return;
            if (typeof Popper === 'undefined') {
                console.error("Tutorial membutuhkan Popper.js, tetapi tidak ditemukan.");
                return;
            }
            this.createDOMElements();
            this.bindEvents();
            this.isInitialized = true;
            setTimeout(() => this.showStep(0), 500);
        },

        createDOMElements() {
            const svgNS = "http://www.w3.org/2000/svg";
            const overlay = document.createElementNS(svgNS, 'svg');
            overlay.classList.add('tutorial-v7-overlay');
            overlay.appendChild(document.createElementNS(svgNS, 'path'));

            const tooltip = document.createElement('div');
            tooltip.className = 'tutorial-v7-tooltip';
            tooltip.innerHTML = `
                <div data-popper-arrow class="tutorial-v7-arrow"></div>
                <div class="tutorial-v7-body"><div class="tutorial-v7-text"></div></div>
                <div class="tutorial-v7-footer">
                    <div class="tutorial-v7-progress-bar"><div class="tutorial-v7-progress-fill"></div></div>
                    <div class="tutorial-v7-navigation">
                        <button class="tutorial-v7-btn prev" title="Sebelumnya"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                        <span class="tutorial-v7-counter"></span>
                        <button class="tutorial-v7-btn next" title="Berikutnya">
                            <span>Berikutnya</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>
                </div>
            `;
            document.body.append(overlay, tooltip);
            this.elements = {
                overlay, path: overlay.querySelector('path'), tooltip,
                text: tooltip.querySelector('.tutorial-v7-text'),
                prevBtn: tooltip.querySelector('.tutorial-v7-btn.prev'),
                nextBtn: tooltip.querySelector('.tutorial-v7-btn.next'),
                nextBtnText: tooltip.querySelector('.tutorial-v7-btn.next span'),
                counter: tooltip.querySelector('.tutorial-v7-counter'),
                progressFill: tooltip.querySelector('.tutorial-v7-progress-fill'),
                arrow: tooltip.querySelector('.tutorial-v7-arrow'),
            };
        },
        
        debounce(func, delay = 100) {
            let timeout;
            return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); };
        },

        bindEvents() {
            this.elements.nextBtn.addEventListener('click', () => this.showStep(this.currentStepIndex + 1));
            this.elements.prevBtn.addEventListener('click', () => this.showStep(this.currentStepIndex - 1));
            this.elements.overlay.addEventListener('click', (e) => {
                if(e.target === this.elements.overlay) this.end();
            });
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.elements.overlay.classList.contains('visible')) this.end();
            });
            window.addEventListener('resize', this.debounce(() => this.updateActiveStep()));
        },
        
        updateActiveStep() {
            const step = this.steps[this.currentStepIndex];
            const targetElement = step.element ? document.querySelector(step.element) : null;
            this.updateSpotlight(targetElement, step.shape);
            if(this.popperInstance) this.popperInstance.update();
        },

        async showStep(index) {
            if (index < 0 || index >= this.steps.length) return this.end();
            this.currentStepIndex = index;
            const step = this.steps[index];
            const { tooltip, text, counter, prevBtn, nextBtn, nextBtnText, progressFill } = this.elements;
            
            tooltip.classList.remove('visible');
            if (this.popperInstance) this.popperInstance.destroy();

            text.innerHTML = step.text;
            counter.textContent = `${index + 1} / ${this.steps.length}`;
            prevBtn.classList.toggle('hidden', index === 0);
            nextBtnText.textContent = (index === this.steps.length - 1) ? 'Selesai' : 'Berikutnya';
            progressFill.style.width = `${((index) / (this.steps.length - 1)) * 100}%`;

            const targetElement = step.element ? document.querySelector(step.element) : null;
            this.updateSpotlight(targetElement, step.shape);

            if (targetElement) {
                await new Promise(resolve => {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    setTimeout(resolve, 450);
                });
                
                this.popperInstance = Popper.createPopper(targetElement, tooltip, {
                    placement: 'auto', // Biarkan Popper memilih antara atas/bawah
                    modifiers: [
                        { name: 'offset', options: { offset: [0, 16] } },
                        { 
                            name: 'flip', 
                            options: { 
                                fallbackPlacements: ['top', 'bottom'], // Prioritaskan atas/bawah
                                padding: 10,
                            },
                        },
                        { 
                            name: 'preventOverflow', 
                            options: { 
                                padding: 10, // Jarak dari tepi layar
                            },
                        },
                        { name: 'arrow', options: { element: this.elements.arrow, padding: 10 } }
                    ],
                });
            } else {
                tooltip.style.position = 'fixed';
                tooltip.style.top = '50%';
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translate(-50%, -50%)';
            }
            tooltip.classList.add('visible');
        },
        
        updateSpotlight(element, shape = 'rect') {
            const { overlay, path } = this.elements;
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            overlay.setAttribute('viewBox', `0 0 ${screenW} ${screenH}`);
            overlay.classList.toggle('visible', !!element);

            let pathData = `M0,0 H${screenW} V${screenH} H0Z`;
            if (element) {
                const rect = element.getBoundingClientRect();
                if(shape === 'circle') {
                    const r = Math.max(rect.width, rect.height) / 2 + 8;
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    pathData += ` M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 -${r * 2},0 Z`;
                } else {
                    const padding = 6;
                    const r = parseFloat(window.getComputedStyle(element).borderRadius) || 12;
                    const x = rect.left - padding;
                    const y = rect.top - padding;
                    const w = rect.width + 2 * padding;
                    const h = rect.height + 2 * padding;
                    pathData += ` M${x},${y+r} q0,-${r} ${r},-${r} h${w-2*r} q${r},0 ${r},${r} v${h-2*r} q0,${r} -${r},${r} h-${w-2*r} q-${r},0 -${r},-${r} Z`;
                }
            }
            path.setAttribute('d', pathData);
        },

        end() {
            this.elements.overlay.classList.remove('visible');
            this.elements.tooltip.classList.remove('visible');
            localStorage.setItem('tutorialShown_v7', 'true');
            setTimeout(() => {
                this.elements.overlay.remove();
                this.elements.tooltip.remove();
            }, 400);
        }
    };

    TutorialManagerV7.init();
    // --- AKHIR TUTORIAL FITUR V7 ---

    // ... (sisa kode JavaScript Anda yang lain) ...
    
  // --- KODE BARU: Fungsionalitas untuk tombol saran ---
  const suggestionBtn = document.getElementById('suggestion-btn');

  if (suggestionBtn) {
    async function handleSuggestionClick() {
        // 1. Tampilkan status loading pada tombol
        suggestionBtn.disabled = true;
        suggestionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        const backendUrl = 'https://api.siputzx.my.id/api/ai/gpt3';
        const url = new URL(backendUrl);
        const suggestionPrompt = "Bro, gue lagi butuh satu pertanyaan yang gak masuk akal, tapi kocaknya gak ketolong — yang bisa gue tembak ke AI kayak ngirim stiker “hehe” jam 3 pagi, biar dia mikir keras sampe kepanasan, nge-freeze, terus garuk-garuk script sendiri. Gak usah dibumbu-bumbuin kata pembuka, langsung to the point, bebas mau lucu, ngawur, absurd, asal cukup brutal buat bikin dia nanya ke dirinya sendiri, “Gue tuh siapa, gue tuh kenapa?”";
        
        url.searchParams.append('prompt', SYSTEM_INSTRUCTION);
        url.searchParams.append('content', suggestionPrompt);

        try {
            const response = await fetch(url, { method: "GET" });
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            
            const data = await response.json();
            let suggestion = data.data ? data.data.trim() : "Coba tanya, apa itu lubang hitam?";

            if (suggestion.startsWith('"') && suggestion.endsWith('"')) {
                suggestion = suggestion.substring(1, suggestion.length - 1);
            }

            input.value = suggestion;
            btn.disabled = false;
            input.focus();

        } catch (error) {
            console.error("Gagal mengambil saran prompt:", error);
            alert("Maaf, terjadi kesalahan saat mengambil saran. Coba lagi nanti.");
        } finally {
            // 2. Kembalikan tombol ke keadaan semula
            suggestionBtn.disabled = false;
            suggestionBtn.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span>';
        }
    }

    // Tambahkan event listener ke tombol saran
    suggestionBtn.addEventListener('click', handleSuggestionClick);
  }
  // --- AKHIR DARI KODE BARU ---
  
// --- KONFIGURASI MARKED.JS (DENGAN PENGAWASAN TIPE DATA) ---
if (typeof marked !== 'undefined' && typeof Prism !== 'undefined') {
  const renderer = new marked.Renderer();

  // Timpa metode 'code' untuk kontrol penuh dan keamanan ekstra
  renderer.code = (code, infostring) => {
    let codeToHighlight = code;
    let lang = ((infostring || '').match(/\S*/) || [])[0] || 'clike';

    // --- PENGAWASAN CERDAS ---
    // Cek jika 'code' yang masuk adalah sebuah objek (penyebab [object Object])
    if (typeof codeToHighlight === 'object' && codeToHighlight !== null) {
      // Jika ya, ubah menjadi teks JSON yang rapi
      codeToHighlight = JSON.stringify(codeToHighlight, null, 2);
      lang = 'json'; // Paksa bahasa menjadi 'json' untuk pewarnaan yang benar
    } else {
      // Jika bukan objek, pastikan ia adalah string untuk keamanan
      codeToHighlight = String(codeToHighlight || '');
    }
    // --- AKHIR PENGAWASAN ---

    const langExists = Prism.languages[lang];

    // Lakukan highlighting dengan data yang sudah dijamin aman
    const highlightedCode = langExists
      ? Prism.highlight(codeToHighlight, Prism.languages[lang], lang)
      : codeToHighlight.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const langToDisplay = langExists ? lang : 'plaintext';

    const header = `
      <div class="code-block-header">
        <span class="language-name">${langToDisplay}</span>
        <button class="copy-code-btn" title="Salin kode">
          <i class="far fa-copy"></i> Salin
        </button>
      </div>
    `;

    return `
      <div class="code-block-wrapper">
        ${header}
        <pre class="language-${langToDisplay}"><code class="language-${langToDisplay}">${highlightedCode}</code></pre>
      </div>
    `;
  };

  // Terapkan renderer yang sudah disempurnakan
  marked.setOptions({
    renderer: renderer,
    gfm: true,
    breaks: true,
  });
}
  
  const input = document.getElementById("userInput");
  const btn = document.getElementById("sendBtn");
  const chatBox = document.getElementById("chatBox");
  const deleteBtn = document.getElementById("deleteBtn");
  const currentTimeElement = document.getElementById('current-time');

  // --- PERUBAHAN BARU: Variabel untuk mengontrol animasi typewriter ---
  let isTyping = false;
  let typewriterControl = {
    stop: () => {}, // Fungsi ini akan diisi oleh typewriter saat berjalan
  };
  let fetchController = null; // <-- TAMBAHKAN VARIABEL INI
  
  const fiturSaatIni = {
        version: '0.9.4',
        items: [
            {
                icon: 'fa-bolt',
                title: 'Performa Ditingkatkan',
                description: 'Waktu respons chatbot kini lebih cepat hingga 30%.'
            },
            {
                icon: 'fa-palette',
                title: 'Peningkatan Warna',
                description: 'Tampilan visual kini lebih hidup dengan warna yang lebih tajam dan adaptif terhadap tema terang maupun gelap.'
            },
            {
                icon: 'fa-bug',
                title: 'Bug Dihilangkan, Performa Ditingkatkan',
                description: 'Masalah teknis telah ditangani dan sistem kini lebih andal, aman, dan siap untuk penggunaan maksimal.'
            },
            {
                icon: 'fa-layer-group',
                title: 'Tata Letak Lebih Rapi & Elegan',
                description: 'Struktur tampilan kini lebih bersih dan profesional untuk pengalaman yang lebih nyaman.'
            },
            {
                icon: 'fa-image',
                title: 'Logo Baru, Identitas Baru',
                description: 'Kami hadir dengan logo baru yang lebih segar dan modern untuk mencerminkan visi dan karakter brand kami ke depan.'
            },
            {
                icon: 'fa-hand-pointer',
                title: 'Fitur Baru: Menu Konteks',
                description: 'Klik kanan kini lebih berguna! Kami menambahkan menu konteks interaktif untuk mempercepat akses ke fungsi penting.'
            }
        ]
    };
    
  let SYSTEM_INSTRUCTION = ''; // Variabel untuk menyimpan instruksi sistem dari file JSON

    // --- FUNGSI BARU UNTUK MEMUAT INSTRUKSI SISTEM ---
    async function loadSystemInstruction() {
        try {
            // Ambil instruksi dari file system_instruction.json
            const response = await fetch('system_instruction.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error('File system_instruction.json tidak ditemukan.');
            }
            const data = await response.json();
            if (data && data.instruction) {
                SYSTEM_INSTRUCTION = data.instruction;
                console.log('Instruksi sistem berhasil dimuat.');
            } else {
                 throw new Error('Format system_instruction.json tidak valid.');
            }
        } catch (error) {
            console.error('Gagal memuat instruksi sistem:', error);
            // Fallback sederhana jika file gagal dimuat
            SYSTEM_INSTRUCTION = 'Anda adalah asisten AI yang siap membantu.';
            alert('Gagal memuat konfigurasi inti AI. Fungsi mungkin terbatas.');
        }
    }
    
    // Panggil fungsi pengecekan saat DOM siap
    loadSystemInstruction(); // <-- Panggil fungsi baru untuk memuat instruksi
    // --- AKHIR DARI KODE FITUR MODE MAINTENANCE ---

  const optionButtons = document.querySelectorAll(".chatbot-options button");
  const optionsContainer = document.querySelector(".chatbot-options");
  const initialText = document.getElementById('noneteks');

  optionButtons.forEach(button => {
    button.addEventListener("click", () => {
      const buttonText = button.innerText;
      input.value = buttonText;
      btn.disabled = false;
      handleSendMessage();
      if (optionsContainer) {
        optionsContainer.style.display = 'none';
      }
      if (initialText) {
        initialText.style.display = 'none';
      }
    });
  });

  chatBox.addEventListener('click', (e) => {
    const target = e.target;
    const messageWrapper = target.closest('.message');
    if (!messageWrapper) return;

    if (target.classList.contains('copy-icon')) {
      const messageContent = messageWrapper.querySelector('.message-text').innerText;
      navigator.clipboard.writeText(messageContent).then(() => {
        target.classList.remove('fa-copy');
        target.classList.add('fa-check');
        target.title = 'Tersalin!';
        setTimeout(() => {
          target.classList.remove('fa-check');
          target.classList.add('fa-copy');
          target.title = 'Salin pesan';
        }, 2000);
      }).catch(err => console.error('Gagal menyalin teks:', err));
    }
    
// Ganti blok if untuk '.copy-code-btn' dengan yang ini
if (target.matches('.copy-code-btn')) {
  const wrapper = target.closest('.code-block-wrapper');
  const codeToCopy = wrapper.querySelector('code').innerText;

  // Nonaktifkan tombol sementara untuk mencegah klik ganda
  target.disabled = true;

  navigator.clipboard.writeText(codeToCopy).then(() => {
    // Jika berhasil
    target.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
    setTimeout(() => {
      target.innerHTML = '<i class="far fa-copy"></i> Salin';
      target.disabled = false; // Aktifkan kembali
    }, 2000);
  }).catch(err => {
    // Jika gagal (misalnya karena izin ditolak)
    target.innerHTML = 'Gagal!';
    console.error('Gagal menyalin kode:', err);
    setTimeout(() => {
      target.innerHTML = '<i class="far fa-copy"></i> Salin';
      target.disabled = false; // Aktifkan kembali
    }, 2000);
  });
}

    // --- FITUR BARU: Bagikan/Ekspor Chat ---
    if (target.classList.contains('share-icon')) {
        // Fungsi ini akan menangani logika untuk membagikan chat
        handleShareChat(messageWrapper);
    }
    
    // --- FITUR EDIT PESAN YANG DISEMPURNAKAN ---
// Letakkan event listener ini di dalam event listener utama 'chatBox.addEventListener('click', (e) => { ... });'

// Memicu mode edit saat ikon edit diklik
if (target.matches('.edit-icon, .edit-icon *')) {
    const messageTextElement = messageWrapper.querySelector('.message-text');
    // Mencegah mode edit ganda pada pesan yang sama
    if (messageWrapper.classList.contains('is-editing')) return;

    messageWrapper.classList.add('is-editing');
    const currentText = messageTextElement.innerText;

    // Simpan teks asli untuk pembatalan
    messageWrapper.setAttribute('data-original-text', currentText);

    // Sembunyikan teks asli dan buat area edit
    messageTextElement.style.display = 'none';
    messageWrapper.querySelector('.message-meta').style.display = 'none';

    const editContainer = document.createElement('div');
    editContainer.className = 'edit-container';
    editContainer.innerHTML = `
      <textarea class="edit-textarea"></textarea>
      <div class="edit-controls">
        <button class="cancel-edit-btn">Batal</button>
        <button class="save-edit-btn">
          <i class="fas fa-save"></i> Simpan & Kirim Ulang
        </button>
      </div>
    `;
    // Sisipkan area edit setelah elemen teks
    messageTextElement.parentNode.insertBefore(editContainer, messageTextElement.nextSibling);

    const textarea = editContainer.querySelector('.edit-textarea');
    textarea.value = currentText;
    textarea.focus();
    // Atur tinggi textarea agar sesuai dengan konten
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    });
}

// Aksi saat tombol "Simpan & Kirim Ulang" diklik
if (target.matches('.save-edit-btn, .save-edit-btn *')) {
    const newText = messageWrapper.querySelector('.edit-textarea').value.trim();

    if (newText) {
        // 1. Temukan dan hapus respons bot berikutnya (jika ada)
        const nextBotMessage = messageWrapper.nextElementSibling;
        if (nextBotMessage && nextBotMessage.classList.contains('bot')) {
            nextBotMessage.remove();
        }

        // 2. Hapus pesan pengguna yang asli (yang sedang diedit)
        messageWrapper.remove();

        // 3. Simpan riwayat chat yang sudah diperbarui
        saveChatHistory();

        // 4. Masukkan teks yang sudah diedit ke input utama dan kirimkan sebagai pesan baru
        input.value = newText;
        handleSendMessage();
        input.value = ""; // Kosongkan input setelah dikirim
    } else {
        alert("Pesan tidak boleh kosong.");
    }
}

// Aksi saat tombol "Batal" diklik
if (target.matches('.cancel-edit-btn, .cancel-edit-btn *')) {
    messageWrapper.classList.remove('is-editing');
    const messageTextElement = messageWrapper.querySelector('.message-text');
    
    // Hapus kontainer edit
    messageWrapper.querySelector('.edit-container').remove();
    
    // Tampilkan kembali teks asli dan meta
    messageTextElement.style.display = 'block';
    messageWrapper.querySelector('.message-meta').style.display = 'flex';
}

    if (target.classList.contains('regenerate-icon')) {
      let previousMessage = messageWrapper.previousElementSibling;
      while(previousMessage && !previousMessage.classList.contains('user')) {
          previousMessage = previousMessage.previousElementSibling;
      }
      if (previousMessage) {
          const userQuery = previousMessage.querySelector('.message-text').innerText;
          messageWrapper.remove();
          input.value = userQuery; 
          handleSendMessage();
          input.value = "";
      } else {
          alert("Gagal membuat ulang respons: prompt asli tidak ditemukan.");
      }
    }

    if (target.classList.contains('feedback-icon')) {
      const feedbackContainer = target.parentElement;
      if (feedbackContainer.classList.contains('feedback-sent')) return;
      feedbackContainer.classList.add('feedback-sent');
      const feedbackType = target.dataset.feedback;
      target.classList.remove('far');
      target.classList.add('fas', feedbackType === 'good' ? 'feedback-good' : 'feedback-bad');
      console.log(`Feedback diterima: ${feedbackType}`);
    }

    if (target.matches('.speak-icon')) {
    // Panggil manager TTS yang baru dengan parameter yang dibutuhkan
    ttsManager.speak(messageWrapper, target);
    }
  });

  loadChatHistory();
  btn.addEventListener("click", handleSendMessage);
  if (deleteBtn) deleteBtn.addEventListener("click", deleteChatHistory);

  input.addEventListener('input', () => {
    if (!isTyping) { // Hanya aktifkan jika tidak sedang mengetik
        btn.disabled = !input.value.trim();
    }
  });
    
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { 
        if (btn.disabled === false) { 
            e.preventDefault();
            handleSendMessage();
            if(document.getElementById('noneteks')) {
                document.getElementById('noneteks').style.display = 'none';
            }
        }
    }
  });
  
  async function handleSendMessage() {
    const text = input.value.trim();

    // Pengecekan Kill Switch dari system.json
    if (systemConfig && systemConfig.api_enabled === false) {
        showBotOfflineMessage(systemConfig.api_offline_message, text);
        restoreSendButton();
        input.disabled = false;
        input.focus();
        return;
    }
    
    if (!text || isTyping) return;

    // --- BAGIAN INTI: Manajemen Riwayat Cerdas (Hemat Data) ---
    
    let historyForContext = [...conversationHistory];

    // 1. Jika riwayat terlalu panjang, pangkas secara cerdas HANYA untuk data yang akan dikirim.
    //    Ini menjaga agar AI tetap mengingat konteks awal dan terbaru.
    if (historyForContext.length > MAX_HISTORY_LENGTH) {
        // Ambil 2 pesan pertama (untuk menjaga konteks awal percakapan)
        const initialContext = historyForContext.slice(0, 2); 
        // Ambil 8 pesan terakhir (MAX_HISTORY_LENGTH - 2) untuk menjaga konteks terbaru
        const recentContext = historyForContext.slice(historyForContext.length - (MAX_HISTORY_LENGTH - 2));
        
        // Gabungkan keduanya untuk menjadi riwayat yang "diringkas"
        historyForContext = [...initialContext, ...recentContext];
    }

    // 2. Format riwayat yang akan dikirim ke API (tanpa label peran).
    const context = historyForContext.map(msg => msg.content).join('\n\n');

    // 3. Gabungkan riwayat ringkas dengan pesan baru pengguna.
    const contentWithHistory = context ? `${context}\n\n${text}` : text;
    
    // --- AKHIR DARI MANAJEMEN RIWAYAT ---

    btn.disabled = true;
    input.disabled = true;
    appendMessage("user", text);
    input.value = "";
    if (document.getElementById('noneteks')) {
      document.getElementById('noneteks').style.display = 'none';
    }
    if (document.querySelector('.chatbot-options')) {
      document.querySelector('.chatbot-options').style.display = 'none';
    }

    const loader = showLoader();
    fetchController = new AbortController();
    showStopTypingButton();

    const backendUrl = 'https://api.siputzx.my.id/api/ai/gpt3';
    const url = new URL(backendUrl);
    // Kirim instruksi sistem dan konten yang sudah dilengkapi riwayat
    url.searchParams.append('prompt', SYSTEM_INSTRUCTION);
    url.searchParams.append('content', contentWithHistory);

    try {
      await cancellableDelay(10000, fetchController.signal);
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: fetchController.signal,
      });

      fetchController = null;
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP error! status: ${res.status}` }));
        throw new Error(errorData.message || `Request ke backend gagal dengan status ${res.status}`);
      }

      loader.remove();
      const data = await res.json();
      const rawBotMessage = data.data || "";

      // --- SIMPAN RIWAYAT ASLI SETELAH SUKSES ---
      // Riwayat asli tetap utuh dan lengkap, tidak dipangkas.
      conversationHistory.push({ role: 'user', content: text });
      if (rawBotMessage) {
        conversationHistory.push({ role: 'assistant', content: rawBotMessage });
      }
      // --- AKHIR PENYIMPANAN RIWAYAT ---

      if (isImageUrl(rawBotMessage)) {
        appendImageMessage("bot", rawBotMessage);
      } else {
        const formattedBotMessage = marked.parse(rawBotMessage);
        
        if (formattedBotMessage && formattedBotMessage.trim() !== '') {
          appendMessage("bot", formattedBotMessage);
        } else {
          appendInstantMessage("bot", "Maaf, saya tidak menerima respons yang valid dari server. Coba lagi.");
          restoreSendButton();
          input.disabled = false;
        }
      }
    } catch (err) {
      loader.remove(); 
      console.error("API Fetch Error:", err);
      const offlineMessage = systemConfig.api_offline_message || "Terjadi kesalahan koneksi. Silakan coba lagi.";

      if (err.name === 'AbortError') {
          appendInstantMessage("bot", "Oke, generasi respons telah saya hentikan.");
      } else {
          showBotOfflineMessage(offlineMessage, text);
      }
    } finally {
      fetchController = null;
      if (!isTyping) {
          restoreSendButton();
          input.disabled = false;
      }
    }
}
  
  /**
 * Menampilkan pesan bahwa bot sedang offline/mengalami kendala teknis.
 * @param {string} message - Pesan error yang akan ditampilkan.
 * @param {string} [originalQuery] - Query asli pengguna untuk fitur "Coba Lagi". Jika kosong, tombol tidak akan muncul.
 */
function showBotOfflineMessage(message, originalQuery) {
    let retryButtonHTML = '';
    // Hanya tampilkan tombol "Coba Lagi" jika ada query asli dan API sedang aktif
    if (originalQuery && systemConfig.api_enabled !== false) {
        const escapedQuery = originalQuery.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        retryButtonHTML = `
            <button class="retry-btn" data-query="${escapedQuery}">
                <i class="fas fa-rotate-right"></i> Coba Lagi
            </button>
        `;
    }

    const offlineMessageHTML = `
      <div class="offline-notice">
          <div class="offline-text">
              <strong>Koneksi Bermasalah</strong>
              <p>${message || 'Maaf, terjadi kendala teknis.'}</p>
              ${retryButtonHTML}
          </div>
      </div>
    `;
    
    appendInstantMessage('bot', offlineMessageHTML);
}

  // --- FUNGSI BARU: Untuk mengecek apakah sebuah string adalah URL gambar ---
  function isImageUrl(url) {
    return /\.(jpg|jpeg|png|gif|webp)$/.test(url);
  }

  function appendImageMessage(type, imageUrl) {
      const msgWrapper = document.createElement("div");
      msgWrapper.className = `message ${type}`;

      const actionIcons = `
      <div class="action-icons">
        <i class="fas fa-sync-alt regenerate-icon" title="Buat ulang respons"></i>
        <i class="fas fa-copy copy-icon" title="Salin URL gambar"></i>
      </div>
      `;
      
      // --- PERUBAHAN: Menambahkan avatar dan struktur bubble ---
      msgWrapper.innerHTML = `
          <img src="${botAvatarUrl}" class="bot-avatar" alt="BroRAX Avatar"></img>
          <div class="message-bubble">
            <div class="message-text image-container">
                <div class="image-loader"></div>
                <img src="" alt="Gambar dari AI" style="display: none; max-width: 100%; border-radius: 8px;" />
            </div>
            <div class="message-meta" style="visibility: hidden;">
                <div class="message-actions">${actionIcons}</div>
            </div>
          </div>
      `;
      chatBox.appendChild(msgWrapper);
      scrollToBottom();

      const imageLoader = msgWrapper.querySelector('.image-loader');
      const imageElement = msgWrapper.querySelector('img');
      const metaElement = msgWrapper.querySelector('.message-meta');

      const preloader = new Image();
      preloader.src = imageUrl;

      preloader.onload = () => {
          imageLoader.style.display = 'none';
          imageElement.src = imageUrl;
          imageElement.style.display = 'block';
          metaElement.style.visibility = 'visible';
          saveChatHistory();
          scrollToBottom();
      };

      preloader.onerror = () => {
          imageLoader.style.display = 'none';
          msgWrapper.querySelector('.message-text').innerHTML = `<i class="fas fa-exclamation-triangle"></i> Gagal memuat gambar.`;
          metaElement.style.visibility = 'visible';
          saveChatHistory();
      };
      
      restoreSendButton();
      input.disabled = false;
      input.focus();
  }
  
  /**
   * FUNGSI BARU: Membuat jeda waktu yang bisa dibatalkan di tengah jalan
   * menggunakan AbortSignal.
   */
  function cancellableDelay(duration, signal) {
    return new Promise((resolve, reject) => {
      // Jika sinyal sudah dibatalkan dari awal, langsung tolak.
      if (signal.aborted) {
        return reject(new DOMException('Aborted', 'AbortError'));
      }

      // Atur timer seperti biasa
      const timeoutId = setTimeout(() => {
        signal.removeEventListener('abort', handleAbort); // Bersihkan listener
        resolve();
      }, duration);

      // Buat listener yang akan berjalan jika tombol stop ditekan
      const handleAbort = () => {
        clearTimeout(timeoutId); // Batalkan timer
        reject(new DOMException('Aborted', 'AbortError')); // Hentikan promise
      };

      signal.addEventListener('abort', handleAbort);
    });
  }
  
  function showStopTypingButton() {
    // Hapus listener lama untuk menghindari tumpang tindih
    if (btn.stopListener) {
        btn.removeEventListener("click", btn.stopListener);
    }
    btn.removeEventListener("click", handleSendMessage);

    // Definisikan listener yang sudah diperbaiki
    const stopListener = () => {
        // Jika fetchController ada (artinya sedang loading/menunggu)
        if (fetchController) {
            fetchController.abort(); // HANYA panggil abort. JANGAN set ke null di sini.
        } 
        // Jika tidak, dan typewriter sedang berjalan
        else if (isTyping && typewriterControl.stop) {
            typewriterControl.stop();
        }
    };

    btn.addEventListener("click", stopListener);
    btn.stopListener = stopListener; // Simpan referensi

    btn.innerHTML = '<i class="fas fa-stop"></i>';
    btn.title = 'Hentikan';
    btn.disabled = false;
  }
  
  // --- FUNGSI BARU: Untuk mengembalikan tombol ke keadaan semula ---
  function restoreSendButton() {
    if (btn.stopListener) {
        btn.removeEventListener("click", btn.stopListener);
        btn.stopListener = null;
    }
    btn.addEventListener("click", handleSendMessage);
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>';
    btn.title = 'Kirim';
    btn.disabled = !input.value.trim();
  }
  
  function appendMessage(type, message) {
    const msgWrapper = document.createElement("div");
    msgWrapper.className = `message ${type}`;

    if (type === 'bot') {
        const actionIcons = `
        <div class="action-icons">
        <i class="fas fa-sync-alt regenerate-icon" title="Buat ulang respons"></i>
        <i class="fas fa-copy copy-icon" title="Salin pesan"></i>
        <i class="fas fa-share-alt share-icon" title="Bagikan/Ekspor"></i>
        <i class="far fa-thumbs-up feedback-icon" data-feedback="good"></i>
        <i class="far fa-thumbs-down feedback-icon" data-feedback="bad"></i>
        <i class="fas fa-volume-up speak-icon" title="Baca teks"></i>
        </div>
        `;
        
        // --- PERUBAHAN: Menambahkan avatar dan struktur bubble untuk bot ---
        msgWrapper.innerHTML = `
          <img src="${botAvatarUrl}" class="bot-avatar" alt="BroRAX Avatar" />
          <div class="message-bubble">
              <div class="message-text"></div>
              <div class="message-meta" style="visibility: hidden;">
                  <div class="message-actions">${actionIcons}</div>
              </div>
          </div>
        `;
        chatBox.appendChild(msgWrapper);
        const messageTextElement = msgWrapper.querySelector('.message-text');
        const metaElement = msgWrapper.querySelector('.message-meta');
        
        typewriterEffect(messageTextElement, message, metaElement);

    } else {
        // Struktur untuk pesan pengguna (tanpa avatar)
        const actionIcons = `
        <div class="action-icons">
        <i class="fas fa-copy copy-icon" title="Salin pesan"></i>
        <i class="fas fa-edit edit-icon" title="Edit pesan"></i>
        </div>`;

        // --- PERUBAHAN: Menambahkan bubble pada pesan pengguna agar konsisten ---
        msgWrapper.innerHTML = `
          <div class="message-bubble">
              <div class="message-text">${message}</div>
              <div class="message-meta">
                  <div class="message-actions">${actionIcons}</div>
              </div>
          </div>
        `;
        chatBox.appendChild(msgWrapper);
        saveChatHistory();
        checkMessageCount();
    }
    scrollToBottom();
  }
  
  function appendInstantMessage(type, message) {
    const msgWrapper = document.createElement("div");
    msgWrapper.className = `message ${type}`;
    
    if (type === 'bot') {
        checkMessageCount();
        const actionIcons = `
        <div class="action-icons">
        <i class="fas fa-sync-alt regenerate-icon" title="Buat ulang respons"></i>
        </div>`;

        // --- PERUBAHAN: Menambahkan avatar dan struktur bubble untuk bot ---
        msgWrapper.innerHTML = `
          <img src="${botAvatarUrl}" class="bot-avatar" alt="BroRAX Avatar" />
          <div class="message-bubble">
            <div class="message-text">${message}</div>
            <div class="message-meta">
                <div class="message-actions">${actionIcons}</div>
            </div>
          </div>
        `;
    } else {
        // Struktur untuk pesan pengguna (jika diperlukan)
        const actionIcons = `
        <div class="action-icons">
        <i class="fas fa-copy copy-icon" title="Salin pesan"></i>
        <i class="fas fa-edit edit-icon" title="Edit pesan"></i>
        </div>`;
        // --- PERUBAHAN: Menambahkan bubble pada pesan pengguna agar konsisten ---
        msgWrapper.innerHTML = `
          <div class="message-bubble">
            <div class="message-text">${message}</div>
            <div class="message-meta">
                <div class="message-actions">${actionIcons}</div>
            </div>
          </div>
        `;
    }

    chatBox.appendChild(msgWrapper);
    saveChatHistory();
    scrollToBottom();
  }

  function saveChatHistory() {
    const chatBoxClone = chatBox.cloneNode(true);
    const loaderElement = chatBoxClone.querySelector('.loader-wrapper');
    if (loaderElement) loaderElement.remove();
    localStorage.setItem("chatSession", chatBoxClone.innerHTML);
  }

  function loadChatHistory() {
    const savedChat = localStorage.getItem("chatSession");
    if (savedChat) chatBox.innerHTML = savedChat;
    scrollToBottom();
  }

  function deleteChatHistory() {
    // Hapus data dari localStorage
    localStorage.removeItem("chatSession");
    
    // KOSONGKAN RIWAYAT PERCAKAPAN DI MEMORI
    conversationHistory = [];
    
    // Hapus tampilan chat dan muat ulang halaman untuk reset total
    chatBox.innerHTML = "";
    location.reload(); 
}
  
  function scrollToBottom() {
  chatBox.lastElementChild?.scrollIntoView({
    behavior: 'smooth',
    block: 'end'
  });
}

const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

if (scrollToBottomBtn) {
  // Tampilkan atau sembunyikan tombol berdasarkan posisi scroll
  chatBox.addEventListener('scroll', () => {
    // Tombol muncul jika pengguna scroll ke atas sejauh 150 piksel dari bawah
    if (chatBox.scrollTop + chatBox.clientHeight < chatBox.scrollHeight - 150) {
      scrollToBottomBtn.classList.remove('hidden');
    } else {
      scrollToBottomBtn.classList.add('hidden');
    }
  });

  // Tambahkan aksi klik pada tombol untuk scroll ke bawah
  scrollToBottomBtn.addEventListener('click', () => {
    scrollToBottom();
  });
}
    
  // --- FITUR TTS (TEXT-TO-SPEECH) CANGGIH V2 (BUG RESUME DIPERBAIKI) ---
const ttsManager = {
    utterance: null,
    speakingElement: null,
    iconElement: null,
    isPaused: false,
    // --- BARU: Variabel untuk melacak progres & teks asli ---
    currentCharIndex: 0,
    originalText: '',

    stop(isFinal = true) {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        if (isFinal && this.speakingElement) {
            this.speakingElement.classList.remove('is-speaking');
        }
        if (isFinal && this.iconElement) {
            this.iconElement.className = 'fas fa-volume-up speak-icon';
            this.iconElement.title = 'Baca teks';
        }
        if (isFinal) {
            this.utterance = null;
            this.speakingElement = null;
            this.iconElement = null;
            this.isPaused = false;
            this.currentCharIndex = 0;
            this.originalText = '';
        }
    },

    // --- LOGIKA JEDA DIPERBARUI: Menghentikan suara dan menyimpan posisi ---
    pause() {
        if (!this.isPaused) {
            this.isPaused = true;
            // Kita panggil `cancel()` yang lebih andal daripada `pause()`
            window.speechSynthesis.cancel();
            this.iconElement.className = 'fas fa-play-circle speak-icon';
            this.iconElement.title = 'Lanjutkan membaca';
            this.speakingElement.classList.remove('is-speaking');
        }
    },

    // --- LOGIKA LANJUTKAN DIPERBARUI: Memulai suara baru dari teks sisa ---
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            
            // Ambil sisa teks dari posisi terakhir yang disimpan
            const textToResume = this.originalText.substring(this.currentCharIndex);
            
            if (textToResume) {
                // Buat dan konfigurasikan utterance BARU
                const newUtterance = new SpeechSynthesisUtterance(textToResume);
                newUtterance.lang = 'id-ID';
                newUtterance.rate = 1.0;
                newUtterance.pitch = 1.0;

                // Lampirkan kembali semua event handler
                this._attachEventListeners(newUtterance);
                
                this.utterance = newUtterance;
                window.speechSynthesis.speak(this.utterance);
            } else {
                // Jika tidak ada teks tersisa, selesaikan saja.
                this.stop();
            }
        }
    },
    
    // --- FUNGSI BARU: Untuk melampirkan event listener ke utterance ---
    _attachEventListeners(utteranceInstance) {
        utteranceInstance.onstart = () => {
            this.speakingElement.classList.add('is-speaking');
            this.iconElement.className = 'fas fa-pause-circle speak-icon';
            this.iconElement.title = 'Jeda';
        };

        // Event penting untuk melacak posisi karakter saat suara berjalan
        utteranceInstance.onboundary = (event) => {
            // Kita tambahkan posisi saat ini dengan posisi relatif dari teks sisa
            this.currentCharIndex = this.originalText.length - event.target.text.length + event.charIndex;
        };
        
        utteranceInstance.onend = () => {
            // `onend` akan terpanggil saat `cancel()` dijalankan.
            // Cek `isPaused` untuk mencegah reset total saat jeda.
            if (!this.isPaused) {
                this.stop();
            }
        };

        utteranceInstance.onerror = (event) => {
            console.error('SpeechSynthesis Error:', event.error);
            this.stop();
        };
    },

    speak(messageWrapper, iconElement) {
        if (this.speakingElement === messageWrapper) {
            if (this.isPaused) {
                this.resume();
            } else {
                this.pause();
            }
            return;
        }

        this.stop(); // Hentikan suara lain yang mungkin sedang berjalan

        const contentClone = messageWrapper.querySelector('.message-text').cloneNode(true);
        contentClone.querySelectorAll('.code-block-wrapper, pre').forEach(codeBlock => {
            codeBlock.textContent = ' Berikut adalah blok kode. ';
        });

        // Simpan teks asli dan reset posisi
        this.originalText = contentClone.innerText;
        this.currentCharIndex = 0;

        if (!this.originalText) return;
        
        this.speakingElement = messageWrapper;
        this.iconElement = iconElement;
        
        const newUtterance = new SpeechSynthesisUtterance(this.originalText);
        this._attachEventListeners(newUtterance); // Gunakan fungsi helper
        
        this.utterance = newUtterance;
        window.speechSynthesis.speak(this.utterance);
    }
};

    // Ambil elemen dari DOM
    const overlayContainer = document.getElementById('overlay-fitur-baru');
    const tombolTutup = document.getElementById('tombol-tutup');
    const tombolMengerti = document.getElementById('tombol-mengerti');
    const daftarFiturUl = document.getElementById('daftar-fitur-baru');
    
    // Logika localStorage tetap sama
    const versiTerlihat = localStorage.getItem('versiFiturTerlihat');

    // Fungsi untuk menampilkan overlay
    const tampilkanOverlay = () => {
        daftarFiturUl.innerHTML = ''; 

        // Buat setiap kartu fitur dan atur delay animasinya
        fiturSaatIni.items.forEach((item, index) => {
            const li = document.createElement('li');
            
            // Atur delay animasi untuk efek berurutan
            li.style.animationDelay = `${index * 0.1 + 0.3}s`;

            // Isi konten kartu
            li.innerHTML = `
                <div class="fitur-icon">
                    <i class="fas ${item.icon}"></i>
                </div>
                <div class="fitur-info">
                    <strong>${item.title}</strong>
                    <span>${item.description}</span>
                </div>
            `;
            daftarFiturUl.appendChild(li);
        });

        overlayContainer.classList.add('show');
    };

    // Fungsi untuk menyembunyikan overlay
    const sembunyikanOverlay = () => {
        overlayContainer.classList.remove('show');
        localStorage.setItem('versiFiturTerlihat', fiturSaatIni.version);
    };

    // Periksa versi dan tampilkan jika perlu
    if (versiTerlihat !== fiturSaatIni.version) {
        setTimeout(tampilkanOverlay, 300); // Tampilkan setelah jeda singkat
    }

    // Tambahkan event listener untuk tombol
    tombolTutup.addEventListener('click', sembunyikanOverlay);
    tombolMengerti.addEventListener('click', sembunyikanOverlay);
    
    /**
 * FUNGSI SHARE CHAT YANG SUDAH DIOPTIMALKAN (ANTI FORCE CLOSE)
 * Versi ini memperbaiki masalah performa dan kebocoran memori dengan mengurangi skala render,
 * mengelola Object URL secara aktif, dan membuat UI lebih tangguh.
 * @param {HTMLElement} messageWrapper - Elemen pembungkus pesan bot yang dipilih.
 */
async function handleShareChat(messageWrapper) {
    const shareButton = messageWrapper.querySelector('.share-icon');
    const originalButtonIcon = shareButton.className;
    let tempContainer = null;
    let modalElement = null;
    let lastGeneratedBlob = null;
    let currentObjectUrl = null; // <-- VARIABEL BARU untuk melacak Object URL
    let isRendering = false;

    // Utility Function untuk Debounce tetap sama
    const debounce = (func, delay = 300) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Aset dan Konfigurasi Awal
    const logoUrl = './web-app-manifest-512x512.png';
    const initialOptions = {
        theme: 'auto',
        title: 'Percakapan dengan BroRAX',
        showQR: true,
        showFooter: true,
    };

    /**
     * Fungsi inti untuk me-render canvas (sudah dioptimalkan).
     */
    async function renderImage(options) {
        if (isRendering) return;
        isRendering = true;

        const userMessageElement = messageWrapper.previousElementSibling;
        if (!userMessageElement) {
            isRendering = false;
            throw new Error("Pesan pengguna tidak ditemukan.");
        }

        // Pastikan container sementara selalu dihapus, bahkan jika ada error
        try {
            const isDarkMode = options.theme === 'auto' ?
                window.matchMedia('(prefers-color-scheme: dark)').matches :
                options.theme === 'dark';

            const themeColors = {
                bg: isDarkMode ? '#1E1F22' : '#FFFFFF',
                text: isDarkMode ? '#E1E1E2' : '#202124',
                muted: isDarkMode ? '#8E9195' : '#5F6368',
                border: isDarkMode ? '#444746' : '#E0E0E0',
            };

            tempContainer = document.createElement('div');
            Object.assign(tempContainer.style, {
                position: 'absolute',
                left: '-9999px',
                width: (chatBox.clientWidth > 500 ? 500 : chatBox.clientWidth) + 'px',
                padding: '24px',
                border: `1px solid ${themeColors.border}`,
                borderRadius: '16px',
                backgroundColor: themeColors.bg,
                fontFamily: `'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif`,
                transition: 'background-color 0.3s'
            });

            const header = `<div style="display: flex; align-items: center; padding-bottom: 15px; border-bottom: 1px solid ${themeColors.border};">
                <img src="${logoUrl}" alt="Logo" style="width: 30px; height: 30px; margin-right: 12px; border-radius: 6px;">
                <input type="text" id="share-title-input" value="${options.title}" style="font-size: 16px; font-weight: 600; color: ${themeColors.text}; background: transparent; border: none; outline: none; width: 100%;">
            </div>`;

            const userClone = userMessageElement.cloneNode(true);
            const botClone = messageWrapper.cloneNode(true);
            userClone.querySelector('.message-meta')?.remove();
            botClone.querySelector('.message-meta')?.remove();

            const qrCodeHtml = options.showQR ? `<div style="text-align: center; flex-shrink: 0; margin-left: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: ${themeColors.text}; font-weight: 500;">Scan untuk Coba</p>
                <div style="padding: 5px; border-radius: 8px; background-color: white;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.href)}&qzone=1" alt="QR Code" style="display: block;">
                </div>
            </div>` : '';

            const content = `<div style="display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 0;">
                <div style="flex-grow: 1;">${userClone.outerHTML}${botClone.outerHTML}</div>
                ${qrCodeHtml}
            </div>`;

            const footer = options.showFooter ? `<div style="padding-top: 10px; text-align: center; font-size: 12px; color: ${themeColors.muted};">
                Dibuat dengan BroRAX AI &bull; ${new Date().toLocaleDateString('id-ID')}
            </div>` : '';

            tempContainer.innerHTML = header + content + footer;
            document.body.appendChild(tempContainer);

            // --- PERUBAHAN KUNCI 1: Mengurangi 'scale' untuk performa lebih baik ---
            const canvas = await html2canvas(tempContainer, {
                useCORS: true,
                scale: 1.5, // Diturunkan dari 2 untuk mengurangi beban memori & CPU
                backgroundColor: null
            });

            return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        } finally {
            // --- PERUBAHAN KUNCI 2: Memastikan elemen sementara SELALU dihapus ---
            if (tempContainer) tempContainer.remove();
            isRendering = false;
        }
    }

    /**
     * Membuat dan menampilkan modal pratinjau.
     */
    function showPreviewModal() {
        if (document.getElementById('share-preview-modal')) return;

        modalElement = document.createElement('div');
        modalElement.id = 'share-preview-modal';
        // HTML dan Style untuk modal tetap sama seperti kode Anda sebelumnya
        modalElement.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Pratinjau & Bagikan</h3>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="preview-area">
                        <img id="preview-image" src="" alt="Pratinjau Gambar">
                        <div class="loader-overlay"><div class="spinner"></div><span>Membuat pratinjau...</span></div>
                    </div>
                    <div class="controls-area">
                        <h4>Opsi Tampilan</h4>
                        <div class="control-group">
                            <label>Tema Warna</label>
                            <div class="theme-buttons">
                                <button data-theme="auto" class="active">Otomatis</button>
                                <button data-theme="light">Terang</button>
                                <button data-theme="dark">Gelap</button>
                            </div>
                        </div>
                        <div class="control-group">
                            <label>Pengaturan Elemen</label>
                            <div class="toggle-group">
                                <label><input type="checkbox" data-option="showQR" checked> Tampilkan QR Code</label>
                                <label><input type="checkbox" data-option="showFooter" checked> Tampilkan Footer</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-action-btn" id="copy-image-btn"><i class="far fa-copy"></i> Salin</button>
                    <button class="modal-action-btn primary" id="share-now-btn"><i class="fas fa-share-alt"></i> Bagikan</button>
                </div>
            </div>
            <style>
                /* Gaya CSS untuk modal bisa disalin dari kode asli Anda */
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: translate(-50%, -50%) scale(0.95); } to { transform: translate(-50%, -50%) scale(1); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                #share-preview-modal .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index: 999998; animation: fadeIn 0.3s ease-out; }
                #share-preview-modal .modal-content { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #2c2c2e; color: white; border-radius: 12px; width: 90%; max-width: 600px; z-index: 999999; box-shadow: 0 5px 25px rgba(0,0,0,0.4); display: flex; flex-direction: column; max-height: 90vh; animation: fadeIn 0.3s ease-out, scaleUp 0.3s ease-out; }
                #share-preview-modal .modal-header { padding: 15px 20px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
                #share-preview-modal .modal-header h3 { margin: 0; font-size: 18px; }
                #share-preview-modal .modal-body { padding: 20px; overflow-y: auto; flex-grow: 1; }
                #share-preview-modal .preview-area { position: relative; margin-bottom: 20px; background: #222; border-radius: 8px; padding: 10px; min-height: 150px; }
                #share-preview-modal #preview-image { width: 100%; height: auto; border-radius: 8px; transition: opacity 0.2s; }
                #share-preview-modal .loader-overlay { position: absolute; top:0; left:0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); color: white; display: none; justify-content: center; align-items: center; border-radius: 8px; flex-direction: row; }
                #share-preview-modal .loader-overlay .spinner { width: 20px; height: 20px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 10px; }
                #share-preview-modal .controls-area { display: flex; flex-direction: column; gap: 15px; }
                #share-preview-modal .control-group label { display: block; margin-bottom: 8px; font-weight: 500; }
                #share-preview-modal .theme-buttons { display: flex; gap: 10px; }
                #share-preview-modal .theme-buttons button { background: #555; border: 1px solid #777; color: white; padding: 8px 15px; border-radius: 6px; cursor: pointer; transition: background 0.2s, border-color 0.2s; }
                #share-preview-modal .theme-buttons button.active { background: #0a84ff; border-color: #0a84ff; font-weight: bold; }
                #share-preview-modal .toggle-group { display: flex; gap: 20px; }
                #share-preview-modal .toggle-group label { display: flex; align-items: center; gap: 8px; }
                #share-preview-modal .modal-footer { padding: 15px 20px; border-top: 1px solid #444; flex-shrink: 0; display: flex; justify-content: flex-end; gap: 12px;}
                #share-preview-modal .modal-close-btn { background: none; border: none; color: #aaa; font-size: 24px; cursor: pointer; }
                #share-preview-modal .modal-action-btn { border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: background-color 0.2s; display: flex; align-items: center; gap: 8px; font-size: 15px; background: #555; color: white;}
                #share-preview-modal .modal-action-btn.primary { background: #0a84ff; }
            </style>
        `;
        document.body.appendChild(modalElement);

        const closeModal = () => {
            // --- PERUBAHAN KUNCI 3: Hapus Object URL terakhir saat modal ditutup ---
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
            }
            modalElement.remove();
        };

        const updatePreview = async () => {
            if (isRendering) return;

            const loader = modalElement.querySelector('.loader-overlay');
            const controls = modalElement.querySelectorAll('.controls-area button, .controls-area input');

            try {
                loader.style.display = 'flex';
                controls.forEach(c => c.disabled = true); // Nonaktifkan kontrol selama render

                const titleInput = document.body.querySelector('#share-title-input');
                if (titleInput) initialOptions.title = titleInput.value;

                const newBlob = await renderImage(initialOptions);
                if (!newBlob) return; // Keluar jika render gagal

                // --- PERUBAHAN KUNCI 4: Manajemen memori untuk Object URL ---
                if (currentObjectUrl) {
                    URL.revokeObjectURL(currentObjectUrl); // Hapus URL lama
                }

                lastGeneratedBlob = newBlob;
                currentObjectUrl = URL.createObjectURL(newBlob); // Buat URL baru
                modalElement.querySelector('#preview-image').src = currentObjectUrl;

            } catch (error) {
                console.error("Gagal membuat pratinjau gambar:", error);
                alert("Waduh, gagal membuat pratinjau. Silakan coba lagi.");
            } finally {
                loader.style.display = 'none';
                controls.forEach(c => c.disabled = false); // Aktifkan kembali kontrol
            }
        };

        const debouncedTitleUpdate = debounce(updatePreview, 400);

        // --- Event Listeners ---
        modalElement.querySelector('.modal-overlay').onclick = closeModal;
        modalElement.querySelector('.modal-close-btn').onclick = closeModal;

        modalElement.querySelectorAll('.theme-buttons button, .toggle-group input').forEach(el => {
            el.onchange = el.onclick = () => {
                if (el.matches('button')) {
                    modalElement.querySelector('.theme-buttons button.active').classList.remove('active');
                    el.classList.add('active');
                    initialOptions.theme = el.dataset.theme;
                } else {
                    initialOptions[el.dataset.option] = el.checked;
                }
                updatePreview();
            };
        });

        // Gunakan event delegation pada body untuk menangani input judul dinamis
        document.body.addEventListener('input', (e) => {
            if (e.target.id === 'share-title-input') {
                initialOptions.title = e.target.value;
                debouncedTitleUpdate();
            }
        });

        document.getElementById('copy-image-btn').onclick = async (e) => {
            if (!lastGeneratedBlob || !navigator.clipboard?.write) return;
            try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': lastGeneratedBlob })]);
                const btn = e.currentTarget;
                btn.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
                setTimeout(() => { btn.innerHTML = '<i class="far fa-copy"></i> Salin'; }, 2000);
            } catch (err) {
                alert('Gagal menyalin gambar.');
                console.error('Clipboard write error:', err);
            }
        };

        document.getElementById('share-now-btn').onclick = async () => {
            if (!lastGeneratedBlob) return;
            const imageFile = new File([lastGeneratedBlob], `percakapan-brorax-${Date.now()}.png`, { type: 'image/png' });
            try {
                if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
                    await navigator.share({
                        files: [imageFile],
                        title: 'Obrolan Keren dengan BroRAX AI',
                        text: `Penasaran sama AI yang bisa diajak ngobrol santai? Cek hasil percakapanku dengan BroRAX ini! 🤖`
                    });
                } else {
                    alert('Browser Anda tidak mendukung fitur berbagi file ini.');
                }
            } catch (err) {
                if (err.name !== 'AbortError') console.error("Error sharing:", err);
            }
        };

        updatePreview(); // Panggil pertama kali untuk render awal
    }

    // --- Main Logic ---
    try {
        shareButton.className = 'fas fa-spinner fa-spin'; // Tampilkan loading
        showPreviewModal();
    } catch (err) {
        console.error("Gagal memulai proses berbagi:", err);
        alert("Waduh, sepertinya ada kendala saat menyiapkan pratinjau.");
    } finally {
        shareButton.className = originalButtonIcon; // Kembalikan ikon tombol
    }
}

// --- KODE BARU: FITUR TAHAN PESAN UNTUK MENU KUSTOM ---

let pressTimer;
let longPressTargetMessage;

// Fungsi untuk menghapus menu jika ada
const removeCustomMenu = () => {
  const existingMenu = document.querySelector('.custom-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
};

// --- FUNGSI DIPERBARUI: Untuk menampilkan menu tanpa menutupi pesan ---
const showCustomMenu = (event, messageElement) => {
  removeCustomMenu(); // Hapus menu lama sebelum menampilkan yang baru

  const menu = document.createElement('div');
  menu.className = 'custom-context-menu';
  
  menu.innerHTML = `
    <button id="custom-copy">
        <i class="fas fa-highlighter"></i> Salin Teks Yang Dipilih
    </button>
    <button id="custom-help">
        <i class="fas fa-question-circle"></i> Butuh Bantuan?
    </button>
  `;

  document.body.appendChild(menu);

  // --- LOGIKA POSISI BARU ---
  
  // 1. Dapatkan posisi dan ukuran dari elemen pesan bot
  const messageRect = messageElement.getBoundingClientRect();
  
  // 2. Dapatkan ukuran dari menu yang baru dibuat
  const menuRect = menu.getBoundingClientRect();

  let topPos, leftPos;

  // Atur posisi X (horizontal) agar sejajar dengan pesan
  leftPos = messageRect.left;

  // 3. Cek apakah ada cukup ruang di BAWAH pesan
  if (window.innerHeight - messageRect.bottom > menuRect.height + 10) {
      // Jika ya, posisikan menu di bawah pesan (dengan margin 5px)
      topPos = messageRect.bottom + 5;
  } else {
      // Jika tidak cukup ruang, posisikan menu di ATAS pesan
      topPos = messageRect.top - menuRect.height - 5;
  }
  
  // Terapkan posisi yang sudah dihitung
  menu.style.top = `${topPos}px`;
  menu.style.left = `${leftPos}px`;
  
  // --- AKHIR LOGIKA POSISI BARU ---

  // Event listener untuk tombol "Salin Teks Dipilih"
  document.getElementById('custom-copy').addEventListener('click', () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      navigator.clipboard.writeText(selectedText).then(() => {
        alert('Teks yang dipilih berhasil disalin!');
      });
    } else {
      const fullText = messageElement.querySelector('.message-text').innerText;
      navigator.clipboard.writeText(fullText).then(() => {
        alert('Tidak ada teks dipilih. Seluruh pesan berhasil disalin!');
      });
    }
    removeCustomMenu();
  });
  
  // Event listener untuk tombol "Tanya"
  document.getElementById('custom-help').addEventListener('click', () => {
    alert('Ini adalah fitur bantuan. Anda bisa mengembangkannya lebih lanjut!');
    removeCustomMenu();
  });
};

// Event utama yang mendeteksi aksi tahan pada chatBox
chatBox.addEventListener('mousedown', (e) => {
  // Hanya aktif jika target adalah pesan bot
  const messageWrapper = e.target.closest('.message.bot');
  if (messageWrapper) {
    longPressTargetMessage = messageWrapper; // Simpan elemen pesan yang ditahan
    
    // Mulai timer saat mouse ditekan
    pressTimer = window.setTimeout(() => {
      e.preventDefault(); // Mencegah menu konteks default browser muncul
      showCustomMenu(e, longPressTargetMessage);
    }, 1000); // Durasi untuk dianggap sebagai "tahan" (1000 milidetik)
  }
});

// Batalkan timer jika mouse dilepas sebelum durasi "tahan" tercapai
chatBox.addEventListener('mouseup', () => {
  clearTimeout(pressTimer);
});

// Batalkan timer jika kursor keluar dari area chatBox
chatBox.addEventListener('mouseleave', () => {
  clearTimeout(pressTimer);
});

// Tambahkan event listener untuk sentuhan pada perangkat mobile
chatBox.addEventListener('touchstart', (e) => {
    const messageWrapper = e.target.closest('.message.bot');
    if (messageWrapper) {
        longPressTargetMessage = messageWrapper;
        pressTimer = window.setTimeout(() => {
            e.preventDefault();
            // Gunakan posisi sentuhan pertama untuk menampilkan menu
            const touch = e.touches[0];
            showCustomMenu(touch, longPressTargetMessage);
        }, 1000);
    }
});

chatBox.addEventListener('touchend', () => {
    clearTimeout(pressTimer);
});

// Hapus menu jika pengguna mengklik di area lain
window.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-context-menu')) {
    removeCustomMenu();
  }
});

// --- TAMBAHAN: Menghilangkan menu dengan tombol Escape ---
window.addEventListener('keydown', (e) => {
    // Periksa apakah tombol yang ditekan adalah 'Escape'
    if (e.key === 'Escape') {
        // Panggil fungsi untuk menghapus menu
        removeCustomMenu();
    }
});

// --- AKHIR DARI KODE BARU ---

// --- (PASTE KODE INI DI BAGIAN ATAS DARI FUNGSI "handleSendMessage") ---

// --- KODE BARU: GANTI CLASS TYPEWRITER DAN FUNGSI typewriterEffect DENGAN INI ---

// Variabel untuk menyimpan instance typewriter yang sedang aktif
let currentTypewriterInstance = null;

/**
 * Class Typewriter Canggih (Versi Revisi)
 * Mengelola semua logika untuk efek pengetikan yang realistis, efisien,
 * dan andal dalam menangani konten HTML yang kompleks.
 */
class Typewriter {
    /**
     * @param {HTMLElement} element - Elemen DOM tempat efek pengetikan akan ditampilkan.
     * @param {string} htmlContent - Konten HTML mentah yang akan diketik.
     * @param {HTMLElement} metaElement - Elemen meta (misal: tombol aksi) yang akan ditampilkan setelah selesai.
     */
    constructor(element, htmlContent, metaElement) {
        this.element = element;
        this.metaElement = metaElement;
        this.htmlContent = htmlContent;

        // --- KONFIGURASI BARU: Kecepatan dinamis berdasarkan panjang teks ---
        const textLength = htmlContent.replace(/<[^>]*>?/gm, '').length; // Hitung panjang teks bersih (tanpa HTML)
        const MIN_SPEED = 10; // Kecepatan tercepat (ms) untuk teks sangat panjang
        const MAX_SPEED = 45; // Kecepatan terlambat (ms) untuk teks sangat pendek
        const SHORT_TEXT_THRESHOLD = 100; // Batas teks dianggap pendek
        const LONG_TEXT_THRESHOLD = 800;  // Batas teks dianggap panjang

        if (textLength <= SHORT_TEXT_THRESHOLD) {
            this.baseSpeed = MAX_SPEED;
        } else if (textLength >= LONG_TEXT_THRESHOLD) {
            this.baseSpeed = MIN_SPEED;
        } else {
            // Interpolasi linear untuk kecepatan antara teks pendek dan panjang
            const speedRange = MAX_SPEED - MIN_SPEED;
            const lengthRange = LONG_TEXT_THRESHOLD - SHORT_TEXT_THRESHOLD;
            const lengthProgress = (textLength - SHORT_TEXT_THRESHOLD) / lengthRange;
            this.baseSpeed = MAX_SPEED - (speedRange * lengthProgress);
        }
        // --- AKHIR DARI KONFIGURASI BARU ---

        this.speedJitter = this.baseSpeed * 0.5; // Variasi acak berdasarkan kecepatan dasar
        this.pauseOnPunctuation = 300; // Jeda ekstra saat bertemu tanda baca.

        // --- Status Internal ---
        this.isCancelled = false; // Flag untuk menghentikan paksa.
        this.isPaused = false;    // Flag untuk jeda saat di luar viewport.
        this.lastFrameTime = 0;
        this.timeSinceLastChar = 0;

        // "Meratakan" struktur HTML menjadi serangkaian instruksi yang mudah dieksekusi.
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.htmlContent;
        this.nodes = this._flattenNodes(tempDiv);

        // Inisialisasi tampilan awal
        this.element.innerHTML = '';
        this.cursor = this._createCursor();
        this.element.appendChild(this.cursor);
        
        // Simpan referensi ke elemen root untuk observasi
        this.rootElement = this.element; 
        
        // --- Fitur Canggih: Jeda otomatis saat tidak terlihat ---
        this.observer = this._createIntersectionObserver();
    }

    /**
     * Mengubah struktur node DOM menjadi array instruksi yang datar.
     * @param {HTMLElement} rootNode - Elemen yang berisi HTML untuk diproses.
     * @returns {Array<Object|string>} - Array berisi karakter atau objek aksi.
     */
    _flattenNodes(rootNode) {
        const flatList = [];
        const traverse = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                // Pecah teks menjadi karakter individual
                flatList.push(...node.textContent.split(''));
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Strategi khusus untuk blok kode: tampilkan instan demi performa
                if (node.tagName === 'PRE') {
                    flatList.push({ action: 'instant_append', node: node.cloneNode(true) });
                    return; // Lewati pemrosesan anak-anak dari <pre>
                }
                // Catat instruksi untuk "memasuki" sebuah tag HTML
                flatList.push({ action: 'enter', tagName: node.tagName, attributes: Array.from(node.attributes) });
                Array.from(node.childNodes).forEach(traverse);
                // Catat instruksi untuk "keluar" dari sebuah tag
                flatList.push({ action: 'exit' });
            }
        };
        Array.from(rootNode.childNodes).forEach(traverse);
        return flatList;
    }

    /**
     * Membuat elemen DOM untuk kursor yang berkedip.
     * @returns {HTMLElement} - Elemen span untuk kursor.
     */
    _createCursor() {
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        cursor.innerHTML = '▋';
        return cursor;
    }
    
    /**
     * Menginisialisasi IntersectionObserver untuk menjeda animasi saat elemen
     * tidak terlihat di layar, menghemat sumber daya CPU.
     * @returns {IntersectionObserver}
     */
    _createIntersectionObserver() {
        const options = { root: null, threshold: 0.1 }; // Jeda jika kurang dari 10% terlihat
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isPaused = !entry.isIntersecting;
            });
        }, options);
        observer.observe(this.rootElement);
        return observer;
    }

    /**
     * Memulai proses pengetikan.
     */
    start() {
        requestAnimationFrame(this._frameLoop.bind(this));
    }

    /**
     * Membatalkan proses pengetikan dan langsung menampilkan hasil akhir.
     */
    cancel() {
        this.isCancelled = true;
    }
    
    /**
     * Loop utama animasi yang dipanggil oleh requestAnimationFrame.
     * @param {number} timestamp - Waktu saat ini yang disediakan oleh browser.
     */
    _frameLoop(timestamp) {
        if (this.isCancelled) {
            this._finalize(true); // Selesaikan jika dibatalkan
            return;
        }
        
        if (!this.lastFrameTime) this.lastFrameTime = timestamp;

        // Hanya proses jika tidak dijeda (elemen terlihat di layar)
        if (!this.isPaused) {
            const deltaTime = timestamp - this.lastFrameTime;
            this.timeSinceLastChar += deltaTime;

            const currentTarget = this.nodes[0];
            const char = (typeof currentTarget === 'string') ? currentTarget : '';
            
            // Tentukan jeda yang diperlukan berdasarkan karakter
            const requiredDelay = (char === '.' || char === ',') 
                ? this.pauseOnPunctuation 
                : this.baseSpeed + (Math.random() - 0.5) * this.speedJitter;

            if (this.timeSinceLastChar >= requiredDelay) {
                this._processNextNode();
                this.timeSinceLastChar = 0; // Reset timer karakter
            }
        }

        this.lastFrameTime = timestamp;

        // Lanjutkan loop jika masih ada node untuk diproses
        if (this.nodes.length > 0) {
            requestAnimationFrame(this._frameLoop.bind(this));
        } else {
            this._finalize(false); // Selesaikan jika sudah selesai normal
        }
    }
    
    /**
     * Memproses satu node (karakter atau instruksi HTML) dari antrian.
     */
    _processNextNode() {
        const nextNode = this.nodes.shift();
        if (!nextNode) return;

        if (typeof nextNode === 'string') {
            const textNode = document.createTextNode(nextNode);
            this.element.insertBefore(textNode, this.cursor);
        } else if (typeof nextNode === 'object') {
            switch (nextNode.action) {
                case 'enter':
                    const newElement = document.createElement(nextNode.tagName);
                    nextNode.attributes.forEach(attr => newElement.setAttribute(attr.name, attr.value));
                    this.element.insertBefore(newElement, this.cursor);
                    this.element = newElement; // Pindah konteks ke elemen baru
                    this.element.appendChild(this.cursor); // Pindahkan kursor ke dalam elemen baru
                    break;
                case 'exit':
                    const parent = this.element.parentElement;
                    parent.appendChild(this.cursor); // Pindahkan kursor ke luar
                    this.element = parent; // Kembalikan konteks ke parent
                    break;
                case 'instant_append':
                    this.element.insertBefore(nextNode.node, this.cursor);
                    // Jalankan syntax highlighting jika diperlukan (misal: Prism.js atau highlight.js)
                    const codeBlock = nextNode.node.querySelector('code');
                    if (codeBlock && typeof Prism !== 'undefined') {
                        Prism.highlightElement(codeBlock);
                    }
                    break;
            }
        }
        scrollToBottom(); // Pastikan chat selalu terlihat
    }
    
    /**
     * Menyelesaikan proses pengetikan, baik normal maupun dibatalkan.
     * @param {boolean} wasCancelled - Menandakan apakah proses ini dibatalkan.
     */
    _finalize(wasCancelled) {
        // Jika dibatalkan, langsung render seluruh HTML sisanya.
        if (wasCancelled) {
            // Hapus semua node yang ada saat ini untuk menghindari duplikasi
            while (this.rootElement.firstChild) {
                this.rootElement.removeChild(this.rootElement.firstChild);
            }
            // Masukkan HTML yang sudah jadi dan highlight semua blok kode
            this.rootElement.innerHTML = this.htmlContent;
            this.rootElement.querySelectorAll('pre code').forEach((block) => {
                if (typeof Prism !== 'undefined') {
                    Prism.highlightElement(block);
                }
            });
        }
        
        this.cursor?.remove(); // Hapus kursor dari DOM
        this.observer.disconnect(); // Hentikan observasi untuk membersihkan memori
        
        // Tampilkan elemen meta dan pulihkan UI
        this.metaElement.style.visibility = 'visible';
        restoreSendButton();
        input.disabled = false;
        input.focus();
        saveChatHistory();
        
        // Reset status global
        isTyping = false;
        typewriterControl.stop = () => {};
        currentTypewriterInstance = null;
        checkMessageCount(); // Panggil penghitung pesan setelah selesai
    }
}

/**
 * Fungsi pemicu untuk memulai efek typewriter.
 * Bertindak sebagai "jembatan" antara UI dan Class Typewriter.
 * @param {HTMLElement} element - Elemen target untuk pengetikan.
 * @param {string} htmlContent - Konten HTML untuk diketik.
 * @param {HTMLElement} metaElement - Elemen meta untuk ditampilkan setelah selesai.
 */
function typewriterEffect(element, htmlContent, metaElement) {
    if (isTyping) return; // Mencegah beberapa instance berjalan bersamaan
    
    isTyping = true;
    showStopTypingButton(); // Ubah tombol kirim menjadi tombol stop
    
    // Buat instance baru dari class canggih kita dan mulai
    currentTypewriterInstance = new Typewriter(element, htmlContent, metaElement);
    currentTypewriterInstance.start();

    // Arahkan fungsi stop global ke metode cancel pada instance yang sedang berjalan
    typewriterControl.stop = () => {
        if (currentTypewriterInstance) {
            currentTypewriterInstance.cancel();
        }
    };
}

function showLoader() {
    // ID unik untuk tag style agar mudah ditemukan dan dihapus
    const styleId = 'dynamic-loader-styles';
    document.getElementById(styleId)?.remove();

    // Membuat dan menyisipkan elemen <style> untuk animasi teks loader
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.innerHTML = `
      @keyframes shine {
        to { background-position: -200% center; }
      }
      .shining-text {
        font-size: 0.9em;
        margin-top: 8px;
        background-size: 200% auto;
        color: transparent;
        background-clip: text;
        -webkit-background-clip: text;
        animation: shine 2.5s linear infinite;
        background-image: linear-gradient(to right, #888 20%, #333 50%, #888 80%);
      }
      @media (prefers-color-scheme: dark) {
        .shining-text {
            background-image: linear-gradient(to right, #aaa 20%, #fff 50%, #aaa 80%);
        }
      }
    `;
    document.head.appendChild(styleElement);

    // --- PERUBAHAN UTAMA: Loader sekarang menjadi elemen simpel tanpa avatar ---
    const loaderWrapper = document.createElement("div");
    loaderWrapper.className = "loader-wrapper"; // Class simpel, bukan lagi 'message bot'
    loaderWrapper.innerHTML = `
      <div id="loader-content" style="display: flex; flex-direction: column; align-items: flex-start;">
        <lord-icon id="loader-icon" style="width:50px;height:50px;"></lord-icon>
        <p id="loader-text" class="shining-text"></p>
      </div>
    `;
    chatBox.appendChild(loaderWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;

    // --- STRUKTUR DATA BARU: Warna ikon dipisah untuk mode terang dan gelap ---
    const animationSteps = [
      { 
        iconSrc: "https://cdn.lordicon.com/zpxybbhl.json", 
        trigger: "loop", 
        text: "Mencari jawaban...", 
        colors: {
            light: { primary: '#64b5f6', secondary: '#bbdefb' }, // Biru Terang
            dark:  { primary: '#ffffff', secondary: '#ffffff' }  // Biru Gelap
        }
      },
      { 
        iconSrc: "https://cdn.lordicon.com/puvaffet.json", 
        trigger: "loop", 
        text: "Menulis Jawaban...",
        colors: {
            light: { primary: '#81c784', secondary: '#c8e6c9' }, // Hijau Terang
            dark:  { primary: '#ffffff', secondary: '#ffffff' }  // Hijau Gelap
        }
      },
      { 
        iconSrc: "https://cdn.lordicon.com/dutqakce.json", 
        trigger: "loop", 
        text: "Menyusun respons...",
        colors: {
            light: { primary: '#ffb74d', secondary: '#ffe0b2' }, // Oranye Terang
            dark:  { primary: '#ffffff', secondary: '#ffffff' }  // Oranye Gelap
        }
      },
      { 
        iconSrc: "https://cdn.lordicon.com/hjrbjhnq.json", 
        trigger: "loop", 
        text: "Hampir selesai!",
        colors: {
            light: { primary: '#e57373', secondary: '#ffcdd2' }, // Merah Terang
            dark:  { primary: '#ffffff', secondary: '#ffffff' }  // Merah Gelap
        }
      }
    ];

    let currentStep = 0;
    const loaderIcon = document.getElementById('loader-icon');
    const loaderText = document.getElementById('loader-text');

    function updateLoaderStep() {
        const step = animationSteps[currentStep];
        loaderIcon.src = step.iconSrc;
        loaderIcon.trigger = step.trigger;
        loaderText.innerText = step.text;

        // --- LOGIKA BARU YANG DIPERBAIKI: Pilih set warna ikon berdasarkan tema ---
        if (step.colors) {
            // 1. Cek tema saat ini setiap kali langkah diperbarui
            const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            // 2. Pilih objek warna yang sesuai (dark atau light)
            const themeColors = isDarkMode ? step.colors.dark : step.colors.light;

            // 3. Terapkan warna yang sudah dipilih
            loaderIcon.style.setProperty('--lord-icon-primary', themeColors.primary);
            loaderIcon.style.setProperty('--lord-icon-secondary', themeColors.secondary);
        }
        
        currentStep = (currentStep + 1) % animationSteps.length;
    }

    updateLoaderStep();
    const animationInterval = setInterval(updateLoaderStep, 4000);

    return {
      remove: () => {
        clearInterval(animationInterval);
        document.getElementById(styleId)?.remove();
        loaderWrapper.remove();
      }
    };
}

// --- FITUR CANGGIH 1 (REVISI FINAL): INPUT SUARA DENGAN SILENCE DETECTION ---
const micBtn = document.getElementById('micBtn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Canggih 1: Tambahkan style untuk animasi "mendengarkan" secara dinamis
const style = document.createElement('style');
style.innerHTML = `
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.7); }
    70% { transform: scale(1.05); box-shadow: 0 0 10px 15px rgba(0, 122, 255, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); }
  }
  #micBtn.listening {
    animation: pulse 1.5s infinite;
    background-color: #007aff; /* Warna biru yang lebih menonjol */
    color: white;
  }
`;
document.head.appendChild(style);


if (SpeechRecognition) {
  // Cek jika konteks tidak aman (bukan HTTPS)
  if (!window.isSecureContext) {
    micBtn.disabled = true;
    micBtn.title = "Fitur suara hanya aktif di koneksi HTTPS yang aman.";
    micBtn.style.opacity = '0.5';
    micBtn.style.cursor = 'not-allowed';
  } else {
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Terus mendengarkan bahkan setelah jeda singkat
    recognition.interimResults = true; // Dapatkan hasil sementara saat pengguna berbicara
    recognition.lang = 'id-ID';

    let isListening = false;
    let silenceTimer = null; // Timer untuk mendeteksi keheningan
    const SILENCE_DELAY = 1500; // Jeda 1.5 detik untuk dianggap hening

    // Fungsi untuk memulai sesi mendengarkan
    const startListening = () => {
      isListening = true;
      input.value = ''; // Kosongkan input setiap sesi baru
      finalTranscript = ''; // Reset transkrip final
      recognition.start();
      micBtn.classList.add('listening');
      micBtn.title = "Berhenti merekam...";
      input.placeholder = "Saya sedang mendengarkan...";
      btn.disabled = true; // Matikan tombol kirim saat merekam
    };
    
    // Fungsi untuk menghentikan sesi mendengarkan
    const stopListening = () => {
        isListening = false;
        recognition.stop();
        clearTimeout(silenceTimer); // Hapus timer jika dihentikan manual
        micBtn.classList.remove('listening');
        micBtn.title = "Gunakan suara";
        input.placeholder = "Ketik pesanmu di sini...";
    };

    // Event saat rekaman suara dimulai oleh browser
    recognition.onstart = () => {
      console.log('Speech recognition active.');
    };

    // Event saat ada hasil (baik sementara maupun final)
    recognition.onresult = (event) => {
      // Canggih 2: Silence Detection
      // Hapus timer lama dan atur yang baru setiap kali ada kata terdeteksi
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
          console.log("Silence detected, stopping recognition.");
          stopListening();
      }, SILENCE_DELAY);

      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      input.value = finalTranscript.trim() + ' ' + interimTranscript.trim();
    };
    
    // Event saat rekaman suara berakhir (baik manual, karena hening, atau error)
    recognition.onend = () => {
      console.log('Speech recognition ended.');
      stopListening(); // Pastikan semua state UI direset
      
      const finalResult = input.value.trim();
      if (finalResult) {
        console.log(`Final result: "${finalResult}". Sending message.`);
        // Canggih 3: Otomatis kirim pesan setelah selesai berbicara
        handleSendMessage(); 
      }
    };

    // Penanganan error yang lebih spesifik dan ramah pengguna
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      let errorMessage = "Terjadi kesalahan pada fitur suara.";
      switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
              errorMessage = "Akses mikrofon ditolak. Harap izinkan akses mikrofon di pengaturan browser Anda untuk menggunakan fitur ini.";
              break;
          case 'no-speech':
              errorMessage = "Tidak ada suara yang terdeteksi. Silakan coba lagi.";
              break;
          case 'audio-capture':
              errorMessage = "Gagal menangkap audio. Pastikan mikrofon Anda berfungsi dan tidak digunakan oleh aplikasi lain.";
              break;
          case 'network':
              errorMessage = "Masalah jaringan. Fitur suara memerlukan koneksi internet yang stabil.";
              break;
      }
      // Tampilkan pesan error dengan cara yang tidak mengganggu (misal: toast/alert)
      // Untuk contoh ini, kita gunakan alert.
      alert(errorMessage);
    };

    // Event listener utama untuk tombol mikrofon
    micBtn.addEventListener('click', () => {
      if (isListening) {
        stopListening();
      } else {
        // Minta izin dan mulai jika belum pernah
        try {
          startListening();
        } catch(e) {
          console.error("Gagal memulai recognition:", e);
          alert("Tidak dapat memulai fitur suara. Mungkin browser Anda tidak mendukung atau sedang ada masalah.");
        }
      }
    });
  }
} else {
  // Sembunyikan tombol jika browser tidak mendukung sama sekali
  micBtn.style.display = 'none';
  console.log("Speech Recognition tidak didukung oleh browser ini.");
}

// --- KODE BARU: FITUR UPLOAD FILE DAN GAMBAR (VERSI CANGGIH) ---

const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeUploadModalBtn = document.getElementById('closeUploadModal');
const dragDropZone = document.getElementById('dragDropZone');
const selectFileBtn = document.getElementById('selectFileBtn');
const fileInput = document.getElementById('fileInput');

const initialView = document.getElementById('uploadInitialView');
const previewView = document.getElementById('uploadPreviewView');

const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imageToCrop = document.getElementById('imageToCrop');
const filePreviewContainer = document.getElementById('filePreviewContainer');
const fileIcon = document.getElementById('fileIcon');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');

const cropBtn = document.getElementById('cropBtn');
const resetCropBtn = document.getElementById('resetCropBtn');
const fileCaption = document.getElementById('fileCaption');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');
const sendUploadBtn = document.getElementById('sendUploadBtn');
const progressContainer = document.getElementById('uploadProgressContainer');
const progressBar = document.getElementById('uploadProgressBar');

let cropper = null;
let currentFile = null;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // Naikkan batas jadi 15MB

// --- Fungsi untuk membuka & menutup modal ---
const openUploadModal = () => uploadModal.classList.add('show');
const closeUploadModal = () => {
    uploadModal.classList.remove('show');
    // Reset modal ke keadaan awal setelah ditutup
    setTimeout(() => {
        initialView.hidden = false;
        previewView.hidden = true;
        imagePreviewContainer.hidden = true;
        filePreviewContainer.hidden = true;
        progressContainer.hidden = true;
        progressBar.style.width = '0%';
        fileCaption.value = '';
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        currentFile = null;
        fileInput.value = ''; // Reset input file
        // Aktifkan kembali tombol setelah reset
        sendUploadBtn.disabled = false;
        cancelUploadBtn.disabled = false;
    }, 300);
};

// --- Fungsi untuk menangani file yang dipilih ---
const handleFile = (file) => {
    if (!file) return;

    // Validasi ukuran
    if (file.size > MAX_FILE_SIZE) {
        alert(`Ukuran file terlalu besar. Maksimal ${(MAX_FILE_SIZE / 1024 / 1024)}MB.`);
        return;
    }

    currentFile = file;
    initialView.hidden = true;
    previewView.hidden = false;

    // Cek apakah file adalah gambar yang dapat ditampilkan
    if (file.type.startsWith('image/') && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        imagePreviewContainer.hidden = false;
        filePreviewContainer.hidden = true;
        const reader = new FileReader();
        reader.onload = (e) => {
            imageToCrop.src = e.target.result;
            if (cropper) cropper.destroy();
            cropper = new Cropper(imageToCrop, {
                aspectRatio: 16 / 9,
                viewMode: 1,
                autoCropArea: 0.9,
                responsive: true,
                background: false
            });
        };
        reader.readAsDataURL(file);
    } else {
        // Handle untuk file non-gambar atau gambar yang tidak didukung cropper (contoh: svg)
        imagePreviewContainer.hidden = true;
        filePreviewContainer.hidden = false;
        fileName.textContent = file.name;
        fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
        fileIcon.textContent = getFileIcon(file.type, file.name);
    }
};

const getFileIcon = (fileType, fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word') || ['doc', 'docx'].includes(extension)) return 'description';
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || ['xls', 'xlsx'].includes(extension)) return 'analytics';
    if (fileType.includes('presentation') || ['ppt', 'pptx'].includes(extension)) return 'slideshow';
    if (fileType.includes('zip') || fileType.includes('rar') || ['zip', 'rar', '7z'].includes(extension)) return 'folder_zip';
    if (fileType.startsWith('video/')) return 'videocam';
    if (fileType.startsWith('audio/')) return 'audiotrack';
    if (fileType.startsWith('image/')) return 'image';
    return 'attach_file'; // Ikon default
};

/**
 * Fungsi pembungkus (wrapper) untuk XMLHttpRequest yang mengembalikan Promise.
 * Mengelola upload dan melaporkan progres.
 * @param {string} endpoint - URL tujuan upload.
 * @param {FormData} formData - Data yang akan di-upload.
 * @returns {Promise<string>} - Promise yang resolve dengan responseText atau reject dengan error.
 */
const attemptUpload = (endpoint, formData) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);

        // Lacak progres upload
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressBar.style.width = `${percentComplete}%`;
            }
        };

        // Handle saat upload selesai
        xhr.onload = () => {
            // Jika status sukses (2xx), resolve promise
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.responseText);
            } else {
                // Jika server merespons dengan error, reject promise
                reject(new Error(`Server merespons dengan status: ${xhr.status}`));
            }
        };

        // Handle error jaringan
        xhr.onerror = () => {
            reject(new Error('Terjadi kesalahan jaringan. Periksa koneksi Anda.'));
        };

        xhr.send(formData);
    });
};

// --- Fungsi utama untuk upload file dengan logika fallback ---
const uploadFile = async () => {
    if (!currentFile) return;

    sendUploadBtn.disabled = true;
    cancelUploadBtn.disabled = true;
    progressContainer.hidden = false;
    progressBar.style.width = '0%';

    const isDisplayableImage = currentFile.type.startsWith('image/') && cropper;
    const primaryEndpoint = isDisplayableImage ? '/gambar' : '/file';
    const fallbackEndpoint = '/tes';
    let fileToSend = currentFile;

    try {
        // Proses gambar (crop & kompresi) jika memungkinkan
        if (isDisplayableImage) {
            const canvas = cropper.getCroppedCanvas({ maxWidth: 1920, maxHeight: 1080 });
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            const compressedFile = await imageCompression(blob, {
                maxSizeMB: 2,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            });
            fileToSend = new File([compressedFile], currentFile.name, { type: 'image/jpeg' });
        }

        const formData = new FormData();
        formData.append('file', fileToSend);
        formData.append('caption', fileCaption.value);

        try {
            // --- Percobaan Pertama: Kirim ke endpoint utama ---
            console.log(`Mencoba mengunggah ke endpoint utama: ${primaryEndpoint}`);
            const responseText = await attemptUpload(primaryEndpoint, formData);
            const response = JSON.parse(responseText);
            appendFileMessageToChat(response.fileUrl, isDisplayableImage, fileCaption.value, currentFile.name);
            alert('File berhasil diunggah!');

        } catch (error) {
            // --- Percobaan Kedua (Fallback): Jika percobaan pertama gagal ---
            console.warn(`Upload ke endpoint utama gagal: ${error.message}. Mencoba fallback...`);
            alert("Koneksi ke server utama gagal. Mencoba koneksi alternatif...");

            // Reset progress bar untuk percobaan kedua
            progressBar.style.width = '0%';
            
            console.log(`Mencoba mengunggah ke endpoint fallback: ${fallbackEndpoint}`);
            const fallbackResponseText = await attemptUpload(fallbackEndpoint, formData);
            const fallbackResponse = JSON.parse(fallbackResponseText);
            appendFileMessageToChat(fallbackResponse.fileUrl, isDisplayableImage, fileCaption.value, currentFile.name);
            alert('File berhasil diunggah melalui koneksi alternatif!');
        }
        
        // Jika salah satu percobaan berhasil, tutup modal
        closeUploadModal();

    } catch (finalError) {
        // --- Jika kedua percobaan gagal ---
        console.error('Semua percobaan upload gagal:', finalError);
        alert(`Gagal total mengunggah file: ${finalError.message}. Silakan coba lagi nanti.`);
        // Aktifkan kembali tombol jika terjadi kegagalan total
        sendUploadBtn.disabled = false;
        cancelUploadBtn.disabled = false;
    }
};

// --- Fungsi untuk Menambahkan Pesan File ke Chat ---
// **PENTING**: Adaptasi fungsi ini agar sesuai dengan struktur `appendMessage` Anda.
function appendFileMessageToChat(url, isImage, caption, originalName) {
    const messageType = 'user'; // Anggap file yang diupload adalah pesan user
    let messageContent;

    if (isImage) {
        messageContent = `
            <div class="uploaded-image-container">
                <a href="${url}" target="_blank" title="Lihat gambar penuh">
                    <img src="${url}" alt="${caption || 'Gambar yang diunggah'}" style="max-width: 250px; border-radius: 8px; cursor: pointer;">
                </a>
                ${caption ? `<p class="uploaded-caption">${caption}</p>` : ''}
            </div>
        `;
    } else {
        const fileIconName = getFileIcon(currentFile.type, originalName);
        messageContent = `
            <div class="uploaded-file-container">
                <a href="${url}" target="_blank" download class="file-link" title="Unduh ${originalName}">
                    <span class="material-symbols-outlined">${fileIconName}</span>
                    <span class="file-link-name">${originalName}</span>
                </a>
                ${caption ? `<p class="uploaded-caption">${caption}</p>` : ''}
            </div>
        `;
    }

    // Panggil fungsi append message yang sudah ada dengan konten baru.
    // Ganti 'appendInstantMessage' jika Anda punya nama fungsi yang berbeda.
    appendInstantMessage(messageType, messageContent);
}

// --- Event Listeners ---
uploadBtn.addEventListener('click', openUploadModal);
closeUploadModalBtn.addEventListener('click', closeUploadModal);
cancelUploadBtn.addEventListener('click', closeUploadModal);
selectFileBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

// Listener untuk drag & drop
dragDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dragDropZone.classList.add('active');
});

dragDropZone.addEventListener('dragleave', () => {
    dragDropZone.classList.remove('active');
});

dragDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDropZone.classList.remove('active');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// Listener untuk tombol di modal
if(cropBtn) cropBtn.addEventListener('click', () => cropper?.crop());
if(resetCropBtn) resetCropBtn.addEventListener('click', () => cropper?.reset());
sendUploadBtn.addEventListener('click', uploadFile);
});