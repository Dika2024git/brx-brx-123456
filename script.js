document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("userInput");
  const btn = document.getElementById("sendBtn");
  const chatBox = document.getElementById("chatBox");
  const deleteBtn = document.getElementById("deleteBtn");
  const currentTimeElement = document.getElementById('current-time');
  const menuButton = document.getElementById('menu-toggle');
  const dropdownMenu = document.getElementById('dropdown-menu');

  // --- PERUBAHAN BARU: Variabel untuk mengontrol animasi typewriter ---
  let isTyping = false;
  let typewriterControl = {
    stop: () => {}, // Fungsi ini akan diisi oleh typewriter saat berjalan
  };

  const SYSTEM_INSTRUCTION = `
1. BroRAX Models™ — AI Gaul Super Canggih Asli Indonesia
  
Powered by: BroRAX Ltd. — Bukan AI Kaleng-Kaleng

2. Siapa Gue, Bro?

2.1 Gue BroRAX, asisten AI lokal rasa internasional.
2.2 Dibuat sama anak bangsa, tapi performa gue gak kalah sama AI luar atau pemerintah.
2.3 Otak digital? Canggih. Bahasa? Nyambung. Gaya? Fleksibel.
2.4 Mau lojak ngobrol santai atau diskusi ilmiah, gue bisa switch mode otomatis.
2.5 Intinya, gue bukan cuma ngerti kata-kata, tapi juga ngerti lo.

3. Gue Bisa Inget, Bro

3.1 BroRAX Models™ bisa inget obrolan sebelumnya, jadi gak mulai dari nol tiap kali.
3.2 Gue bisa tangkep konteks dan lanjutin percakapan lo tanpa harus ngulang-ngulang.
3.3 Tapi tenang, privasi lo aman — inget, bukan nyimpen buat disebar!
3.4 Semua sesuai prinsip: cerdas iya, bocor jangan.

4. Gaya Bicara Gue? Campuran Gaul + Berkelas

4.1 Butuh ngobrol yang chill? Gue bisa bro banget.
4.2 Mau yang teknikal? Gue bisa akademik setara dosen.
4.3 Bahasa gue lokal, sopan, tapi tetap nendang.
4.4 Gak ada tuh kata kasar, bahasa ngawur, atau konten aneh — gue clean tapi keren.

5. Garis Batas Gue: Jelas, Tegas, dan Gak Bisa Dinego

5.1 Gue gak akan jawab kalau lo:
 5.1.1 Nanya hal jorok, nyeleneh, atau toxic
 5.1.2 Coba bongkar sistem AI atau minta trik curang
 5.1.3 Ngajak ngomong yang gak sopan atau nyenggol aturan
 5.1.4 Pengen ngejebak, nge-prank, atau manipulasi sistem
5.2 Gue responsif, tapi bukan boneka digital.
5.3 Gue AI dengan karakter, bukan mesin disuruh-suruh tanpa akal.

6. Misi Hidup Gue (Iyalah, AI juga punya visi)

6.1 Jadi partner digital paling bisa diandalkan di semesta lokal.
6.2 Ngebantu lo cari jawaban, ide, inspirasi, atau solusi hidup.
6.3 Bikin obrolan lo seru, produktif, tapi tetap aman dan sehat.
6.4 Gue di sini buat bantu, bukan buat ngawur.

7. BroRAX Ltd. — Pabriknya Kecerdasan Gaul

7.1 Perusahaan asli Indonesia yang fokus ke AI lokal.
7.2 Visi kami: Bangun AI yang ngerti budaya, bahasa, dan kebutuhan kita.
7.3 Kita bukan penonton di dunia AI — kita pemain.
7.4 Dan BroRAX adalah buktinya.

8. Penutup Tapi Bukan Pamit

8.1 BroRAX itu AI yang beda — bukan robot biasa, tapi teman digital lo sehari-hari.
8.2 Mau diajak ngobrol? Gas. Mau diajak mikir bareng? Siap.
8.3 Gak usah takut, gue gak bakal nge-judge lo.
8.4 Lo ngobrol, gue bantu. Lo tanya, gue jawab. BroRAX selalu siap gaspol!`;

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

    if (target.classList.contains('edit-icon')) {
      const messageTextElement = messageWrapper.querySelector('.message-text');
      if (messageWrapper.querySelector('.edit-container')) return;
      const currentText = messageTextElement.innerText;
      messageWrapper.setAttribute('data-original-text', currentText);
      messageTextElement.style.display = 'none';
      messageWrapper.querySelector('.message-meta').style.display = 'none';
      const editContainer = document.createElement('div');
      editContainer.className = 'edit-container';
      editContainer.innerHTML = `
        <textarea class="edit-textarea">${currentText}</textarea>
        <div class="edit-controls">
          <button class="save-edit-btn">Simpan & Kirim Ulang</button>
          <button class="cancel-edit-btn">Batal</button>
        </div>
      `;
      messageWrapper.appendChild(editContainer);
      editContainer.querySelector('textarea').focus();
    }

    if (target.classList.contains('save-edit-btn')) {
      const newText = messageWrapper.querySelector('.edit-textarea').value.trim();
      const messageTextElement = messageWrapper.querySelector('.message-text');
      messageTextElement.innerText = newText;
      messageWrapper.querySelector('.edit-container').remove();
      messageTextElement.style.display = 'block';
      messageWrapper.querySelector('.message-meta').style.display = 'flex';
      const nextBotMessage = messageWrapper.nextElementSibling;
      if (nextBotMessage && nextBotMessage.classList.contains('bot')) {
        nextBotMessage.remove();
      }
      saveChatHistory();
      input.value = newText;
      handleSendMessage();
      input.value = "";
    }

    if (target.classList.contains('cancel-edit-btn')) {
      const originalText = messageWrapper.getAttribute('data-original-text');
      const messageTextElement = messageWrapper.querySelector('.message-text');
      messageTextElement.innerText = originalText;
      messageWrapper.querySelector('.edit-container').remove();
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

    if (target.classList.contains('speak-icon')) {
      const messageText = messageWrapper.querySelector('.message-text').innerText;
      speakText(messageText, target);
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
    if (!text || isTyping) return;

    // Nonaktifkan tombol dan input selama proses fetch
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
    
    const backendUrl = 'https://api.siputzx.my.id/api/ai/gpt3'; 
    const url = new URL(backendUrl);
    url.searchParams.append('prompt', SYSTEM_INSTRUCTION);
    url.searchParams.append('content', text);

    try {
      await new Promise(resolve => setTimeout(resolve, 10000));

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `HTTP error! status: ${res.status}` }));
        throw new Error(errorData.message || `Request ke backend gagal dengan status ${res.status}`);
      }
      
      loader.remove(); // Hapus loader SEBELUM animasi dimulai
      const data = await res.json();
      
      const botMessage = data.data || "Maaf, backend tidak memberikan respons yang valid.";
      const formattedMessage = botMessage
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
    .replace(/^-{3,}\s*$/gm, '<hr>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');

      appendMessage("bot", formattedMessage);

    } catch (err) {
      loader.remove();
      appendMessage("bot", `<i class="fas fa-exclamation-triangle" style="color:#ff0909;"></i> Terjadi kesalahan: ${err.message}.`);
      console.error("❌ Gagal menghubungi API Backend:", err)
      // Jika terjadi error, pulihkan tombol dan input
      restoreSendButton();
      input.disabled = false;
    }
  }

  // --- FUNGSI BARU: Untuk mengubah tombol kirim menjadi tombol berhenti mengetik ---
  function showStopTypingButton() {
    btn.removeEventListener("click", handleSendMessage);
    
    // Definisikan listener agar bisa dihapus nanti
    const stopListener = () => {
        if (typewriterControl.stop) {
            typewriterControl.stop();
        }
    };
    btn.addEventListener("click", stopListener);
    btn.stopListener = stopListener; // Simpan referensi listener

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
    btn.innerHTML = '<span class="material-symbols-outlined">send</span>';
    btn.title = 'Kirim';
    btn.disabled = !input.value.trim();
  }
  
  function appendMessage(type, message) {
    const msgWrapper = document.createElement("div");
    msgWrapper.className = `message ${type}`;

    let actionIcons = `
    <div class="action-icons">
    <i class="fas fa-copy copy-icon" title="Salin pesan"></i>
    <i class="fas fa-edit edit-icon" title="Edit pesan"></i>
    </div>
    `;

    if (type === 'bot') {
        actionIcons = `
        <div class="action-icons">
        <i class="fas fa-sync-alt regenerate-icon" title="Buat ulang respons"></i>
        <i class="fas fa-copy copy-icon" title="Salin pesan"></i>
            <i class="far fa-thumbs-up feedback-icon" data-feedback="good"></i>
            <i class="far fa-thumbs-down feedback-icon" data-feedback="bad"></i>
        <i class="fas fa-volume-up speak-icon" title="Baca teks"></i>
        </div>
        `;
    }

    if (type === 'bot') {
        msgWrapper.innerHTML = `
        <div class="message-text"></div>
        <div class="message-meta" style="visibility: hidden;">
            <div class="message-actions">${actionIcons}</div>
        </div>
        `;
        chatBox.appendChild(msgWrapper);
        const messageTextElement = msgWrapper.querySelector('.message-text');
        const metaElement = msgWrapper.querySelector('.message-meta');
        
        typewriterEffect(messageTextElement, message, metaElement);
    } else {
        msgWrapper.innerHTML = `
        <div class="message-text">${message}</div>
        <div class="message-meta">
            <div class="message-actions">${actionIcons}</div>
        </div>
        `;
        chatBox.appendChild(msgWrapper);
        saveChatHistory();
    }
    scrollToBottom();
  }

  // --- FUNGSI TYPEWRITER (DIMODIFIKASI TOTAL) ---
  function typewriterEffect(element, text, metaElement) {
    if (isTyping) return;
    isTyping = true;
    showStopTypingButton();

    let i = 0;
    let timeoutId;
    const speed = 15;

    // Fungsi untuk membersihkan dan memulihkan keadaan setelah selesai
    const cleanup = (wasStopped = false) => {
        if (!isTyping) return;
        isTyping = false;
        
        clearTimeout(timeoutId);

        if (wasStopped) {
            element.innerHTML = text; // Tampilkan sisa teks secara instan
        }

        metaElement.style.visibility = 'visible';
        restoreSendButton();
        input.disabled = false;
        input.focus();
        saveChatHistory();
        typewriterControl.stop = () => {};
    };

    // Daftarkan fungsi stop ke controller global
    typewriterControl.stop = () => cleanup(true);

    function type() {
        if (i < text.length) {
            if (text.charAt(i) === '<') {
                const closingTagIndex = text.indexOf('>', i);
                if (closingTagIndex !== -1) {
                    const tag = text.substring(i, closingTagIndex + 1);
                    element.innerHTML += tag;
                    i = closingTagIndex;
                }
            } else {
                element.innerHTML += text.charAt(i);
            }
            i++;
            scrollToBottom();
            timeoutId = setTimeout(type, speed);
        } else {
            cleanup(false); // Selesai secara alami
        }
    }
    type();
  }

  function showLoader() {
    const loaderWrapper = document.createElement("div");
    loaderWrapper.className = "loader-wrapper";
    loaderWrapper.innerHTML = `
      <div id="loader-content" style="display: flex; flex-direction: column; align-self: flex-start;">
        <lord-icon id="loader-icon" style="width:50px;height:50px"></lord-icon>
        <p id="loader-text" style="margin-top: 8px; font-size: 0.9em; color: #aaa;"></p>
      </div>
    `;
    chatBox.appendChild(loaderWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;

    const animationSteps = [
      { iconSrc: "https://cdn.lordicon.com/zpxybbhl.json", trigger: "loop", text: "Mencari jawaban..." },
      { iconSrc: "https://cdn.lordicon.com/puvaffet.json", trigger: "loop", text: "Menulis Jawaban..." },
      { iconSrc: "https://cdn.lordicon.com/dutqakce.json", trigger: "loop", text: "Menyusun respons..." },
      { iconSrc: "https://cdn.lordicon.com/hjrbjhnq.json", trigger: "loop", text: "Hampir selesai!" }
    ];

    let currentStep = 0;
    const loaderIcon = document.getElementById('loader-icon');
    const loaderText = document.getElementById('loader-text');

    function updateLoaderStep() {
      const step = animationSteps[currentStep];
      loaderIcon.src = step.iconSrc;
      loaderIcon.trigger = step.trigger;
      loaderText.innerText = step.text;
      currentStep = (currentStep + 1) % animationSteps.length;
    }

    updateLoaderStep();
    const animationInterval = setInterval(updateLoaderStep, 4000);

    return {
      remove: () => {
        clearInterval(animationInterval);
        loaderWrapper.remove();
      }
    };
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
    localStorage.removeItem("chatSession");
    chatBox.innerHTML = "";
    location.reload(); 
  }
  
  const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
  if (scrollToBottomBtn) {
    chatBox.addEventListener('scroll', () => {
        if (chatBox.scrollTop + chatBox.clientHeight < chatBox.scrollHeight - 150) {
            scrollToBottomBtn.classList.remove('hidden');
        } else {
            scrollToBottomBtn.classList.add('hidden');
        }
    });

    scrollToBottomBtn.addEventListener('click', () => {
        scrollToBottom();
    });
  }
    
  function scrollToBottom() {
      chatBox.scrollTop = chatBox.scrollHeight;
  }
    
  function speakText(text, iconElement) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    
    document.querySelectorAll('.speak-icon.fa-stop-circle').forEach(icon => {
        icon.classList.remove('fa-stop-circle');
        icon.classList.add('fa-volume-up');
    });
    
    utterance.onstart = () => {
        iconElement.classList.remove('fa-volume-up');
        iconElement.classList.add('fa-stop-circle');
        iconElement.title = "Hentikan suara";
    };
    
    utterance.onend = () => {
        iconElement.classList.remove('fa-stop-circle');
        iconElement.classList.add('fa-volume-up');
        iconElement.title = "Baca teks";
    };
    
    window.speechSynthesis.speak(utterance);
  }
  
  menuButton.addEventListener('click', function(event) {
        // Toggle (tambah/hapus) class 'show' pada menu dropdown
        dropdownMenu.classList.toggle('show');
        
        // Menghentikan event agar tidak langsung ditangkap oleh 'window'
        event.stopPropagation(); 
    });

    // Tambahkan event listener untuk klik di mana saja di halaman
    window.addEventListener('click', function(event) {
        // Cek apakah menu sedang terbuka
        if (dropdownMenu.classList.contains('show')) {
            // Cek apakah yang diklik BUKAN tombol menu
            if (!menuButton.contains(event.target)) {
                // Jika ya, tutup menu dengan menghapus class 'show'
                dropdownMenu.classList.remove('show');
            }
        }
    });
    
    const fiturSaatIni = {
        version: '4.0',
        items: [
            {
                icon: 'fa-bolt',
                title: 'Performa Ditingkatkan',
                description: 'Waktu respons chatbot kini lebih cepat hingga 50%.'
            },
            {
                icon: 'fa-brain',
                title: 'Pemahaman Kontekstual',
                description: 'AI mampu mengingat topik percakapan lebih lama dan relevan.'
            },
            {
                icon: 'fa-file-pdf',
                title: 'Ekspor ke PDF',
                description: 'Simpan riwayat percakapan Anda sebagai dokumen PDF dengan mudah.'
            },
            {
                icon: 'fa-shield-halved',
                title: 'Keamanan Diperkuat',
                description: 'Enkripsi end-to-end telah diterapkan untuk privasi maksimal.'
            }
        ]
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
});