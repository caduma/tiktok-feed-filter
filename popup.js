document.addEventListener('DOMContentLoaded', () => {
    const skipAdsCheckbox = document.getElementById('skipAds');
    const skipTagsInput = document.getElementById('skipTags');
    const saveBtn = document.getElementById('saveBtn');
  
    // Load settings on popup open
    chrome.storage.sync.get(['skipAds', 'skipTags'], (result) => {
      skipAdsCheckbox.checked = result.skipAds || false;
      skipTagsInput.value = Array.isArray(result.skipTags) ? result.skipTags.join(',') : '';
    });
  
    saveBtn.addEventListener('click', () => {
      const skipAds = skipAdsCheckbox.checked;
      const skipTags = skipTagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
  
      chrome.storage.sync.set({ skipAds, skipTags }, () => {
        // Optionally confirm saved
        alert('Settings saved!');
      });
    });
  });