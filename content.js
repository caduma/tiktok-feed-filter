let lastScrollIndex = null;
let skipAds = false;
let skipTags = [];

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

function isAdArticle(article) {
  if (!article) return false;

  const allElements = article.querySelectorAll('*');
  for (const el of allElements) {
    const text = el.textContent?.trim().toLowerCase();
    if (text === 'ad') return true;
  }
  return false;
}

function shouldSkipVideo(description, tags, isAd) {
  console.log("[TikTok-Feed-Filter] SkipAds:", skipAds);

  if (skipAds && isAd) return true;

  const descLower = description.toLowerCase();
  for (const tag of skipTags) {
    if (descLower.includes(tag) || tags.some(t => t.toLowerCase() === tag)) {
      return true;
    }
  }
  return false;
}

function extractFromActiveArticle() {
  const articles = document.querySelectorAll('article[data-e2e="recommend-list-item-container"]');
  let activeArticle = null;

  articles.forEach(article => {
    const rect = article.getBoundingClientRect();
    const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
    if (inView) activeArticle = article;
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

  const isAd = isAdArticle(activeArticle);

//   console.log("[TikTok-Feed-Filter] Description:", description);
//   console.log("[TikTok-Feed-Filter] Tags:", tags);
  console.log("[TikTok-Feed-Filter] Is Ad:", isAd);

  if (shouldSkipVideo(description, tags, isAd)) {
    // Scroll down to skip the video:
    console.log("[TikTok-Feed-Filter] Skipping video at scrollIndex:", currentIndex);
    //window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' });
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



chrome.storage.sync.get(['skipAds', 'skipTags'], (result) => {
    skipAds = result.skipAds || false;
    skipTags = Array.isArray(result.skipTags) ? result.skipTags : [];
    
    // Now call your function to process videos based on these settings
    window.addEventListener('load', () => {
        setTimeout(startObserver, 1000);
      });
  });