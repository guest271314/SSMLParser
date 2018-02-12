// parseSSMLPElement.js 2-12-2018 guest271314
// https://github.com/guest271314/SpeechSynthesisSSMLParser
// https://www.w3.org/TR/2010/REC-speech-synthesis11-20100907/#S3.1.8.1
// https://bugs.chromium.org/p/chromium/issues/detail?id=88072
// https://bugs.chromium.org/p/chromium/issues/detail?id=795371
// https://bugzilla.mozilla.org/show_bug.cgi?id=1425523
// https://github.com/w3c/web-platform-tests/issues/8712
// https://lists.w3.org/Archives/Public/www-voice/2017OctDec/0000.html
// https://lists.w3.org/Archives/Public/public-speech-api/2017Dec/0000.html
// https://github.com/w3c/web-platform-tests/issues/8795
window.speechSynthesis.cancel();

const _break = ({
  strength, time = 0
}) => {
  console.log(strength);
  time += strength;
  return new Promise(resolve => {
    const context = new AudioContext();
    const ab = context.createBuffer(2, 44100 * time, 44100);
    const source = context.createBufferSource();
    source.buffer = ab;
    source.connect(context.destination);
    source.onended = (e) => {
      source.onended = null;
      context.close().then(resolve);
    }
    source.start(context.currentTime);
    source.stop(context.currentTime + time);
  });
}

const handleVoicesChanged = async() => {
  console.log("voiceschanged");
  window.speechSynthesis.onvoiceschanged = null;
  const ssmlStrings = [`<?xml version="1.0"?>
  <speak version="1.1"
       xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.w3.org/2001/10/synthesis http://www.w3.org/TR/speech-synthesis11/synthesis.xsd"
       xml:lang="en-US">
       <p>A paragraph.</p><p>Another paragraph</p>
  </speak>`];

  for (let ssml of ssmlStrings) {
    const parser = new DOMParser();
    const ssmlDocument = parser.parseFromString(ssml, "text/xml");
    console.log(ssmlDocument);
    for (let node of ssmlDocument.documentElement.children) {
      if (node.nodeName === "p") {
        console.log(node);
        await _break({
            strength: 2
          })
          .then(() => new Promise(resolve => {
            const utterance = new SpeechSynthesisUtterance(node.textContent);
            utterance.onend = e => {
              utterance.onend = null;
              resolve()
            }
            window.speechSynthesis.speak(utterance);
          }))
          .then(() => _break({
            strength: 2
          }))
      }
    }
  }
}

window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
window.speechSynthesis.getVoices();
