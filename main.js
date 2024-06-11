import { showSaveFilePicker } from './node_modules/native-file-system-adapter/mod.js';
import { FFmpeg } from "./node_modules/@ffmpeg/ffmpeg/dist/esm/index.js";
import { fetchFile, toBlobURL } from "./node_modules/@ffmpeg/util/dist/esm/index.js";
import { fileSave } from './node_modules/browser-fs-access/dist/index.modern.js';

const convertForm = document.getElementById('convert-form');
const fileInput = document.getElementById('file-input'); 
const previewWindow = document.getElementById('preview-window');
const progBar = document.getElementById('progress-bar');
const progTxt = document.getElementById('progress-text');

const BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
const ffmpeg = new FFmpeg({ log: true });

await ffmpeg.load({
  coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
  wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
});

ffmpeg.on("log", ({ message }) => {
  console.log(message);
});

ffmpeg.on("progress", ({ progress }) => {
  const progRounded = Math.round(progress * 100);
  if (progBar.value !== progRounded) {
    progBar.value = progRounded;
    progBar.innerText = progRounded + '%';
    progTxt.innerText = progRounded + '%';
    console.groupEnd();
    console.group();
    console.log(`${progRounded}% complete...`)
  }
});

async function processLargeVideo(file) {
  const buff = await file.arrayBuffer();
  await ffmpeg.writeFile(file.name, new Uint8Array(buff));
  const basename = file.name.split('.');
  basename.pop();
  const outputName = `${basename.join()}.gif`;
  const outputWidth = '640';

  console.group();
  await ffmpeg.exec([
    '-threads', 
    Math.min(navigator.hardwareConcurrency, 4).toString(),
    '-i',
    file.name,
    '-vf', 
    `fps=10,scale=${outputWidth}:-1:flags=lanczos`,
    outputName
  ]);
  console.groupEnd();

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

  previewWindow.parentElement.append(downloadButton);

  await ffmpeg.deleteFile(file.name);
  await ffmpeg.deleteFile(outputName);
  console.log('File has been written successfully.');
}

let file;
fileInput.addEventListener('change', (event) => {
  file = event.target.files[0];
});

convertForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!file) return false; 

  const convertButton = document.getElementById('convert-button');
  convertButton.disabled = true;
  convertButton.innerText = 'Converting...'
  progTxt.classList.add('active');
  progTxt.innerText = '0%';
  processLargeVideo(file)
    .then(() => {
      convertButton.disabled = false;
      convertButton.innerText = 'Convert';
      fileInput.value = '';
    })
    .catch(err => {
      console.trace(err);
    });
});

