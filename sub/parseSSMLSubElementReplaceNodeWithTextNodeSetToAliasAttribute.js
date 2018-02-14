    // parseSSMLSubElementReplaceNodeWithTextNodeSetToAliasAttribute.js 2-12-2018 guest271314
    // https://github.com/guest271314/SpeechSynthesisSSMLParser
    // https://www.w3.org/TR/2010/REC-speech-synthesis11-20100907/#edef_sub
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
       <sub alias="Chromium">Cr</sub><sub alias="Firefox">FF</sub>
  </speak>`;
      const parser = new DOMParser();
      const ssmlDocument = parser.parseFromString(ssmlString, "text/xml");
      const utterance = new SpeechSynthesisUtterance();
      // handle `<sub alias="Speech Synthesis Markup Language">SSML</sub>`
      // replace the element with `#text` node with `nodeValue` set to `alias` attribute value
      // https://www.w3.org/TR/2010/REC-speech-synthesis11-20100907/#edef_sub
      // "The sub element is employed to indicate that the text in the alias attribute value replaces the contained text for pronunciation. 
      // This allows a document to contain both a spoken and written form. 
      // The required alias attribute specifies the string to be spoken instead of the enclosed string. 
      // The processor should apply text normalization to the alias value."
      ssmlDocument.querySelectorAll("sub").forEach(sub => {
        const textNode = this.ssml.createTextNode(sub.getAttribute("alias"));
        sub.parentNode.replaceChild(textNode, sub);
      });
      
      if (ssmlDocumentElement.children.length === 0) {
        const utterance = new SpeechSynthesisUtterance(ssmlDocumentElement.textContent);
        await new Promise(resolve => {
          utterance.onend = e => {
            utterance.onend = null;
            resolve()
          }

          console.log(`SpeechSynthesisUtterance text: ${utterance.text}`);
          window.speechSynthesis.speak(utterance)
        })
      } 
     
    }

    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    window.speechSynthesis.getVoices();
