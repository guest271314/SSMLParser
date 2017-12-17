// SpeechSynthesisSSMLParser.js guest271314 12-17-2017
// Motivation: Implement SSML parsing for Web Speech API
// See https://lists.w3.org/Archives/Public/www-voice/2017OctDec/0000.html
// https://github.com/guest271314/SpeechSynthesisSSMLParser
class SpeechSynthesisSSMLParser {
  constructor(ssml = `<?xml version="1.0"?>
<speak version="1.1"
       xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.w3.org/2001/10/synthesis http://www.w3.org/TR/speech-synthesis11/synthesis.xsd"
       xml:lang="en-US">hello world
</speak>`, utterance = new SpeechSynthesisUtterance()) {
    
    if (ssml && typeof ssml === "string") {
      ssml = (new DOMParser()).parseFromString(ssml, "application/xml");
    }

    if (ssml instanceof Document && ssml.documentElement.nodeName === "speak") {
      utterance.lang = ssml.documentElement.attributes.getNamedItem("xml:lang").value;
      utterance.text = ssml.documentElement.textContent;
    } else {
      throw new TypeError("Root element of SSML document should be <speak>")
    }
    
    return utterance;
  }
}
