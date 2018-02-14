// parseSSMLProsodyElementRateAttribute.js 12-24-2017 guest271314
// https://github.com/guest271314/SpeechSynthesisSSMLParser
// Parse `<prosody>` `rate` attribute to set `SpeechSynthesisUtterance` `.pitch` attribute
// https://www.w3.org/TR/speech-synthesis11/#S3.2.4
// https://w3c.github.io/speech-api/speechapi.html#dfn-utterancepitch
// https://bugs.chromium.org/p/chromium/issues/detail?id=88072
// https://bugs.chromium.org/p/chromium/issues/detail?id=795371
// https://bugzilla.mozilla.org/show_bug.cgi?id=1425523
// https://github.com/w3c/web-platform-tests/issues/8712
// https://lists.w3.org/Archives/Public/www-voice/2017OctDec/0000.html
// https://lists.w3.org/Archives/Public/public-speech-api/2017Dec/0000.html
// https://github.com/w3c/web-platform-tests/issues/8795
// https://www.w3.org/TR/speech-synthesis11/#S3.2.4
// `prosody` element `pitch` attribute values  "x-slow", "slow", "medium", "fast", "x-fast", or "default" 
// https://w3c.github.io/speech-api/speechapi.html#dfn-utterancerate
// `rate` 0.1-10
;(async() => {
  const rates = new Map(Object.entries({
    "x-slow": 0.1,
    "slow": 0.5,
    "default": 1,
    "medium": 2.5,
    "fast": 5,
    "x-fast": 10
  }));

  for (let i = 0.1; i < 10; i += .1) {

    const ssmlString = `<?xml version="1.0"?><speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.w3.org/2001/10/synthesis http://www.w3.org/TR/speech-synthesis11/synthesis.xsd"
       xml:lang="en-US">
       <prosody pitch="1" contour="" range="" rate="${i}" duration="" volume="">hello universe</prosody>
       </speak>`;

    const utterance = new SpeechSynthesisUtterance();

    await new Promise(resolve => {
      utterance.onend = e => {
        utterance.onend = null;
        resolve()
      }
      const parser = new DOMParser();
      const ssmlDocument = parser.parseFromString(ssmlString, "text/xml");

      for (let node of ssmlDocument.documentElement.children) {
        if (node.nodeName === "prosody") {
          console.log(node.outerHTML);
          const [{
            pitch,
            rate
          }, text] = [
            [...node.attributes].reduce((o, {
              nodeName,
              nodeValue
            }) => Object.assign(o, {
              [nodeName]: rates.get(nodeValue) || nodeValue
            }), Object.create(null)), node.textContent
          ];
          Object.assign(utterance, {
            pitch,
            rate,
            text
          });
        }

      }
      console.log(`SpeechSynthesisUtterance rate: ${utterance.rate}`);
      window.speechSynthesis.speak(utterance)
    })
  }

})()
.then(async() => {
  const rates = new Map(Object.entries({
    "x-slow": 0.1,
    "slow": 0.5,
    "default": 1,
    "medium": 2.5,
    "fast": 5,
    "x-fast": 10
  }));

  for (let [key, prop] of rates) {

    const ssmlString = `<?xml version="1.0"?><speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.w3.org/2001/10/synthesis http://www.w3.org/TR/speech-synthesis11/synthesis.xsd"
       xml:lang="en-US">
       <prosody pitch="1" contour="" range="" rate="${key}" duration="" volume="">hello universe</prosody>
       </speak>`;

    const utterance = new SpeechSynthesisUtterance();

    await new Promise(resolve => {

      utterance.onend = e => {
        utterance.onend = null;
        resolve()
      }

      const parser = new DOMParser();

      const ssmlDocument = parser.parseFromString(ssmlString, "text/xml");

      for (let node of ssmlDocument.documentElement.children) {
        if (node.nodeName === "prosody") {
          console.log(node.outerHTML);
          const [{
            pitch,
            rate
          }, text] = [
            [...node.attributes].reduce((o, {
              nodeName,
              nodeValue
            }) => Object.assign(o, {
              [nodeName]: rates.get(nodeValue) || nodeValue
            }), Object.create(null)), node.textContent
          ];
          Object.assign(utterance, {
            pitch,
            rate,
            text
          });
        }
      }
      console.log(`SpeechSynthesisUtterance rate: ${utterance.rate}`);
      window.speechSynthesis.speak(utterance)
    })
  }
});
