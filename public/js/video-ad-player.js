/**
 * Video Ad Player
 * Drop-in video player with ad support (pre-roll, mid-roll, post-roll)
 * 
 * Usage:
 * <div id="video-player" 
 *      data-video-src="/videos/my-content.mp4"
 *      data-ad-zone="video-player"
 *      data-pre-roll="true"
 *      data-mid-roll="120"  
 * ></div>
 * <script src="/js/video-ad-player.js"></script>
 */

class VideoAdPlayer {
  constructor(container) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.videoSrc = this.container.dataset.videoSrc;
    this.adZone = this.container.dataset.adZone || 'video-player';
    this.preRoll = this.container.dataset.preRoll === 'true';
    this.midRollTime = parseInt(this.container.dataset.midRoll) || null;
    this.postRoll = this.container.dataset.postRoll === 'true';
    
    this.currentAd = null;
    this.adPlaying = false;
    this.midRollPlayed = false;
    
    this.init();
  }

  async init() {
    this.createPlayer();
    
    if (this.preRoll) {
      await this.playAd('pre-roll');
    }
    
    this.playContent();
  }

  createPlayer() {
    this.container.innerHTML = `
      <div class="vap-wrapper" style="position:relative;width:100%;background:#000;">
        <video class="vap-content" style="width:100%;display:none;"></video>
        <video class="vap-ad" style="width:100%;display:none;"></video>
        <div class="vap-overlay" style="display:none;position:absolute;bottom:0;left:0;right:0;padding:10px;background:linear-gradient(transparent,rgba(0,0,0,0.8));">
          <span class="vap-ad-label" style="color:#ff0;font-size:12px;">Ad</span>
          <span class="vap-skip" style="float:right;color:#fff;cursor:pointer;display:none;">Skip Ad ➔</span>
          <div class="vap-progress" style="height:3px;background:#333;margin-top:5px;">
            <div class="vap-progress-bar" style="height:100%;background:#ff0;width:0%;"></div>
          </div>
        </div>
        <div class="vap-loading" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;">Loading...</div>
      </div>
    `;

    this.contentVideo = this.container.querySelector('.vap-content');
    this.adVideo = this.container.querySelector('.vap-ad');
    this.overlay = this.container.querySelector('.vap-overlay');
    this.skipBtn = this.container.querySelector('.vap-skip');
    this.progressBar = this.container.querySelector('.vap-progress-bar');
    this.loading = this.container.querySelector('.vap-loading');

    this.contentVideo.src = this.videoSrc;
    
    // Mid-roll check
    this.contentVideo.addEventListener('timeupdate', () => this.checkMidRoll());
    this.contentVideo.addEventListener('ended', () => this.onContentEnded());
    
    // Skip button
    this.skipBtn.addEventListener('click', () => this.skipAd());
  }

  async playAd(position) {
    this.loading.style.display = 'block';
    
    try {
      const response = await fetch(`/api/ads/video?position=${position}&zone=${this.adZone}`);
      const ad = await response.json();
      
      if (ad.noAd) {
        this.loading.style.display = 'none';
        return false;
      }

      this.currentAd = ad;
      this.adPlaying = true;
      
      // Track impression
      this.track('impression');
      
      this.adVideo.src = ad.videoUrl;
      this.adVideo.style.display = 'block';
      this.contentVideo.style.display = 'none';
      this.overlay.style.display = 'block';
      this.loading.style.display = 'none';

      // Setup skip button
      if (ad.skipAfter) {
        let skipCountdown = ad.skipAfter;
        this.skipBtn.textContent = `Skip in ${skipCountdown}s`;
        this.skipBtn.style.display = 'inline';
        
        const skipInterval = setInterval(() => {
          skipCountdown--;
          if (skipCountdown <= 0) {
            this.skipBtn.textContent = 'Skip Ad ➔';
            this.skipBtn.style.cursor = 'pointer';
            clearInterval(skipInterval);
          } else {
            this.skipBtn.textContent = `Skip in ${skipCountdown}s`;
          }
        }, 1000);
      }

      // Track progress
      this.adVideo.addEventListener('timeupdate', () => this.onAdProgress());
      this.adVideo.addEventListener('ended', () => this.onAdEnded());
      
      // Click tracking
      this.adVideo.addEventListener('click', () => {
        this.track('click');
        window.open(ad.clickUrl, '_blank');
      });

      await this.adVideo.play();
      this.track('start');
      
      return true;
    } catch (err) {
      console.error('Failed to load video ad:', err);
      this.loading.style.display = 'none';
      return false;
    }
  }

  onAdProgress() {
    const progress = (this.adVideo.currentTime / this.adVideo.duration) * 100;
    this.progressBar.style.width = `${progress}%`;
    
    // Track quartiles
    if (progress >= 25 && !this.trackedFirstQuartile) {
      this.track('firstQuartile');
      this.trackedFirstQuartile = true;
    }
    if (progress >= 50 && !this.trackedMidpoint) {
      this.track('midpoint');
      this.trackedMidpoint = true;
    }
    if (progress >= 75 && !this.trackedThirdQuartile) {
      this.track('thirdQuartile');
      this.trackedThirdQuartile = true;
    }
  }

  onAdEnded() {
    this.track('complete');
    this.adPlaying = false;
    this.hideAd();
  }

  skipAd() {
    if (this.currentAd?.skipAfter && this.adVideo.currentTime >= this.currentAd.skipAfter) {
      this.track('skip');
      this.adPlaying = false;
      this.hideAd();
    }
  }

  hideAd() {
    this.adVideo.style.display = 'none';
    this.overlay.style.display = 'none';
    this.adVideo.pause();
    this.playContent();
  }

  playContent() {
    this.contentVideo.style.display = 'block';
    this.contentVideo.play();
  }

  async checkMidRoll() {
    if (this.midRollTime && !this.midRollPlayed && !this.adPlaying) {
      if (this.contentVideo.currentTime >= this.midRollTime) {
        this.midRollPlayed = true;
        this.contentVideo.pause();
        await this.playAd('mid-roll');
      }
    }
  }

  async onContentEnded() {
    if (this.postRoll) {
      await this.playAd('post-roll');
    }
  }

  track(event) {
    if (this.currentAd?.trackingUrls?.[event]) {
      new Image().src = this.currentAd.trackingUrls[event];
    }
  }
}

// Auto-init all video players on page
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-video-src]').forEach(el => {
    new VideoAdPlayer(el);
  });
});

// Export for manual use
window.VideoAdPlayer = VideoAdPlayer;

