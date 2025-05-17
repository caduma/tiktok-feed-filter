document.addEventListener('DOMContentLoaded', () => {
  const enableSkippingCheckbox = document.getElementById('enableSkipping');
  const skipLiveCheckbox = document.getElementById('skipLive');
  const skipAdsCheckbox = document.getElementById('skipAds');

  const skipTagsCheckbox = document.getElementById('skipTags');
  const tagsToSkipInput = document.getElementById('tagsToSkip');

  const skipDurationCheckbox = document.getElementById('skipDuration');
  const minSecondsSlider = document.getElementById('minSeconds');
  const maxSecondsSlider = document.getElementById('maxSeconds');
  const minSecondsValue = document.getElementById('minSecondsValue');
  const maxSecondsValue = document.getElementById('maxSecondsValue');

  const saveBtn = document.getElementById('saveBtn');

  // Load settings on popup open
  chrome.storage.sync.get(
    ['enableSkipping', 'skipLive', 'skipAds', 'skipTagsEnabled', 'skipTags', 'skipDurationEnabled', 'minSeconds', 'maxSeconds'],
    (result) => {
      enableSkippingCheckbox.checked = result.enableSkipping || false;
      skipLiveCheckbox.checked = result.skipLive || false;
      skipAdsCheckbox.checked = result.skipAds || false;

      skipTagsCheckbox.checked = result.skipTagsEnabled || false;
      tagsToSkipInput.value = Array.isArray(result.skipTags) ? result.skipTags.join(',') : '';

      skipDurationCheckbox.checked = result.skipDurationEnabled || false;

      minSecondsSlider.value = result.minSeconds ?? 0;
      maxSecondsSlider.value = result.maxSeconds ?? 600;

      minSecondsValue.textContent = minSecondsSlider.value;
      maxSecondsValue.textContent = maxSecondsSlider.value;

      toggleSkipTagsInputs(skipTagsCheckbox.checked);
      toggleSkipDurationInputs(skipDurationCheckbox.checked);
    }
  );

  minSecondsSlider.addEventListener('input', () => {
    minSecondsValue.textContent = minSecondsSlider.value;
    if (parseInt(minSecondsSlider.value) > parseInt(maxSecondsSlider.value)) {
      maxSecondsSlider.value = minSecondsSlider.value;
      maxSecondsValue.textContent = maxSecondsSlider.value;
    }
  });

  maxSecondsSlider.addEventListener('input', () => {
    maxSecondsValue.textContent = maxSecondsSlider.value;
    if (parseInt(maxSecondsSlider.value) < parseInt(minSecondsSlider.value)) {
      minSecondsSlider.value = maxSecondsSlider.value;
      minSecondsValue.textContent = minSecondsSlider.value;
    }
  });

  skipTagsCheckbox.addEventListener('change', () => {
    toggleSkipTagsInputs(skipTagsCheckbox.checked);
  });

  skipDurationCheckbox.addEventListener('change', () => {
    toggleSkipDurationInputs(skipDurationCheckbox.checked);
  });

  function toggleSkipTagsInputs(enabled) {
    tagsToSkipInput.disabled = !enabled;
  }

  function toggleSkipDurationInputs(enabled) {
    minSecondsSlider.disabled = !enabled;
    maxSecondsSlider.disabled = !enabled;
  }

  saveBtn.addEventListener('click', () => {
    const enableSkipping = enableSkippingCheckbox.checked;
    const skipLive = skipLiveCheckbox.checked;
    const skipAds = skipAdsCheckbox.checked;

    const skipTags = skipTagsCheckbox.checked;
    const tagsToSkip = tagsToSkipInput.value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const skipDuration = skipDurationCheckbox.checked;
    const minSeconds = parseInt(minSecondsSlider.value);
    const maxSeconds = parseInt(maxSecondsSlider.value);

    console.log(enableSkipping, skipLive, skipAds, skipTags, tagsToSkip, skipDuration, minSeconds, maxSeconds);

    chrome.storage.sync.set({
        enableSkipping: enableSkipping,
        skipLive: skipLive,
        skipAds: skipAds,
        skipTags: skipTags,
        tagsToSkip: tagsToSkip,
        skipDuration: skipDuration,
        minToSkip: minSeconds,
        maxToSkip: maxSeconds 
    });
  });
});