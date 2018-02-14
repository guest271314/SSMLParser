// parseSSMLVoiceElementNameAttribute.js 12-24-2017 guest271314
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
// `voice` element `pitch` attribute values  `"gender"`, `"age"`, `"variant"`, `"name"`, `"languages"`, `"required"`,
// `"ordering"`, `"ovoicefailure"`
// https://w3c.github.io/speech-api/webspeechapi.html#dfn-utterancevoice
;(async() => {
  const setVoices = voices => {
    window.speechSynthesis.onvoiceschanged = async(e) => {
      window.speechSynthesis.onvoiceschanged = null;
      voices = voices.length ? voices : window.speechSynthesis.getVoices().filter(({
        name
      }) => /^en-|english/i.test(name));
      console.log(voices);
      for (let voice of voices) {
        console.log(voice.name);
        const ssmlString = `<?xml version="1.0"?>
<speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.w3.org/2001/10/synthesis http://www.w3.org/TR/speech-synthesis11/synthesis.xsd"
       xml:lang="en-US">   
  <!-- processor-specific voice selection -->
  <voice name="${voice.name}" languages="en-US" required="name">hello universe</voice>
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
            console.log(node.nodeName);
            if (node.nodeName === "voice") {
              console.log(node.outerHTML);
              const [{
                name
              }, text] = [
                [...node.attributes].reduce((o, {
                  nodeName,
                  nodeValue
                }) => Object.assign(o, {
                  [nodeName]: nodeValue
                }), Object.create(null)), node.textContent
              ];

              Object.assign(utterance, {
                voice: voices.find(({
                         name: voiceName
                       }) => voiceName === name),
                text
              });
            }

          }
          console.log(`SpeechSynthesisUtterance voice: ${utterance.voice.name}`);
          window.speechSynthesis.speak(utterance)
        })
      }
    }
  }
  const voices = window.speechSynthesis.getVoices();
  setVoices(voices);
})()
