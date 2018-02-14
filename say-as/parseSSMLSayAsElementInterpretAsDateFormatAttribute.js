// parseSSMLSayAsElementInterpretAsDateFormatAttribute.js 2-13-2018 guest271314
// https://github.com/guest271314/SpeechSynthesisSSMLParser
// https://www.w3.org/TR/speech-synthesis11/#S3.1.9
// https://www.w3.org/TR/2005/NOTE-ssml-sayas-20050526
// https://bugs.chromium.org/p/chromium/issues/detail?id=88072
// https://bugs.chromium.org/p/chromium/issues/detail?id=795371
// https://bugzilla.mozilla.org/show_bug.cgi?id=1425523
// https://github.com/w3c/web-platform-tests/issues/8712
// https://lists.w3.org/Archives/Public/www-voice/2017OctDec/0000.html
// https://lists.w3.org/Archives/Public/public-speech-api/2017Dec/0000.html
// https://github.com/w3c/web-platform-tests/issues/8795

// https://stackoverflow.com/q/13627308
// https://codegolf.stackexchange.com/a/119563
const toOrdinal = n => n += [, "st", "nd", "rd"][n % 100 >> 3 ^ 1 && n % 10] || "th";

// handle `<say-as>` `format` attribute values "mdy"`, `"dmy"`, `"ymd"`, `"md"`,
// `"dm"`, `"ym"`, `"d"`, `"m"`, `"y"`
const dates = new Map(Object.entries({
  "m": "month",
  "d": "day",
  "y": "year"
}));


const handleVoicesChanged = async() => {
  console.log("voiceschanged");
  window.speechSynthesis.onvoiceschanged = null;
  const ssmlString = `<?xml version="1.0"?>
  <speak version="1.1"
       xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.w3.org/2001/10/synthesis http://www.w3.org/TR/speech-synthesis11/synthesis.xsd"
       xml:lang="en-US">
       <say-as interpret-as="date">8-12-2002</say-as>
       <say-as interpret-as="date" format="mdy">3-6-02</say-as> 
       <say-as interpret-as="date" format="mdy">09.21.2001</say-as>  
       <say-as interpret-as="date" format="dmy">01/02/1960</say-as> 
       <say-as interpret-as="date" format="ymd">1960-02-01</say-as>  
       <say-as interpret-as="date" format="md">11/12</say-as>  
       <say-as interpret-as="date" format="dm">12/11</say-as>  
       <say-as interpret-as="date" format="ym">12/11</say-as> 
       <say-as interpret-as="date" format="my">11/12</say-as> 
       <say-as interpret-as="date" format="d">12</say-as>  
       <say-as interpret-as="date" format="m">12</say-as>  
       <say-as interpret-as="date" format="y">12</say-as> 
  </speak>`;
  const parser = new DOMParser();
  const ssmlDocument = parser.parseFromString(ssmlString, "text/xml");


  for (let node of ssmlDocument.documentElement.children) {
    if (node.nodeName === "say-as") {

      const interpretAs = node.getAttribute("interpret-as");

      if (interpretAs === "date") {


        node.textContent = node.textContent.replace(/[^\d.\-/]+/g, "");

        if (node.getAttribute("format")) {

          const format = node.getAttribute("format");

          let {
            month = "1", day = "1", year = new Date().getFullYear()
          } = [...format].reduce((o, key, index) => ({
            [dates.get(key)]: node.textContent.match(/\d+(?=[.\-/]|$)/g)[index], ...o
          }), {});

          if (year.length === 2) {
            year = new Date().getFullYear().toString().slice(0, 2) + year;
          }

          const date = new Map(
            new Intl.DateTimeFormat(navigator.language, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })
            .formatToParts(new Date(`${month},${day},${year}`)).map(({
              type, value
            }) => [type, value]));

          const text = `${format.includes("m") ? date.get("month") : ""} ` 
                       + `${format.includes("d") ? toOrdinal(date.get("day")).concat(format.includes("y") ? date.get("literal") : "")  : ""}` 
                       + `${format.includes("y") ? date.get("year") : ""}`;

          console.log(node.getAttribute("format"), node.textContent, month, day, year, date);

          const utterance = new SpeechSynthesisUtterance(text);
          await new Promise(resolve => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = e => {
              utterance.onend = null;
              resolve()
            }

            console.log(`SpeechSynthesisUtterance text: ${utterance.text}`);
            window.speechSynthesis.speak(utterance)
          });
          
        } else {
          await new Promise(resolve => {
            const utterance = new SpeechSynthesisUtterance(node.textContent);
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
