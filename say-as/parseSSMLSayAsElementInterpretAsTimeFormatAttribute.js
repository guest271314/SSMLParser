// parseSSMLSayAsElementInterpretAsTimeFormatAttribute.js 2-15-2018 guest271314
// https://github.com/guest271314/SpeechSynthesisSSMLParser
// https://www.w3.org/TR/speech-synthesis11/#S3.1.9
// https://www.w3.org/TR/ssml-sayas/#time
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
       <say-as interpret-as="time" format="hms24">00:00:00</say-as> 
       <say-as interpret-as="time" format="hms24">000000</say-as> 
       <say-as interpret-as="time" format="hms24">12:00:00</say-as>  
       <say-as interpret-as="time" format="hms24">9:21:30</say-as>  
       <say-as interpret-as="time" format="hms24">01:59:59</say-as>  
       <say-as interpret-as="time" format="hms24">19:21:30.1</say-as>  
       <say-as interpret-as="time" format="hms24">12.00</say-as>  
       <say-as interpret-as="time" format="hms24">00:01</say-as> 
       <say-as interpret-as="time" format="hms24">1</say-as> 
       <say-as interpret-as="time" format="hms24">115</say-as>  
       <say-as interpret-as="time" format="hms24">07.00</say-as> 
       <say-as interpret-as="time" format="hms12">09:21:15</say-as>
       <say-as interpret-as="time" format="hms12">1200</say-as> 
       <say-as interpret-as="time" format="hms12">2</say-as> 
       <say-as interpret-as="time" format="hms12">3.00</say-as> 
       <say-as interpret-as="time" format="hms12">09:21:00PM</say-as> 
       <say-as interpret-as="time" format="hms12">12:00 am</say-as> 
       <say-as interpret-as="time" format="hms12">12.00pm</say-as>
       <say-as interpret-as="time" format="hms12">243P</say-as> 
       <say-as interpret-as="time" format="hms12">2p.m.</say-as> 
       <say-as interpret-as="time" format="hms12">${new Date().toLocaleTimeString()}</say-as>
       <say-as interpret-as="time">${new Date().toLocaleTimeString()}</say-as>
    </speak>`;
  const parser = new DOMParser();
  const ssmlDocument = parser.parseFromString(ssmlString, "text/xml");


  for (let node of ssmlDocument.documentElement.children) {
    if (node.nodeName === "say-as") {

      const interpretAs = node.getAttribute("interpret-as");

      if (interpretAs === "time") {

        if (node.getAttribute("format")) {

          const format = node.getAttribute("format");

          const ymd = [new Date().getFullYear(), 1, 0];

          let input = node.textContent.match(/\d+/g);

          const ampm = node.textContent.match(/[ap]/i);

          const AMPM = {
            a: "AM",
            p: "PM"
          };
          
          let text = "";

          if (input[0].length === 3) {
            input = [input[0].slice(0, 1), input[0].slice(1)];
          }

          if (input[0].length === 4) {
            input = [input[0].slice(0, 2), input[0].slice(2)];
          }

          console.log(ymd.concat(...input).map(Number));

          let date = new Date(...ymd.concat(...input).map(Number));

          console.log(date);

          const time = new Map(
            new Intl.DateTimeFormat(this.lang, {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            timeZoneName: "long",
            hourCycle: "h24"
          })
          .formatToParts(date)
          .map(({
              type, value
          }) => [type, value])
          .concat([
            ["millisecond", date.getMilliseconds()]
          ]));

          if (ampm && ampm.length) {
            time.set("dayperiod", AMPM[ampm.pop().toLowerCase()])
          }
          
          text += `${Number(time.get("hour"))}`;
          
          if ( Number(time.get("minute")) ) {
            if ( Number(time.get("minute")) < 10) {
               // `O` : zero
               text += ` O ${Number(time.get("minute"))}`;
            } else {
              text += `:${time.get("minute")}`;
            }
          }
          
          if (Number(time.get("second"))) {
               text += ` and ${Number(time.get("second"))}${Number(time.get("millisecond")) 
                       ? "." + time.get("millisecond") + " " 
                       : " "}second${Number(time.get("second")) ? "s" : ""}`;

          }
          
          if (format === "hms24") {
            text += ` ${time.get("dayperiod")} ${time.get("timeZoneName")}`;
          }
          
          if (format === "hms12") {
            if (!/[ap]/i.test(text) && !ampm) {
              text += " o'clock";
            } else {
              text += ` ${time.get("dayperiod")}`;
            }
          }
          
          console.log(ampm, time);

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
