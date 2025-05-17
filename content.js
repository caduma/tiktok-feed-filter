let lastScrollIndex = null;
let enableSkipping = false;
let skipLive = false;
let skipAds = false;
let skipTags = false;
let skipDuration = false;
let tagsToSkip = [];
let minToSkip = 0;
let maxToSkip = 0; 

function skipCurrentVideo() {
    const targetPathD = "m24 27.76 13.17-13.17a1 1 0 0 1 1.42 0l2.82 2.82a1 1 0 0 1 0 1.42L25.06 35.18a1.5 1.5 0 0 1-2.12 0L6.59 18.83a1 1 0 0 1 0-1.42L9.4 14.6a1 1 0 0 1 1.42 0L24 27.76Z";
    const allPaths = document.querySelectorAll('svg path');
    for (const path of allPaths) {
        if (path.getAttribute('d') === targetPathD) {
            const divContainingSvg = path.closest('div');
            if (divContainingSvg) {
                const button = divContainingSvg.closest('button');
                if (button) {
                    button.click();
                } 
                break;
            }
        }
    }
}

function findDurationElement(article) {
  if (!article) return null;

  const xpath = ".//p[contains(text(),'/')]";
  const result = document.evaluate(xpath, article, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

  for (let i = 0; i < result.snapshotLength; i++) {
      const p = result.snapshotItem(i);
      if (/^\d{2}:\d{2} \/ \d{2}:\d{2}$/.test(p.textContent.trim())) {
          return p;
      }
  }
  return null;
}

function isAdArticle(article) {
    if (!article) return false;
    const allElements = article.querySelectorAll('*');
    for (const el of allElements) {
        const text = el.textContent?.trim().toLowerCase();
        if (text === 'ad' || text === 'paid partnership') return true;
    }
    return false;
}

function isLiveArticle(article) {
    if (!article) return false;
    const allElements = article.querySelectorAll('*');
    for (const el of allElements) {
        const text = el.textContent?.replace(/\s+/g, ' ').trim().toLowerCase();
        console.log("[TikTok-Feed-Filter] - " + el.textContent);
        if (text.includes('live now')) return true;
    }
    return false;
}

function shouldSkipVideo(description, tags, isAd, isLive, duration) {
  if (enableSkipping === false) {
      return enableSkipping;
  }

  console.log("[TikTok-Feed-Filter] - Ad: " + isAd + " / tags: " + tags + " / duration: " + duration);

  if (skipLive && isLive) {
    console.log("[TikTok-Feed-Filter] - Skipped based on live");
    return true;
  }


  if (skipAds && isAd) {
    console.log("[TikTok-Feed-Filter] - Skipped based on ad");
    return true;
  }

  if (skipTags) {
      const descLower = description.toLowerCase();
      for (const tag of tagsToSkip) {
          if (descLower.includes(tag) || tags.some(t => t.toLowerCase() === tag)) {
              console.log("[TikTok-Feed-Filter] - Skipped based on tags");
              return true;
          }
      }
  }

  if (skipDuration && duration > 0) {
      if (duration < minToSkip) {
          console.log("[TikTok-Feed-Filter] - Skipped based on min duration");
          return true;
      }
      if (duration > maxToSkip) {
          console.log("[TikTok-Feed-Filter] - Skipped based on max duration");
          return true;
      }
  }

  return false;
}

function getTotalSecondsFromTimeDisplay(timeDisplay) {
    if (timeDisplay) {
        const timeText = timeDisplay.textContent.trim();
        const [current, total] = timeText.split('/').map(s => s.trim());
    
        function timeToSeconds(timeStr) {
          const parts = timeStr.split(':').map(Number);
          return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
        }
    
        return timeToSeconds(total);
    }

    return 0;
}

function extractFromActiveArticle() {
    const articles = document.querySelectorAll('article[data-e2e="recommend-list-item-container"]');
    let activeArticle = null;

    articles.forEach(article => {
        const rect = article.getBoundingClientRect();
        const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (inView) activeArticle = article;
        const livePlayerDiv = article.querySelector('div[class$="-DivRecommendLivePlayerContainer"]');
        if (livePlayerDiv) activeArticle = article;
    });

    if (!activeArticle) return;

    const currentIndex = activeArticle.getAttribute('data-scroll-index');
    if (currentIndex === lastScrollIndex) return;
    lastScrollIndex = currentIndex;

    const descContainer = activeArticle.querySelector('div[data-e2e="video-desc"]');
    if (!descContainer) return;

    const spans = descContainer.querySelectorAll('span[data-e2e="new-desc-span"]');
    const description = Array.from(spans)
      .map(span => span.textContent.trim())
      .filter(Boolean)
      .join(' ');

    const tagLinks = descContainer.querySelectorAll('a[data-e2e="search-common-link"]');
    const tags = Array.from(tagLinks)
      .map(link => link.querySelector('strong')?.textContent.trim())
      .filter(text => text && text.startsWith('#'));

    console.clear()
    const isAd = isAdArticle(activeArticle);
    const isLive = isLiveArticle(activeArticle);
    const timeDisplay = findDurationElement(activeArticle);
    const totalSeconds = getTotalSecondsFromTimeDisplay(timeDisplay);

    if (shouldSkipVideo(description, tags, isAd, isLive, totalSeconds)) {
        setTimeout(skipCurrentVideo, 200);
    }
}

function startObserver() {
    const feed = document.querySelector('body');

    const observer = new MutationObserver(() => {
      setTimeout(extractFromActiveArticle, 300);
    });

    observer.observe(feed, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('scroll', () => {
      setTimeout(extractFromActiveArticle, 200);
    });

    extractFromActiveArticle();
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    for (let key in changes) {
      const newValue = changes[key].newValue;

      switch (key) {
        case 'enableSkipping':
          enableSkipping = newValue;
          break;
        case 'skipLive':
          skipLive = newValue;
          break;
        case 'skipAds':
          skipAds = newValue;
          break;
        case 'skipTags':
          skipTags = newValue;
          break;
        case 'skipDuration':
          skipDuration = newValue;
          break;
        case 'tagsToSkip':
          tagsToSkip = Array.isArray(newValue) ? newValue : [];
          break;
        case 'minToSkip':
          minToSkip = newValue || 0;
          break;
        case 'maxToSkip':
          maxToSkip = newValue || 9999;
          break;
      }
    }

    logSettings();
  }
});

function loadSettings(callback) {
  chrome.storage.sync.get(
    ['enableSkipping', 'skipLive', 'skipAds', 'skipTags', 'skipDuration', 'tagsToSkip', 'minToSkip', 'maxToSkip'],
    (result) => {
      enableSkipping = result.enableSkipping || false;
      skipLive = result.skipLive || false;
      skipAds = result.skipAds || false;
      skipTags = result.skipTags || false;
      skipDuration = result.skipDuration || false;
      tagsToSkip = Array.isArray(result.tagsToSkip) ? result.tagsToSkip : [];
      minToSkip = result.minToSkip || 0;
      maxToSkip = result.maxToSkip || 9999;

      logSettings();

      if (callback) callback();
    }
  );
}

function logSettings() {
  console.log(
    '%c[TikTok-Feed-Filter]',
    'color: white; background: #007acc; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
    {
      enableSkipping,
      skipLive,
      skipAds,
      skipTags,
      skipDuration,
      tagsToSkip,
      minToSkip,
      maxToSkip,
    }
  );
}

loadSettings(() => {
  window.addEventListener('load', () => {
    setTimeout(startObserver, 1000);
  });
});