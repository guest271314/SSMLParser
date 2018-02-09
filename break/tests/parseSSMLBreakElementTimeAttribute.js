// parseSSMLBreakElementTimeAttribute.js 2-8-2018 guest271314
// https://github.com/guest271314/SpeechSynthesisSSMLParser
// Parse `<break>` `strength` and `time` attributes to output audio silence
// https://www.w3.org/TR/speech-synthesis11/#S3.2.3
// https://bugs.chromium.org/p/chromium/issues/detail?id=88072
// https://bugs.chromium.org/p/chromium/issues/detail?id=795371
// https://bugzilla.mozilla.org/show_bug.cgi?id=1425523
// https://github.com/w3c/web-platform-tests/issues/8712
// https://lists.w3.org/Archives/Public/www-voice/2017OctDec/0000.html
// https://lists.w3.org/Archives/Public/public-speech-api/2017Dec/0000.html
// https://github.com/w3c/web-platform-tests/issues/8795
// https://www.w3.org/TR/speech-synthesis11/#S3.2.3
// `break` element `strength` attribute values "none", "x-weak", "weak", "medium" (default value), "strong", or "x-strong"
// `break` element `time` attribute
// "time: the time attribute is an optional attribute 
// indicating the duration of a pause to be inserted in the output in seconds or milliseconds. 
// It follows the time value format from the 
// Cascading Style Sheets Level 2 Recommendation [CSS2](https://www.w3.org/TR/2010/REC-speech-synthesis11-20100907/#ref-css2), 
// e.g. "250ms", "3s"."

const strengths = new Map(Object.entries({
  "none": 0,
  "x-weak": .125,
  "weak": .25,
  "medium": .5,
  "strong": 1,
  "x-strong": 2
}));

const times = ["250ms", "3s"];

const audioSilenceBreak = async({time = 0, strength = 0} = {}) => {
  // https://www.w3.org/TR/2010/REC-speech-synthesis11-20100907/#S3.2.3
  // "If both strength and time attributes are supplied, 
  // the processor will insert a break with a duration as specified by the time attribute, 
  // with other prosodic changes in the output based on the value of the strength attribute."
  if (!strength && !time) {
    strength = strengths.get("medium");
  }
  
  time += strength;
  
  console.log(time);

  const audioSilence = await new Promise(resolve => {
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

  return audioSilence;

}

(async() => {

  for (let N of times) {

    console.log(N);

    const ssmlString = `<?xml version="1.0"?><speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.w3.org/2001/10/synthesis http://www.w3.org/TR/speech-synthesis11/synthesis.xsd"
       xml:lang="en-US">
       hello <break time="${N}"/> universe
       </speak>`;

    const parser = new DOMParser();
    
    const ssmlDocument = parser.parseFromString(ssmlString, "text/xml");
    
    // handle `<break strength="none"/>`
    // remove the element
    // https://www.w3.org/TR/2010/REC-speech-synthesis11-20100907/#S3.2.3
    // "The value "none" indicates that no prosodic break boundary should be outputted, 
    // which can be used to prevent a prosodic break which the processor would otherwise produce."
    ssmlDocument.querySelectorAll("break").forEach(br => {
      if (br.getAttribute("strength") === "none") {
        if (br.nextSibling && br.nextSibling.nodeName === "#text" 
            && br.previousSibling && br.previousSibling.nodeName === "#text") {
              br.previousSibling.nodeValue += br.nextSibling.nodeValue;
              br.parentNode.removeChild(br.nextSibling);
              br.parentNode.removeChild(br);
        } else {
          br.parentNode.removeChild(br);
        }
      }
    });

    for (let node of ssmlDocument.documentElement.childNodes) {
    
      console.log(node);
      
      if (node.nodeName === "break") {

        const strength = node.getAttribute("strength") 
                         ? strengths.get(node.getAttribute("strength")) 
                         : node.getAttribute("time") 
                           ? strengths.get("none")
                           : strengths.get("medium");
        // handle "250ms", "3s"
        const time = node.getAttribute("time")
                     ? node.getAttribute("time").match(/[\d.]+|\w+$/g)
                       .reduce((n, t) => Number(n) * (t === "s" ? 1 : .001)) 
                     : strengths.get("none");
                     
        console.log(strength, time);
        
        await audioSilenceBreak({
          strength, time
        });

      } else {
      
        await new Promise(resolve => {
          const utterance = new SpeechSynthesisUtterance(node.nodeValue);
          utterance.onend = e => {
            utterance.onend = null;
            resolve()
          }
          window.speechSynthesis.speak(utterance);
        });
        
      }
    }
  }

})();
