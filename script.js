/* eslint-disable */

// --- FUNGSI LATAR BELAKANG PARTIKEL ---
particlesJS("particles-js", {
  "particles": {
    "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
    "color": { "value": "#ffffff" },
    "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" } },
    "opacity": { "value": 0.5, "random": false, "anim": { "enable": false } },
    "size": { "value": 3, "random": true, "anim": { "enable": false } },
    "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 },
    "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
    "modes": { "grab": { "distance": 400, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 200, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } }
  },
  "retina_detect": true
});

// --- FUNGSI HITUNG MUNDUR ---
(function () {
  // PENTING: Atur tanggal peluncuran Anda di sini!
  // Format: "Bulan Hari, Tahun Jam:Menit:Detik"
  const launchDate = new Date("October 1, 2025 00:00:00").getTime();

  const countdown = setInterval(function() {
    const now = new Date().getTime();
    const distance = launchDate - now;

    // Perhitungan waktu
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Tampilkan di HTML (tambahkan '0' jika angka < 10)
    document.getElementById("days").innerText = days < 10 ? '0' + days : days;
    document.getElementById("hours").innerText = hours < 10 ? '0' + hours : hours;
    document.getElementById("minutes").innerText = minutes < 10 ? '0' + minutes : minutes;
    document.getElementById("seconds").innerText = seconds < 10 ? '0' + seconds : seconds;

    // Jika hitung mundur selesai
    if (distance < 0) {
      clearInterval(countdown);
      document.getElementById("countdown").innerHTML = "<h2>BroRAX Telah Hadir!</h2>";
    }
  }, 1000);
})();


// --- FUNGSI FORMULIR NOTIFIKASI ---
document.getElementById("notify-form").addEventListener("submit", function(event) {
  event.preventDefault(); // Mencegah form untuk refresh halaman

  const formContainer = document.getElementById("form-container");
  const successMessage = document.getElementById("success-message");

  // Sembunyikan form dan tampilkan pesan sukses dengan animasi
  formContainer.style.transition = "opacity 0.5s ease";
  formContainer.style.opacity = "0";

  setTimeout(() => {
    formContainer.style.display = "none";
    successMessage.style.display = "block";
    successMessage.style.transition = "opacity 0.5s ease";
    successMessage.style.opacity = "0";
    setTimeout(() => {
        successMessage.style.opacity = "1";
    }, 50)
  }, 500);
});