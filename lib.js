/**
 * @link https://stackoverflow.com/a/26215431
 */
const kebabToCamel = (o) => {
  let newO, origKey, newKey, value;
  if (o instanceof Array) {
    return o.map((value) => {
        if (typeof value === "object") {
          value = kebabToCamel(value);
        }
        return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (o.hasOwnProperty(origKey)) {
        newKey = origKey.split('-').map((s, i) => i === 0 ? s : s[0].toUpperCase() + s.slice(1).toLowerCase()).join('');
        value = o[origKey];
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = kebabToCamel(value);
        }
        newO[newKey] = value;
      }
    }
  }
  return newO;
}

const isFrameMetadata = (logMessage) => logMessage.startsWith('frame=');

const initProgressSection = () => {
  // Create the outer div with class "progress-section"
  const progressSection = document.createElement('div');
  progressSection.classList.add('progress-section');

  // Create the span with id "progress-text"
  const progressText = document.createElement('span');
  progressText.classList.add('progress-text');
  progressText.innerText = '0%';
  progressSection.appendChild(progressText);
  
  // Create the inner div with id "progress-bar"
  const progressBar = document.createElement('div');
  progressBar.classList.add('progress-bar');

  // Create the span with id "progress-value" inside the "progress-bar" div
  const progressValue = document.createElement('span');
  progressValue.classList.add('progress-value');
  progressBar.appendChild(progressValue);

  // Append the "progress-bar" div to the "progress-section" div
  progressSection.appendChild(progressBar);

  return progressSection;
}

const calcTotalDuration = (hours, minutes, seconds) => 
  (hours * 60 * 60) + (minutes * 60) + seconds;

const parseTimestamp = (hours, minutes, seconds) => 
  [hours, minutes, seconds]
    .map(shard => shard.padStart(2, '0'))
    .join(':');

const createUpdateProgressCb = (progressSectionNode, clipDuration) => frame => {
  const progValue = progressSectionNode.querySelector('.progress-value');
  const progTxt = progressSectionNode.querySelector('.progress-text');
  /**
   * we need the x10 multiplier here because 
   * our ffmpeg.exec(...) command uses a param 10 fps
   */
  const progress = Math.round((parseInt(frame) / (clipDuration * 10)) * 100);

  if (progValue.dataset.value !== progress) {
    progValue.style.width = progress + '%';
    progTxt.innerText = progress + '%';
    console.log(`${progress}% complete...`)
  }
}

const getHighlightTarget = (elm, container = null) => {
  const targetId = elm.dataset.highlightTarget;
    if (!targetId) return null;
    return (container ?? document).querySelector(`[data-highlight="${targetId}"]`);
} 

const setBlankTargetOnExternalLinks = () => 
  document.querySelectorAll(`a:not([href^="https://${window.location.hostname}"])`)
    .forEach(anchor => (anchor.target = '_blank'));

const userIsOnMobile = () => [
  /Android/i,
  /webOS/i,
  /iPhone/i,
  /iPad/i,
  /iPod/i,
  /BlackBerry/i,
  /Windows Phone/i
].some(regex => navigator.userAgent.match(regex))

/**
 * TODO: make func to capture currently displayed preview window contents 
 * and restore them upon new file upload.
 */

export {
  calcTotalDuration,
  createUpdateProgressCb,
  getHighlightTarget,
  initProgressSection,
  isFrameMetadata,
  kebabToCamel,
  parseTimestamp,
  setBlankTargetOnExternalLinks,
  userIsOnMobile,
}
