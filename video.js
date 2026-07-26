// video.js – Infinityamit Video Player (HLS + MP4)
(function() {
  'use strict';

  let overlay, video, playBtn, skipBack, skipForward, timeDisplay, progressWrap, progressBar, closeBtn, titleEl, speedBtns;
  let hlsInstance = null;
  let isPlaying = false;
  let currentSpeed = 1;

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function init(config) {
    overlay = document.getElementById(config.overlayId || 'videoOverlay');
    video = document.getElementById(config.videoId || 'videoPlayer');
    playBtn = document.getElementById(config.playBtnId || 'playBtn');
    skipBack = document.getElementById(config.skipBackId || 'skipBackBtn');
    skipForward = document.getElementById(config.skipForwardId || 'skipForwardBtn');
    timeDisplay = document.getElementById(config.timeDisplayId || 'timeDisplay');
    progressWrap = document.getElementById(config.progressWrapId || 'progressWrap');
    progressBar = document.getElementById(config.progressBarId || 'progressBar');
    closeBtn = document.getElementById(config.closeBtnId || 'closeVideo');
    titleEl = document.getElementById(config.titleId || 'videoTitle');
    speedBtns = document.querySelectorAll('.speed-group button');

    if (!overlay || !video) {
      console.error('VideoPlayer: required elements not found');
      return;
    }

    playBtn.addEventListener('click', togglePlay);
    skipBack.addEventListener('click', () => {
      video.currentTime = Math.max(0, video.currentTime - 10);
    });
    skipForward.addEventListener('click', () => {
      video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
    });
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', () => {
      if (video.duration) {
        timeDisplay.textContent = `0:00 / ${formatTime(video.duration)}`;
      }
    });
    progressWrap.addEventListener('click', (e) => {
      const rect = progressWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      if (video.duration) {
        video.currentTime = x * video.duration;
      }
    });
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSpeed = parseFloat(btn.dataset.speed);
        video.playbackRate = currentSpeed;
      });
    });
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
    video.addEventListener('click', togglePlay);

    console.log('VideoPlayer initialized');
  }

  function togglePlay() {
    if (video.paused) {
      video.play().catch(() => {});
      isPlaying = true;
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
      video.pause();
      isPlaying = false;
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  }

  function updateProgress() {
    if (video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      progressBar.style.width = pct + '%';
      timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    }
  }

  function open(url, title) {
    if (!url) {
      alert('No video URL provided.');
      return;
    }
    titleEl.textContent = title || 'Lecture';
    overlay.classList.add('open');

    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    if (url.includes('.m3u8') || url.includes('m3u8')) {
      if (Hls && Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
          isPlaying = true;
          playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        });
        hlsInstance.on(Hls.Events.ERROR, (e, data) => {
          if (data.fatal) {
            console.warn('HLS fatal error, trying recovery...');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play().catch(() => {});
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      } else {
        alert('HLS is not supported in this browser.');
      }
    } else {
      video.src = url;
      video.load();
      video.play().catch(() => {});
      isPlaying = true;
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
  }

  function close() {
    overlay.classList.remove('open');
    video.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    video.src = '';
    titleEl.textContent = 'Lecture';
  }

  window.VideoPlayer = {
    init: init,
    open: open,
    close: close
  };

})();
