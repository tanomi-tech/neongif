// import { showSaveFilePicker } from './node_modules/native-file-system-adapter/mod.js';
import { FFmpeg } from "./node_modules/@ffmpeg/ffmpeg/dist/esm/index.js";
import { /* fetchFile, */ toBlobURL } from "./node_modules/@ffmpeg/util/dist/esm/index.js";
// import { fileSave } from './node_modules/browser-fs-access/dist/index.modern.js';
import { 
  calcTotalDuration, 
  createUpdateProgressCb,
  initProgressSection,
  isFrameMetadata,
  kebabToCamel,
  parseTimestamp,
} from './lib.js';
import { fromEvent, combineLatest, startWith, map } from './node_modules/rxjs/dist/esm';

const convertButton = document.getElementById('convert-button');
const convertForm = document.getElementById('convert-form');
const previewWindow = document.getElementById('preview-window');

// Form Inputs
const fileInput = document.getElementById('file-input'); 
const fileInputBtn = document.getElementById('file-input-button'); 
const hoursInput = document.querySelector('input[name="start-time-hours"]');
const minutesInput = document.querySelector('input[name="start-time-minutes"]');
const secondsInput = document.querySelector('input[name="start-time-seconds"]');
const durationInput = document.querySelector('input[name="custom-duration"]');
const durationFieldset = document.querySelectorAll('input[name="duration"]');

durationFieldset.forEach(input => {
  input.addEventListener('change', () => {
    console.log(input);
    durationInput.required = input.id === 'custom-button';
    durationInput.disabled = input.id !== 'custom-button';
    if (durationInput.disabled) durationInput.value = '';
  });
});

let file, totalDurationSeconds, capturedDuration = null;

const timeInputEventStreams = [hoursInput, minutesInput, secondsInput]
  .map(input => fromEvent(input, 'input')
  .pipe(startWith(null)));

combineLatest(timeInputEventStreams)
  .pipe(
    map(events => events.map(e => e?.target?.value || null)),
  )
  .subscribe((timeSlots) => {
    const [hours, minutes, seconds] = timeSlots.map(slot => parseFloat(slot ?? '0'));
    const startTimeTotal = calcTotalDuration(hours, minutes, seconds);
    durationInput.max = Math.max(0, (totalDurationSeconds ?? 0) - startTimeTotal);
  });

const BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
const ffmpeg = new FFmpeg({ log: true });

await ffmpeg.load({
  coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
  wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
});

ffmpeg.on("log", (log) => {
  if (!capturedDuration && log.message.trim().startsWith('Duration:')) {
    const durationSegments = log.message
      ?.trim()
      ?.split(/[,:]/)
      ?.slice(1, 4)
      ?.map(shard => shard.trim())
      ?.map(shard => parseFloat(shard));

    const [hours, minutes, seconds] = durationSegments;
    totalDurationSeconds = calcTotalDuration(hours, minutes, seconds);

    hoursInput.max = hours;
    minutesInput.max = Math.min(59.99, (hours * 60) + minutes);
    secondsInput.max = Math.min(59.99, totalDurationSeconds);

    capturedDuration = durationSegments?.join(':') ?? null;
  }
  
  console.log(log.message);
});

// ffmpeg.on("progress", ({ progress }) => {});

async function processLargeVideo(submission) {
  const { 
    startTimeHours: hh, 
    startTimeMinutes: mm, 
    startTimeSeconds: ss, 
    duration, 
    videoFile: file 
  } = submission;

  const timestamp = parseTimestamp(hh, mm, ss);
  console.log(timestamp, duration, file);
  const basename = file.name.split('.');
  basename.pop();
  const outputName = `${basename.join()}.gif`;
  const outputWidth = '640';

  const progressSectionNode = initProgressSection();
  previewWindow.replaceChildren(progressSectionNode);

  const updateProgress = createUpdateProgressCb(progressSectionNode, duration);

  const handleFrameProgress = log => {
    if (!isFrameMetadata(log.message)) {
      return;
    }
    const frame = log.message.split(/\s+/)?.[1];
    if (!isNaN(frame)) updateProgress(frame);
  };

  ffmpeg.on('log', handleFrameProgress);
  console.group();
  await ffmpeg.exec([
    '-threads', Math.min(navigator.hardwareConcurrency, 4).toString(),
    '-ss', timestamp,
    '-i', file.name,
    '-to', duration,
    '-vf', `fps=10,scale=${outputWidth}:-1:flags=lanczos`,
    outputName
  ]);
  console.groupEnd();
  ffmpeg.off('log', handleFrameProgress)

  const outputData = await ffmpeg.readFile(outputName);
  const blob = new Blob([outputData.buffer], {type: 'image/gif'});
  const outputUrl = URL.createObjectURL(blob);
  const gif = document.createElement('img');
  gif.src = outputUrl;
  gif.classList.add('preview-gif');
  previewWindow.replaceChildren(gif);

  const downloadButton = document.createElement('a');
  downloadButton.innerText = 'Download';
  downloadButton.id = 'download-button';
  downloadButton.href = outputUrl;
  downloadButton.download = `${basename}.gif`;

  previewWindow.append(downloadButton);

  await ffmpeg.deleteFile(file.name);
  await ffmpeg.deleteFile(outputName);
  console.log('File has been written successfully.');
}


fileInputBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async (event) => {
  file = event.target.files[0];
  fileInputBtn.innerText = file.name;
  convertButton.disabled = !file;

  const buff = await file.arrayBuffer();
  await ffmpeg.writeFile(file.name, new Uint8Array(buff));

  capturedDuration = null;
  await ffmpeg.exec([
    '-i',
    file.name,
  ]);
});

convertForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const submission = kebabToCamel(Object.fromEntries(new FormData(event.target).entries()));
  if (!submission.videoFile) return false; 

  convertButton.disabled = true;
  convertButton.innerText = 'Converting...'

  processLargeVideo(submission)
    .then(() => {
      convertButton.disabled = false;
      convertButton.innerText = 'Convert';
      fileInput.value = '';
      fileInputBtn.innerText = 'Choose File...';
    })
    .catch(err => {
      console.trace(err);
    });
});

