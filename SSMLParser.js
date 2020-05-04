      // SSMLParser.js guest271314 12-17-2017 Updated 5-4-2020
      // Motivation: Implement SSML parsing for Web Speech API
      // See https://lists.w3.org/Archives/Public/www-voice/2017OctDec/0000.html
      // https://github.com/guest271314/SSMLParser
      class SSMLParser {
        constructor(ssml) {
          console.log(this);
          this.ssml = ssml;
          this.queue = [];
          this.nodes = new Map(
            Object.entries({
              break: this._break,
              prosody: this.prosody,
              '#text': this.text,
              voice: this.voice,
              p: this.p,
              s: this.s,
              'say-as': this.sayAs,
            })
          );
          this.pitches = new Map(
            Object.entries({
              'x-low': 0.3333333333333333,
              low: 0.6666666666666666,
              default: 1,
              medium: 1.3333333333333333,
              high: 1.6666666666666665,
              'x-high': 1.9999999999999998,
            })
          );
          this.rates = new Map(
            Object.entries({
              'x-slow': 0.1,
              slow: 0.5,
              default: 1,
              medium: 2.5,
              fast: 5,
              'x-fast': 10,
            })
          );
          this.strengths = new Map(
            Object.entries({
              none: 0,
              'x-weak': 0.125,
              weak: 0.25,
              medium: 0.5,
              strong: 1,
              'x-strong': 2,
            })
          );
          this.dates = new Map(
            Object.entries({
              m: 'month',
              d: 'day',
              y: 'year',
            })
          );
          this.ampm = new Map(
            Object.entries({
              a: 'AM',
              p: 'PM',
            })
          );
          this.lang = navigator.language;
          this.matchSayAsDateFormat = /\d+(?=[.\-/]|$)/g;
          this.notSayAsDateFormat = /[^\d.\-/]+/g;
          this.matchSayAsTimeDigits = /\d+/g;
          this.matchSayAsTimeAP = /[ap]/i;

          // https://codegolf.stackexchange.com/a/119563
          this.toOrdinal = n =>
            (n += [, 'st', 'nd', 'rd'][(n % 100 >> 3) ^ 1 && n % 10] || 'th');

          if (this.ssml && typeof this.ssml === 'string') {
            this.ssml = new DOMParser().parseFromString(
              ssml,
              'application/xml'
            );
          }
          if (
            this.ssml instanceof Document &&
            this.ssml.documentElement.nodeName === 'speak'
          ) {
            // handle `<break strength="none">`
            this.br();
            // handle `<sub alias="Speech Synthesis Markup Language">SSML</sub>`
            this.sub();
            if (
              this.ssml.documentElement.attributes.getNamedItem('xml:lang')
                .value.length
            ) {
              this.lang = this.ssml.documentElement.attributes.getNamedItem(
                'xml:lang'
              ).value;
            } else {
              this.lang = navigator.language;
            }
            if (this.ssml.documentElement.children.length === 0) {
              const utterance = new SpeechSynthesisUtterance(
                this.ssml.documentElement.textContent
              );
              utterance.lang = this.lang;
              this._queue({
                utterance,
              });
            } else {
              for (let node of this.ssml.documentElement.childNodes) {
                console.log(node.nodeName);
                Reflect.apply(this.nodes.get(node.nodeName), this, [
                  {
                    node,
                  },
                ]);
              }
            }
          } else {
            const utterance = new SpeechSynthesisUtterance((this.ssml = ssml));
            utterance.lang = this.lang;
            this._queue({
              utterance,
            });
          }
        }
        prosody({ node, voice }) {
          console.log('prosody', node);
          const utterance = new SpeechSynthesisUtterance();
          utterance.lang = this.lang;
          const [
            {
              pitch = this.pitches.get('default'),
              rate = this.rates.get('default'),
            },
            text,
          ] = [
            [...node.attributes].reduce(
              (o, { nodeName, nodeValue }) =>
                Object.assign(o, {
                  [nodeName]:
                    this.pitches.get(nodeValue) ||
                    this.rates.get(nodeValue) ||
                    nodeValue,
                }),
              Object.create(null)
            ),
            node.textContent,
          ];
          console.log(pitch, rate);
          Object.assign(utterance, {
            pitch: pitch < 0 || pitch > 2 ? this.pitches.get('default') : pitch,
            rate: rate < 0.1 || rate > 10 ? this.rates.get('default') : rate,
            text,
            voice,
          });
          this._queue({
            utterance,
          });
        }
        voice({ node }) {
          const [{ name }, text] = [
            [...node.attributes].reduce(
              (o, { nodeName, nodeValue }) =>
                Object.assign(o, {
                  [nodeName]: nodeValue,
                }),
              Object.create(null)
            ),
            node.textContent,
          ];
          const voice = SSMLParser.voices.find(
            ({ name: voiceName }) =>
              voiceName === name || voiceName.includes(name)
          );
          console.log(name, voice);
          if (node.children.length === 0) {
            const utterance = new SpeechSynthesisUtterance();
            if (node.getAttribute('languages')) {
              utterance.lang = node.getAttribute('languages');
            }
            Object.assign(utterance, {
              voice,
              text,
            });
            this._queue({
              utterance,
            });
          } else {
            for (let childNode of node.childNodes) {
              Reflect.apply(this.nodes.get(childNode.nodeName), this, [
                {
                  node: childNode,
                  voice,
                },
              ]);
            }
          }
        }
        _break({ node, _strength }) {
          let strength = !node
            ? _strength // handle `<p>` and `<s>` elements
            : node.getAttribute('strength')
            ? this.strengths.get(node.getAttribute('strength'))
            : node.getAttribute('time')
            ? this.strengths.get('none')
            : this.strengths.get('medium');
          // handle "250ms", "3s"
          let time =
            node && node.getAttribute('time')
              ? node
                  .getAttribute('time')
                  .match(/[\d.]+|\w+$/g)
                  .reduce(
                    (n, t /* "ms" or "s" */) =>
                      Number(n) * (t === 's' ? 1 : 0.001)
                  )
              : this.strengths.get('none');
          console.log(strength, time);
          // https://www.w3.org/TR/2010/REC-speech-synthesis11-20100907/#S3.2.3
          // "If both strength and time attributes are supplied,
          // the processor will insert a break with a duration as specified by the time attribute,
          // with other prosodic changes in the output based on the value of the strength attribute."
          if (!strength && !time) {
            strength = this.strengths.get('medium');
          }
          time += strength;
          console.log(time);
          this.queue.push(
            () =>
              new Promise(resolve => {
                const context = new AudioContext();
                const ab = context.createBuffer(1, 44100 * time, 44100);
                const source = context.createBufferSource();
                source.buffer = ab;
                source.connect(context.destination);
                source.onended = e => {
                  source.onended = null;
                  context.close().then(resolve);
                };
                source.start(context.currentTime);
                source.stop(context.currentTime + time);
              })
          );
        }
        _queue({ utterance }) {
          if (utterance && utterance instanceof SpeechSynthesisUtterance) {
            this.queue.push(
              () =>
                new Promise(resolve => {
                  if (utterance.voice === null) {
                    utterance.voice = SSMLParser.voices.find(({ name }) =>
                      new RegExp(
                        `^${navigator.languages[0].split('-')[0]}`,
                        'i'
                      ).test(name)
                    );
                  }
                  console.log(utterance.voice.name);
                  utterance.onend = resolve;
                  window.speechSynthesis.speak(utterance);
                })
            );
          }
        }
        text({ node, voice }) {
          const utterance = new SpeechSynthesisUtterance(node.nodeValue);
          if (voice) {
            utterance.voice = voice;
          }
          if (utterance.text.trim()) {
            this._queue({
              utterance,
            });
          }
        }
        sub() {
          const utterance = new SpeechSynthesisUtterance();
          // handle `<sub alias="Speech Synthesis Markup Language">SSML</sub>`
          // replace the element with `#text` node with `nodeValue` set to `alias` attribute value
          // https://www.w3.org/TR/2010/REC-speech-synthesis11-20100907/#edef_sub
          // "The sub element is employed to indicate that the text in the alias attribute value replaces the contained text for pronunciation.
          // This allows a document to contain both a spoken and written form.
          // The required alias attribute specifies the string to be spoken instead of the enclosed string.
          // The processor should apply text normalization to the alias value."
          this.ssml.querySelectorAll('sub').forEach(sub => {
            const textNode = this.ssml.createTextNode(
              sub.getAttribute('alias')
            );
            sub.parentNode.replaceChild(textNode, sub);
          });
        }
        br() {
          // handle `<break strength="none"/>`
          // remove the element
          // https://www.w3.org/TR/2010/REC-speech-synthesis11-20100907/#S3.2.3
          // "The value "none" indicates that no prosodic break boundary should be outputted,
          // which can be used to prevent a prosodic break which the processor would otherwise produce."
          this.ssml.querySelectorAll('break').forEach(br => {
            if (br.getAttribute('strength') === 'none') {
              if (
                br.nextSibling &&
                br.nextSibling.nodeName === '#text' &&
                br.previousSibling &&
                br.previousSibling.nodeName === '#text'
              ) {
                br.previousSibling.nodeValue += br.nextSibling.nodeValue;
                br.parentNode.removeChild(br.nextSibling);
                br.parentNode.removeChild(br);
              } else {
                br.parentNode.removeChild(br);
              }
            }
          });
        }
        // handle `<p>` element and `<s>` elements
        // The specification does not appear to explicitly define a change to prosody,
        // or a pause in audio output before and after, or pause only after a `<p>` element.
        // https://www.w3.org/TR/2010/REC-speech-synthesis11-20100907/#S3.1.8.1
        // "A p element represents a paragraph. An s element represents a sentence."
        // "The use of p and s elements is optional. Where text occurs without an enclosing p or s element
        // the synthesis processor should attempt to determine the structure using language-specific knowledge of the format of plain text."
        p({ node, voice }) {
          if (node.children.length === 0) {
            console.log(node.textContent);
            const utterance = new SpeechSynthesisUtterance(node.textContent);
            if (voice) {
              utterance.voice = voice;
            }
            // The specification does not appear to explicitly define a change to prosody,
            // or a pause in audio output before and after, or pause only after a `<p>` element.
            // this._break({_strength:this.strengths.get("weak")});
            this._queue({
              utterance,
            });
            // this._break({_strength:this.strengths.get("weak")});
          } else {
            for (let childNode of node.childNodes) {
              Reflect.apply(this.nodes.get(childNode.nodeName), this, [
                {
                  node: childNode,
                  voice,
                },
              ]);
            }
          }
        }
        s({ node, voice }) {
          if (node.children.length === 0) {
            console.log(node.textContent);
            const utterance = new SpeechSynthesisUtterance(node.textContent);
            if (voice) {
              utterance.voice = voice;
            }
            // this._break({_strength:this.strengths.get("x-weak")});
            this._queue({
              utterance,
            });
            // this._break({_strength:this.strengths.get("x-weak")});
          } else {
            for (let childNode of node.childNodes) {
              Reflect.apply(this.nodes.get(childNode.nodeName), this, [
                {
                  node: childNode,
                  voice,
                },
              ]);
            }
          }
        }
        // https://www.w3.org/TR/2005/NOTE-ssml-sayas-20050526
        sayAs({ node, voice }) {
          const interpretAs = node.getAttribute('interpret-as');
          if (interpretAs === 'characters' || interpretAs === 'digits') {
            for (let char of node.textContent) {
              const utterance = new SpeechSynthesisUtterance(char);
              this._queue({
                utterance,
              });
            }
          }
          if (interpretAs === 'cardinal') {
            const utterance = new SpeechSynthesisUtterance(node.textContent);
            this._queue({
              utterance,
            });
          }
          if (interpretAs === 'ordinal') {
            const utterance = new SpeechSynthesisUtterance(
              this.toOrdinal(node.textContent)
            );
            this._queue({
              utterance,
            });
          }
          if (interpretAs === 'date') {
            const utterance = new SpeechSynthesisUtterance();
            node.textContent = node.textContent.replace(
              this.notSayAsDateFormat,
              ''
            );

            if (node.getAttribute('format')) {
              const format = [...node.getAttribute('format')];

              let {
                month = '1',
                day = '1',
                year = new Date().getFullYear(),
              } = format.reduce(
                (o, key, index) => ({
                  [this.dates.get(key)]: node.textContent.match(
                    this.matchSayAsDateFormat
                  )[index],
                  ...o,
                }),
                {}
              );

              if (year.length === 2) {
                year =
                  new Date()
                    .getFullYear()
                    .toString()
                    .slice(0, 2) + year;
              }

              const date = new Map(
                new Intl.DateTimeFormat(this.lang, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
                  .formatToParts(new Date(`${month},${day},${year}`))
                  .map(({ type, value }) => [type, value])
              );

              const text =
                `${format.includes('m') ? date.get('month') : ''} ` +
                `${
                  format.includes('d')
                    ? this.toOrdinal(date.get('day')).concat(
                        format.includes('y') ? date.get('literal') : ''
                      )
                    : ''
                }` +
                `${format.includes('y') ? date.get('year') : ''}`;

              console.log(month, day, year, date, text);

              utterance.text = text;
              this._queue({
                utterance,
              });
            } else {
              utterance.text = node.textContent;
              this._queue({
                utterance,
              });
            }
          }
          // https://www.w3.org/TR/ssml-sayas/#time
          if (interpretAs === 'time') {
            if (node.getAttribute('format')) {
              const format = node.getAttribute('format');

              let t = node.textContent.match(this.matchSayAsTimeDigits);

              const ampm = node.textContent.match(this.matchSayAsTimeAP);

              let text = '';

              if (t[0].length === 3) {
                t = [t[0].slice(0, 1), t[0].slice(1)];
              }

              if (t[0].length === 4) {
                t = [t[0].slice(0, 2), t[0].slice(2)];
              }

              console.log(t);

              const date = new Date(...[1970, 0, 1].concat(...t).map(Number));

              console.log(date);

              const time = new Map(
                new Intl.DateTimeFormat(this.lang, {
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                  timeZoneName: 'long',
                  hourCycle: 'h24',
                })
                  .formatToParts(date)
                  .map(({ type, value }) => [type, value])
                  .concat([['millisecond', date.getMilliseconds()]])
              );

              if (ampm && ampm.length) {
                time.set('dayperiod', this.ampm.get(ampm.pop().toLowerCase()));
              }

              text += `${Number(time.get('hour'))}`;

              if (Number(time.get('minute'))) {
                if (Number(time.get('minute')) < 10) {
                  // `O` : zero
                  text += ` O ${Number(time.get('minute'))}`;
                } else {
                  text += `:${time.get('minute')}`;
                }
              }

              if (Number(time.get('second'))) {
                text += ` and ${Number(time.get('second'))}${
                  Number(time.get('millisecond'))
                    ? '.' + time.get('millisecond') + ' '
                    : ' '
                }second${Number(time.get('second')) ? 's' : ''}`;
              }

              if (format === 'hms24') {
                text += ` ${time.get('dayperiod')} ${time.get('timeZoneName')}`;
              }

              if (format === 'hms12') {
                if (!this.matchSayAsTimeAP.test(text) && !ampm) {
                  text += " o'clock";
                } else {
                  if (ampm) {
                    text += ` ${time.get('dayperiod')}`;
                  }
                }
              }

              console.log(ampm, time);

              const utterance = new SpeechSynthesisUtterance(text);
              this._queue({
                utterance,
              });
            } else {
              const utterance = new SpeechSynthesisUtterance(node.textContent);
              this._queue({
                utterance,
              });
            }
          }
        }
      }
