/* Screen Recorder — record display + audio to WebM via MediaRecorder.
   Ported from omni's ScreenRecorder. Classic script (no modules). */
(function () {
  'use strict';

  var mediaRecorder = null;
  var chunks = [];
  var stream = null;
  var blob = null;
  var blobUrl = null;
  var timerId = null;
  var startedAt = 0;

  function $(id) {
    return document.getElementById(id);
  }

  function fmtTime(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s %= 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function tick() {
    $('timer').textContent = fmtTime(Date.now() - startedAt);
  }

  function setRecording(on) {
    $('start').classList.toggle('hidden', on);
    $('stop').classList.toggle('hidden', !on);
    $('status').classList.toggle('recording', on);
    $('status-text').textContent = on ? 'Recording' : 'Ready';
    $('timer').textContent = on ? '00:00' : '';
    if (on) {
      startedAt = Date.now();
      timerId = setInterval(tick, 500);
    } else {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function showError(msg) {
    var e = $('error');
    e.textContent = msg;
    e.classList.remove('hidden');
  }

  function handleStart() {
    $('error').classList.add('hidden');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      showError('Screen capture is not supported in this browser.');
      return;
    }
    navigator.mediaDevices
      .getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: true,
      })
      .then(function (s) {
        stream = s;
        chunks = [];
        blob = null;
        var mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';
        mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });

        mediaRecorder.ondataavailable = function (e) {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = function () {
          blob = new Blob(chunks, { type: 'video/webm' });
          stream.getTracks().forEach(function (t) {
            t.stop();
          });
          setRecording(false);
          showResult();
        };

        // If the user ends the share from the browser UI, treat as stop.
        stream.getVideoTracks()[0].addEventListener('ended', function () {
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        });

        mediaRecorder.start(1000);
        setRecording(true);
        $('result').classList.add('hidden');
      })
      .catch(function (err) {
        if (err && err.name === 'NotAllowedError') {
          showError('Screen share permission was denied.');
        } else {
          showError('Could not start recording: ' + (err && err.message ? err.message : err));
        }
      });
  }

  function handleStop() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  function showResult() {
    if (!blob) return;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = URL.createObjectURL(blob);
    $('preview').src = blobUrl;
    $('result-meta').textContent =
      'Recording saved (' + Math.round(blob.size / 1024) + ' KB)';
    $('result').classList.remove('hidden');
  }

  function handleDownload() {
    if (!blob || !blobUrl) return;
    var a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'recording_' + Date.now() + '.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function init() {
    $('start').addEventListener('click', handleStart);
    $('stop').addEventListener('click', handleStop);
    $('download').addEventListener('click', handleDownload);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
