// parseSSMLSayAsElementInterpretAsAttributeCharactersValue.js 2-12-2018 guest271314
// https://github.com/guest271314/SpeechSynthesisSSMLParser
// https://www.w3.org/TR/speech-synthesis11/#S3.1.9
// https://bugs.chromium.org/p/chromium/issues/detail?id=88072
// https://bugs.chromium.org/p/chromium/issues/detail?id=795371
// https://bugzilla.mozilla.org/show_bug.cgi?id=1425523
// https://github.com/w3c/web-platform-tests/issues/8712
// https://lists.w3.org/Archives/Public/www-voice/2017OctDec/0000.html
// https://lists.w3.org/Archives/Public/public-speech-api/2017Dec/0000.html
// https://github.com/w3c/web-platform-tests/issues/8795
const handleVoicesChanged = async() => {
  console.log("voiceschanged");
  window.speechSynthesis.onvoiceschanged = null;
  const ssmlString = `<?xml version="1.0"?>
  <speak version="1.1"
       xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.w3.org/2001/10/synthesis http://www.w3.org/TR/speech-synthesis11/synthesis.xsd"
       xml:lang="en-US">
       <say-as interpret-as="characters">hello universe</say-as>
  </speak>`;
  const parser = new DOMParser();
  const ssmlDocument = parser.parseFromString(ssmlString, "text/xml");


  for (let node of ssmlDocument.documentElement.children) {
    if (node.nodeName === "say-as") {
      if (node.getAttribute("interpret-as") === "characters") {
        for (let char of node.textContent) {

          await new Promise(resolve => {
            const utterance = new SpeechSynthesisUtterance(char);
            utterance.onend = e => {
              utterance.onend = null;
              resolve()
            }

            console.log(`SpeechSynthesisUtterance text: ${utterance.text}`);
            window.speechSynthesis.speak(utterance)
          })

        }
      }
    }

  }
}

window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
window.speechSynthesis.getVoices();
