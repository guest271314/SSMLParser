// SpeechSynthesisSSMLParser.js guest271314 12-17-2017
// Motivation: Implement SSML parsing for Web Speech API
// See https://lists.w3.org/Archives/Public/www-voice/2017OctDec/0000.html
// https://github.com/guest271314/SpeechSynthesisSSMLParser
class SpeechSynthesisSSMLParser {
  constructor(ssml, voices) {
    const utterances = [];
    const [pitches, rates] = [new Map(Object.entries({
        "x-low": 0.3333333333333333,
        "low": 0.6666666666666666,
        "default": 1,
        "medium": 1.3333333333333333,
        "high": 1.6666666666666665,
        "x-high": 1.9999999999999998
      }))

      , new Map(Object.entries({
        "x-slow": 0.1,
        "slow": 0.5,
        "default": 1,
        "medium": 2.5,
        "fast": 5,
        "x-fast": 10
      }))
    ];

    if (ssml && typeof ssml === "string") {
      ssml = (new DOMParser()).parseFromString(ssml, "application/xml");
    }

    if (ssml instanceof Document && ssml.documentElement.nodeName === "speak") {
      if (ssml.documentElement.attributes.getNamedItem("xml:lang").value.length) {
        return (async() => {
          if (ssml.documentElement.children.length === 0) {
            utterances.push(new SpeechSynthesisUtterance(ssml.documentElement.textContent));
          }
          for (let node of ssml.documentElement.children) {
            await new Promise(resolve => {
              const utterance = new SpeechSynthesisUtterance();
              utterance.lang = ssml.documentElement.attributes.getNamedItem("xml:lang").value;

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
                    [nodeName]: pitches.get(nodeValue) || rates.get(nodeValue) || nodeValue
                  }), Object.create(null)), node.textContent
                ];
                Object.assign(utterance, {
                  pitch: pitch < 0 || pitch > 2 ? pitches.default : pitch,
                  rate: rate < 0.1 || rate > 10 ? rates.default : rate,
                  text
                });
                console.log(`SpeechSynthesisUtterance pitch: ${utterance.pitch}, SpeechSynthesisUtterance rate: ${utterance.rate}`);
                utterances.push(utterance);
                resolve()
              }
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
                  }) => name.split(/\s/).some(prop => voiceName.indexOf(prop) >-1)),
                  text
                });

                utterances.push(utterance);
                console.log(`SpeechSynthesisUtterance voice: ${utterance.voice.name}`);
                resolve();

              }
            })
          }
          return utterances
        })()
      } else {
        throw new TypeError("Root element of SSML document should be <speak>")
      }
    }
  }
}
