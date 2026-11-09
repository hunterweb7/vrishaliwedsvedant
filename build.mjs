// Build: node build.mjs
// Source of truth is src/template.html (English). This writes the deployable site into dist/:
//   dist/en/index.html  English page
//   dist/ma/index.html  Marathi page (text copied from the printed Marathi card; parents only)
//   dist/index.html     root: sends visitors to /en/ or /ma/ (remembers the toggle choice)
//   dist/404.html       not-found page (its presence also turns off Cloudflare Pages' SPA fallback)
//   dist/_headers       Cloudflare Pages response headers
//   dist/assets/..., dist/photoN.jpg  copied from the repo
// Every Marathi replacement must match, otherwise the build stops with an error.
//
// Cloudflare Pages settings: Build command `node build.mjs`, Build output directory `dist`.
// Link previews (WhatsApp etc.) need absolute URLs. Set SITE_URL if the address is not the default,
// e.g. a custom domain:  SITE_URL=https://vrishaliwedsvedant.com  (Pages > Settings > Variables).
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from "node:fs";

const SITE = (process.env.SITE_URL || "https://vrishaliwedsvedant.pages.dev").replace(/\/+$/, "");
const OUT = new URL("./dist/", import.meta.url);
const T = readFileSync(new URL("./src/template.html", import.meta.url), "utf8");
const S = '<svg class="swas" aria-hidden="true"><use href="#swastika"/></svg>';

// Assets live in the site root; pages live one folder down.
const fixPaths = (h) =>
  h.replace(/(src|href)="(photo\d\.jpg|assets\/)/g, '$1="../$2')
   .replace(/url\((assets\/)/g, 'url(../$1')
   .replace(/'(photo\d\.jpg)'/g, "'../$1'")
   .replace(/'(assets\/)/g, "'../$1");

/* ---------- MARATHI TEXT (copied from the printed Marathi card) ----------
   Card front:  ॥शुभविवाह॥ · चि.सौ.कां. वृषाली 卐 चि. वेदांत · शुक्रवार दि. ०१ जानेवारी २०२७ रोजी · सकाळी १० वा. ३० मि. · सस्नेह निमंत्रण
   Inside:      ।। श्री गणेशाय नमः ।। · स.न.वि.वि. आमचे येथे श्रीकृपेकरुन
                चि.सौ.कां. वृषाली · सौ. अर्चना व श्री. सुभाषराव गुल्हाने · रा. सुरळी, जि. अमरावती, ह.मु. पुणे यांची कन्या
                चि. वेदांत · सौ. प्रिया व प्रा.डॉ.श्री. संजयराव तिरथकर · रा. अमरावती यांचे चिरंजीव
                ।। यांचा शुभविवाह ।।
                * विवाह मुहूर्त * मिती मार्गशीर्ष कृ.९ शके १९४८ / शुक्रवार दि. १जानेवारी २०२७ / सकाळी १०.३० वा.
                * विवाहस्थळ * सिल्वर स्टार / सेलीब्रेशन हॉल / शेगाव-रहाटगांव रोड / अमरावती
                स्वरुची भोज लग्नानंतर लगेच
                आहेर पध्दत पुर्णतः बंद....आपली उपस्थिती व आशिर्वादच अमुल्य....
   Grandparent and relatives lines are left out on purpose (parents only).
------------------------------------------------------------------------ */
const MR = [
  // document
  ['<html lang="en">', '<html lang="mr">'],
  ['<title>Vrishali &amp; Vedant · Wedding Invitation</title>', '<title>वृषाली 卐 वेदांत · शुभविवाह</title>'],
  ['content="Wedding Invitation · Vrishali with Vedant · Friday, 1 January 2027, 10:30 AM · Silver Star Celebration Hall, Shegaon-Rahatgaon Road, Amravati"', 'content="शुभविवाह · चि.सौ.कां. वृषाली व चि. वेदांत · शुक्रवार दि. ०१ जानेवारी २०२७ रोजी सकाळी १० वा. ३० मि. · सिल्वर स्टार सेलीब्रेशन हॉल, शेगाव-रहाटगांव रोड, अमरावती"'],
  ['<meta property="og:title" content="Vrishali &amp; Vedant · Wedding Invitation">', '<meta property="og:title" content="वृषाली 卐 वेदांत · शुभविवाह">'],
  ['<meta property="og:description" content="Friday, 1 January 2027 · 10:30 AM · Silver Star Celebration Hall, Shegaon-Rahatgaon Road, Amravati">', '<meta property="og:description" content="शुक्रवार दि. ०१ जानेवारी २०२७ रोजी सकाळी १० वा. ३० मि. · सिल्वर स्टार सेलीब्रेशन हॉल, शेगाव-रहाटगांव रोड, अमरावती">'],

  // 5.1 gate
  ['aria-label="Wedding invitation of Vrishali and Vedant. Press Tap to Open."', 'aria-label="वृषाली व वेदांत यांचे शुभविवाह निमंत्रण. उघडण्यासाठी टॅप करा."'],
  ['<div class="plaque-text"><span class="vv">V&amp;V</span><span class="mr">वृषाली   वेदांत</span></div>', `<div class="plaque-text"><span class="mr">वृषाली${S}वेदांत</span></div>`],
  ['Opening the invitation…', 'निमंत्रण उघडत आहे…'],
  ['<button class="btn" id="openBtn" type="button">Tap to Open</button>', '<button class="btn" id="openBtn" type="button">उघडण्यासाठी टॅप करा</button>'],

  // 5.2 hero
  ['aria-label="Vrishali with Vedant">', 'aria-label="वृषाली व वेदांत">'],
  ['<p class="bless" data-h style="--d:.2s">II Shree Ganeshaya Namah II</p>', '<p class="bless" data-h style="--d:.2s">।। श्री गणेशाय नमः ।।</p>'],
  ['<p class="bless-mr" data-h style="--d:.35s">।। श्री गणेशाय नमः ।।</p>', '<p class="bless-mr" data-h style="--d:.35s">स.न.वि.वि. आमचे येथे श्रीकृपेकरुन</p>'],
  ['<h1 class="names" aria-label="Vrishali with Vedant">', '<h1 class="names" aria-label="चि.सौ.कां. वृषाली व चि. वेदांत">'],
  ['<span class="nm n1" aria-hidden="true">Vrishali</span>', '<span class="nm n1" aria-hidden="true">वृषाली</span>'],
  ['<span class="nm with" aria-hidden="true">with</span>', `<span class="nm with" aria-hidden="true">${S}</span>`],
  ['<span class="nm n2" aria-hidden="true">Vedant</span>', '<span class="nm n2" aria-hidden="true">वेदांत</span>'],
  ['<p class="names-mr" data-h style="--d:2.1s">वृषाली   वेदांत</p>', '<p class="names-mr" data-h style="--d:2.1s">सस्नेह निमंत्रण</p>'],
  ['<p class="hero-sub" data-h style="--d:2.3s">Wedding Invitation</p>', '<p class="hero-sub" data-h style="--d:2.3s">॥ शुभविवाह ॥</p>'],
  ['<p class="hero-date" data-h style="--d:2.5s"><span>Friday</span><i aria-hidden="true"></i><span>1 January 2027</span><i aria-hidden="true"></i><span>10:30 AM</span></p>', '<p class="hero-date" data-h style="--d:2.5s"><span>शुक्रवार दि. ०१ जानेवारी २०२७ रोजी</span><i aria-hidden="true"></i><span>सकाळी १० वा. ३० मि.</span></p>'],
  ['<svg aria-hidden="true"><use href="#i-cal"/></svg>Save the Date</a>', '<svg aria-hidden="true"><use href="#i-cal"/></svg>दिनांक लक्षात ठेवा</a>'],
  ['aria-label="Scroll to the invitation card"', 'aria-label="निमंत्रण पत्रिकेकडे जा"'],
  ['alt="Vrishali and Vedant walking down the aisle, smiling at each other while soft white balls fall around them"', 'alt="वृषाली व वेदांत हसत एकमेकांकडे पाहत चालताना, भोवती पांढरे गोळे पडत आहेत"'],

  // 5.3 invitation card
  ['<p class="eyebrow" data-reveal="fade">The Invitation</p>', '<p class="eyebrow" data-reveal="fade">निमंत्रण पत्रिका</p>'],
  // non-breaking spaces keep the ॥ marks attached to the words on narrow phones
  ['<span>Wedding Ceremony</span></span></h2>', '<span>॥&nbsp;यांचा शुभविवाह&nbsp;॥</span></span></h2>'],
  ['<p class="sub" data-reveal="up" style="--d:.3s">Friday · 1 January 2027</p>', '<p class="sub" data-reveal="up" style="--d:.3s">शुक्रवार दि. ०१ जानेवारी २०२७ रोजी</p>', 'all'],
  ['<span class="arch-names">Vrishali<br>Vedant</span>', '<span class="arch-names">वृषाली<br>वेदांत</span>'],
  ['<p class="c-bless">II Shree Ganeshaya Namah II</p>', '<p class="c-bless">।। श्री गणेशाय नमः ।।</p>'],
  ['<p class="c-req">WE REQUEST YOUR GRACIOUS PRESENCE FOR THE WEDDING CEREMONY OF</p>', '<p class="c-req">स.न.वि.वि. आमचे येथे श्रीकृपेकरुन</p>'],
  ['<p class="c-name">Vrishali</p>', '<p class="c-name">चि.सौ.कां. वृषाली</p>'],
  ['<p class="c-par">(D/o. Mrs. Archana &amp; Mr. Subhash Gulhane)</p>', '<p class="c-par">सौ. अर्चना व श्री. सुभाषराव गुल्हाने<br>रा. सुरळी, जि. अमरावती, ह.मु. पुणे यांची कन्या</p>'],
  ['<p class="c-with">with</p>', `<p class="c-with">${S}</p>`],
  ['<p class="c-name">Vedant</p>', '<p class="c-name">चि. वेदांत</p>'],
  ['<p class="c-par">(S/o Mrs. Priya &amp; Dr. Sanjay Tirathkar)</p>', '<p class="c-par">सौ. प्रिया व प्रा.डॉ.श्री. संजयराव तिरथकर<br>रा. अमरावती यांचे चिरंजीव</p>'],
  ['<p class="c-bo">BLESSINGS ONLY</p>', '<p class="c-bo">।। यांचा शुभविवाह ।।</p>'],
  ['<p class="b-title">Wedding Ceremony</p>', '<p class="b-title">विवाह मुहूर्त</p>'],
  ['<span class="b-side">Friday</span>', '<span class="b-side">शुक्रवार</span>'],
  ['<span class="b-main"><span>January</span><b>01</b><span>2027</span></span>', '<span class="b-main"><span>जानेवारी</span><b>१</b><span>२०२७</span></span>'],
  ['<span class="b-side">10:30 AM</span>', '<span class="b-side">सकाळी १०.३० वा.</span>'],
  ['<p class="b-vl">Venue</p>', '<p class="b-vl">विवाहस्थळ</p>'],
  ['<p class="b-venue">Silver Star Celebration Hall</p>', '<p class="b-venue">सिल्वर स्टार सेलीब्रेशन हॉल</p>'],
  ['<p class="b-addr">Shegaon-Rahatgaon Road, Amravati</p>', '<p class="b-addr">शेगाव-रहाटगांव रोड<br>अमरावती</p>'],
  ['<p class="b-rl">With Regards:</p>', '<p class="b-rl">मिती मार्गशीर्ष कृ.९ शके १९४८</p>'],
  ['<p class="b-reg">Sau. Archana &amp; Mr. Subhash Gulhane</p>', '<p class="b-reg">स्वरुची भोज लग्नानंतर लगेच</p>'],
  ['<p class="b-reg2">Surali, Tal. Warud, Dist. Amravati</p>', '<p class="b-reg2">सस्नेह निमंत्रण</p>'],
  ['<span id="turnTxt">Tap to turn</span>', '<span id="turnTxt">पत्रिका उलटा</span>'],

  // 5.4 couple
  ['<p class="eyebrow" data-reveal="fade">The Couple</p>', '<p class="eyebrow" data-reveal="fade">वधू-वर</p>'],
  ['<span>Bride &amp; Groom</span></span></h2>', '<span>वधू व वर</span></span></h2>'],
  ['<p class="sub" data-reveal="up" style="--d:.3s">Vrishali with Vedant</p>', `<p class="sub" data-reveal="up" style="--d:.3s">वृषाली${S}वेदांत</p>`],
  ['alt="Illustrated portrait of Vrishali"', 'alt="वृषालीचे चित्र"'],
  ['alt="Illustrated portrait of Vedant"', 'alt="वेदांतचे चित्र"'],
  ['<p class="eyebrow p-label">Bride</p>', '<p class="eyebrow p-label">वधू</p>'],
  ['<h3 class="p-name">Vrishali</h3>', '<h3 class="p-name">वृषाली</h3>'],
  ['<p class="p-par">D/o. Mrs. Archana &amp; Mr. Subhash Gulhane</p>', '<p class="p-par">सौ. अर्चना व श्री. सुभाषराव गुल्हाने<br>रा. सुरळी, जि. अमरावती, ह.मु. पुणे यांची कन्या</p>'],
  ['<p class="eyebrow p-label">Groom</p>', '<p class="eyebrow p-label">वर</p>'],
  ['<h3 class="p-name">Vedant</h3>', '<h3 class="p-name">वेदांत</h3>'],
  ['<p class="p-par">S/o Mrs. Priya &amp; Dr. Sanjay Tirathkar</p>', '<p class="p-par">सौ. प्रिया व प्रा.डॉ.श्री. संजयराव तिरथकर<br>रा. अमरावती यांचे चिरंजीव</p>'],

  // marquee
  ["html += '<span class=\"mq-item\">Shubh Vivah<img", "html += '<span class=\"mq-item\">शुभविवाह<img"],

  // 5.5 countdown
  ['<p class="eyebrow" data-reveal="fade">Save the Date</p>', '<p class="eyebrow" data-reveal="fade">विवाह मुहूर्त</p>'],
  ['<span>Counting Down</span></span></h2>', '<span>उलटी गणती</span></span></h2>'],
  ['<span class="cd-lab">Days</span>', '<span class="cd-lab">दिवस</span>'],
  ['<span class="cd-lab">Hours</span>', '<span class="cd-lab">तास</span>'],
  ['<span class="cd-lab">Minutes</span>', '<span class="cd-lab">मिनिटे</span>'],
  ['<span class="cd-lab">Seconds</span>', '<span class="cd-lab">सेकंद</span>'],
  ['<p class="cd-done" id="cdDone" hidden>Just Married</p>', '<p class="cd-done" id="cdDone" hidden>शुभविवाह संपन्न</p>'],
  ['<p class="cd-sub" data-reveal="up" style="--d:.4s">1 January 2027 · 10:30 AM IST</p>', '<p class="cd-sub" data-reveal="up" style="--d:.4s">शुक्रवार दि. १जानेवारी २०२७ · सकाळी १०.३० वा.</p>'],

  // 5.6 venue
  ['<p class="eyebrow" data-reveal="fade">Where to Find Us</p>', '<p class="eyebrow" data-reveal="fade">पत्ता</p>'],
  ['<span>Venue Details</span></span></h2>', '<span>विवाहस्थळ</span></span></h2>'],
  ['<p class="sub" data-reveal="up" style="--d:.3s">Silver Star Celebration Hall</p>', '<p class="sub" data-reveal="up" style="--d:.3s">सिल्वर स्टार सेलीब्रेशन हॉल</p>'],
  ['<p class="v-lab">Date</p><p class="v-val">1 January 2027</p><p class="v-small">Friday</p>', '<p class="v-lab">दिनांक</p><p class="v-val">१जानेवारी २०२७</p><p class="v-small">शुक्रवार</p>'],
  ['<p class="v-lab">Time</p><p class="v-val">10:30 AM</p><p class="v-small">IST</p>', '<p class="v-lab">वेळ</p><p class="v-val">सकाळी १०.३० वा.</p><p class="v-small">भारतीय वेळ</p>'],
  ['<p class="v-lab">Venue</p><p class="v-val">Silver Star Celebration Hall</p><p class="v-small">Shegaon-Rahatgaon Road, Amravati</p>', '<p class="v-lab">विवाहस्थळ</p><p class="v-val">सिल्वर स्टार सेलीब्रेशन हॉल</p><p class="v-small">शेगाव-रहाटगांव रोड, अमरावती</p>'],
  ['<svg aria-hidden="true"><use href="#i-cal"/></svg>Add to Calendar</button>', '<svg aria-hidden="true"><use href="#i-cal"/></svg>कॅलेंडरमध्ये जोडा</button>'],
  ['<svg aria-hidden="true"><use href="#i-pin"/></svg>Get Directions</a>', '<svg aria-hidden="true"><use href="#i-pin"/></svg>मार्ग पहा</a>'],
  ['<p class="dev" lang="mr">तिथी मार्गशीर्ष कृ. ९ शके १९४८ शुक्रवार दि. १ जानेवारी २०२७ सकाळी १०.३० वा.</p>', '<h4>* विवाह मुहूर्त *</h4><p class="dev" lang="mr">मिती मार्गशीर्ष कृ.९ शके १९४८<br>शुक्रवार दि. १जानेवारी २०२७<br>सकाळी १०.३० वा.</p>'],
  ['<p class="dev" lang="mr">सिल्वर स्टार सेलिब्रेशन हॉल, शेगाव-रहाटगाव रोड, अमरावती</p>', '<h4>* विवाहस्थळ *</h4><p class="dev" lang="mr">सिल्वर स्टार<br>सेलीब्रेशन हॉल<br>शेगाव-रहाटगांव रोड<br>अमरावती</p>'],
  ['&amp;hl=en&amp;output=embed" title="Google Maps: Silver Star Celebration Hall, Shegaon-Rahatgaon Road, Amravati"', '&amp;hl=mr&amp;output=embed" title="Google नकाशा: सिल्वर स्टार सेलीब्रेशन हॉल, शेगाव-रहाटगांव रोड, अमरावती"'],
  ['<span class="map-label">Silver Star Celebration Hall</span><span class="map-addr">Shegaon-Rahatgaon Road, Amravati</span>', '<span class="map-label">सिल्वर स्टार सेलीब्रेशन हॉल</span><span class="map-addr">शेगाव-रहाटगांव रोड, अमरावती</span>'],
  ['<svg aria-hidden="true"><use href="#i-pin"/></svg>Open in Google Maps</a>', '<svg aria-hidden="true"><use href="#i-pin"/></svg>Google Maps मध्ये उघडा</a>'],

  // 5.7 events
  ['<p class="eyebrow" data-reveal="fade">Programme</p>', '<p class="eyebrow" data-reveal="fade">कार्यक्रम</p>'],
  ['<span>Wedding Events</span></span></h2>', '<span>विवाह सोहळा</span></span></h2>'],
  ['<h3 class="tl-fn" style="margin:0;font-weight:400">Wedding</h3>', '<h3 class="tl-fn" style="margin:0;font-weight:400">शुभविवाह</h3>'],
  ['<p class="tl-meta"><span>1 January 2027</span><i aria-hidden="true"></i><span>Friday</span><i aria-hidden="true"></i><span>10:30 AM</span></p>', '<p class="tl-meta"><span>शुक्रवार दि. १जानेवारी २०२७</span><i aria-hidden="true"></i><span>सकाळी १०.३० वा.</span></p>'],
  ['<p class="tl-venue">Silver Star Celebration Hall<br>Shegaon-Rahatgaon Road, Amravati</p>', '<p class="tl-venue">सिल्वर स्टार सेलीब्रेशन हॉल<br>शेगाव-रहाटगांव रोड, अमरावती</p>'],
  ['<svg aria-hidden="true"><use href="#i-pin"/></svg>Directions</a>', '<svg aria-hidden="true"><use href="#i-pin"/></svg>मार्ग पहा</a>'],

  // 5.16 saptapadi
  ['<p class="eyebrow" data-reveal="fade">Seven Steps</p>', '<p class="eyebrow" data-reveal="fade">सात पावले</p>'],
  ['<h2 class="sapta-title" id="spTitle" data-reveal="scale">Saptapadi</h2>', '<h2 class="sapta-title" id="spTitle" data-reveal="scale">सप्तपदी</h2>'],
  ['aria-label="Seven pairs of gold footprints along a curve, numbered 1 to 7, ending at a kalash with a lit diya"', 'aria-label="सात सोनेरी पावलांच्या जोड्या, १ ते ७ क्रमांक, शेवटी कलश व दिवा"'],

  // 5.8 album
  ['<p class="eyebrow" data-reveal="fade">Our Moments</p>', '<p class="eyebrow" data-reveal="fade">आठवणी</p>'],
  ['<span>Photo Album</span></span></h2>', '<span>छायाचित्रे</span></span></h2>'],
  ['<p class="sub" data-reveal="up" style="--d:.3s">Tap a photo to view</p>', '<p class="sub" data-reveal="up" style="--d:.3s">मोठे पाहण्यासाठी फोटोवर टॅप करा</p>'],
  ['aria-label="Photographs"', 'aria-label="छायाचित्रे"'],
  // designer's credit (agent-written Marathi; the brand name and phone number stay as written)
  ['aria-label="Website credit"', 'aria-label="वेबसाइट निर्मिती"'],
  ['<p class="cr-by">Website crafted by <b>Rvic Edits</b></p>', '<p class="cr-by">वेबसाइट निर्मिती : <b>Rvic Edits</b></p>'],
  ['<p class="cr-txt">Planning a celebration of your own? We design elegant, animated invitation websites just like this one. Call or WhatsApp us to get yours.</p>', '<p class="cr-txt">तुमच्या खास कार्यक्रमासाठी असेच सुंदर, ॲनिमेटेड निमंत्रण संकेतस्थळ हवे आहे? आम्हाला कॉल करा किंवा व्हॉट्सॲप करा.</p>'],
  ['</svg>Call +91 81490 37725</a>', '</svg>कॉल करा +91 81490 37725</a>'],
  ['</svg>Message Rvic Edits on WhatsApp</a>', '</svg>Rvic Edits ला WhatsApp वर संदेश पाठवा</a>'],
  ['data-label-on="Mute music" data-label-off="Play music" aria-label="Play music"', 'data-label-on="संगीत बंद करा" data-label-off="संगीत सुरू करा" aria-label="संगीत सुरू करा"'],
  // album tiles (aria-labels and alt text) are written by galleryHtml() below

  // 5.17 families
  ['<p class="eyebrow" data-reveal="fade">Families</p>', '<p class="eyebrow" data-reveal="fade">कुटुंबीय</p>'],
  ['<span>With Blessings From</span></span></h2>', '<span>शुभाशीर्वाद</span></span></h2>'],
  ["<h3>Bride's Family</h3><p>Mrs. Archana &amp; Mr. Subhash Gulhane</p>", '<h3>वधूचे आई-वडील</h3><p>सौ. अर्चना व श्री. सुभाषराव गुल्हाने</p>'],
  ["<h3>Groom's Family</h3><p>Mrs. Priya &amp; Dr. Sanjay Tirathkar</p>", '<h3>वराचे आई-वडील</h3><p>सौ. प्रिया व प्रा.डॉ.श्री. संजयराव तिरथकर</p>'],

  // 5.9 footer
  ['alt="Illustration of Vrishali and Vedant holding hands"', 'alt="हात धरलेले वृषाली व वेदांत यांचे चित्र"'],
  ['<p class="f-bo" data-reveal="fade">Blessings Only</p>', '<p class="f-bo" data-reveal="fade">आहेर पध्दत पुर्णतः बंद....आपली उपस्थिती व आशिर्वादच अमुल्य....</p>'],
  ['<span>Vrishali <span class="amp">&amp;</span> Vedant</span>', `<span>वृषाली <span class="amp">${S}</span> वेदांत</span>`],
  ['<p class="f-date" data-reveal="up">Friday · 1 January 2027 · 10:30 AM</p>', '<p class="f-date" data-reveal="up">शुक्रवार दि. ०१ जानेवारी २०२७ रोजी · सकाळी १० वा. ३० मि.</p>'],
  ['<p class="f-venue" data-reveal="up" style="--d:.1s">Silver Star Celebration Hall<br>Shegaon-Rahatgaon Road, Amravati</p>', '<p class="f-venue" data-reveal="up" style="--d:.1s">सिल्वर स्टार सेलीब्रेशन हॉल<br>शेगाव-रहाटगांव रोड, अमरावती</p>'],
  ['<p class="f-reg" data-reveal="up" style="--d:.2s">With Regards: Sau. Archana &amp; Mr. Subhash Gulhane, Surali, Tal. Warud, Dist. Amravati</p>', '<p class="f-reg" data-reveal="up" style="--d:.2s">सस्नेह निमंत्रण<br>सौ. अर्चना व श्री. सुभाषराव गुल्हाने<br>रा. सुरळी, जि. अमरावती, ह.मु. पुणे</p>'],
  ['https://wa.me/917709806289?text=Hi%2C%20I%20will%20attend%20the%20wedding%20of%20Vrishali%20and%20Vedant.', 'https://wa.me/917709806289?text=' + encodeURIComponent('नमस्कार, मी वृषाली व वेदांत यांच्या शुभविवाहाला उपस्थित राहीन.')],
  ['<svg aria-hidden="true"><use href="#i-chat"/></svg>RSVP on WhatsApp</a>', '<svg aria-hidden="true"><use href="#i-chat"/></svg>व्हॉट्सॲपवर कळवा</a>'],
  ['<svg aria-hidden="true"><use href="#i-lantern"/></svg>Release a Wish Lantern</button>', '<svg aria-hidden="true"><use href="#i-lantern"/></svg>शुभेच्छा आकाशकंदील सोडा</button>'],
  ['<p class="f-rsvp" data-reveal="fade">RSVP: 7709806289 (Mr. Subhash Gulhane)</p>', '<p class="f-rsvp" data-reveal="fade">संपर्क: 7709806289 (श्री. सुभाषराव गुल्हाने)</p>'],
  ['<p class="f-close" data-reveal="scale">Vrishali with Vedant</p>', `<p class="f-close" data-reveal="scale">वृषाली${S}वेदांत</p>`],

  // lightbox + calendar
  ['aria-label="Photo viewer"', 'aria-label="फोटो दर्शक"'],
  ['aria-label="Close photo viewer"', 'aria-label="फोटो दर्शक बंद करा"'],
  ['aria-label="Previous photo"', 'aria-label="मागील फोटो"'],
  ['aria-label="Next photo"', 'aria-label="पुढील फोटो"'],
  ["'SUMMARY:' + icsEscape('Wedding · Vrishali & Vedant')", "'SUMMARY:' + icsEscape('शुभविवाह · वृषाली व वेदांत')"],
  ["'LOCATION:' + icsEscape('Silver Star Celebration Hall, Shegaon-Rahatgaon Road, Amravati')", "'LOCATION:' + icsEscape('सिल्वर स्टार सेलीब्रेशन हॉल, शेगाव-रहाटगांव रोड, अमरावती (Silver Star Celebration Hall, Shegaon-Rahatgaon Road, Amravati)')"],
  ["const desc = 'Blessings Only'", "const desc = 'आहेर पध्दत पुर्णतः बंद....आपली उपस्थिती व आशिर्वादच अमुल्य....'"],
];

function applyAll(html, pairs) {
  const misses = [];
  for (const [from, to, mode] of pairs) {
    const n = html.split(from).length - 1;
    if (n === 0) { misses.push(from.slice(0, 110)); continue; }
    html = mode === "all" ? html.split(from).join(to) : html.replace(from, () => to);
  }
  if (misses.length) {
    console.error("MISSING " + misses.length + " Marathi replacement(s):\n  " + misses.join("\n  "));
    process.exit(1);
  }
  return html;
}

/* ---------- album tiles, from src/gallery.json (order is chosen so look-alike photos never touch) ----------
   Tiles use a small 2:3 thumbnail (assets/photos/ID t.webp); the viewer loads the large file (data-full). */
const GALLERY = JSON.parse(readFileSync(new URL("./src/gallery.json", import.meta.url), "utf8"));
const GALLERY_MARK = "<!--GALLERY-->";
if (T.split(GALLERY_MARK).length !== 2) { console.error("template needs exactly one " + GALLERY_MARK); process.exit(1); }
const dev = (n) => String(n).replace(/\d/g, (d) => "०१२३४५६७८९"[d]);
const attr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
/* Two rows. Row "a" slides right-to-left, row "b" left-to-right. Each row's list is written twice (the second copy is
   hidden from screen readers and the tab key) so the CSS loop has no seam. data-i = position in the viewer's playlist. */
const galleryHtml = (lang) => {
  const tile = (p, i, j, dup) => {
    const label = lang === "mr" ? `फोटो ${dev(i + 1)} (${dev(GALLERY.length)} पैकी) उघडा` : `Open photo ${i + 1} of ${GALLERY.length}`;
    const alt = dup ? "" : lang === "mr" ? p.mr : p.en;
    const shape = j % 2 ? " pill" : "";   // arch, pill, arch, pill ...
    return `<li><button class="g-btn${shape}" type="button" data-i="${i}" data-full="../assets/photos/${p.id}.webp"${dup ? ' tabindex="-1"' : ""} aria-label="${attr(label)}"><img src="../assets/photos/${p.id}t.webp" width="560" height="840" loading="lazy" decoding="async" alt="${attr(alt)}"></button></li>`;
  };
  return ["a", "b"].map((row) => {
    const items = GALLERY.map((p, i) => [p, i]).filter(([p]) => p.row === row);
    const list = (dup) => `<ul class="reel-grp${dup ? " dup" : ""}"${dup ? ' aria-hidden="true"' : ""}>${items.map(([p, i], j) => tile(p, i, j, dup)).join("")}</ul>`;
    return `    <div class="reel-view"><div class="reel-row ${row}">${list(false)}${list(true)}</div></div>`;
  }).join("\n");
};

const en = fixPaths(T).replace(GALLERY_MARK, () => galleryHtml("en"));
const mr = fixPaths(applyAll(T, MR)).replace(GALLERY_MARK, () => galleryHtml("mr"));

// The English page must still contain every English line exactly as typed.
for (const must of ["Vrishali", "Vedant", "(D/o. Mrs. Archana &amp; Mr. Subhash Gulhane)", "(S/o Mrs. Priya &amp; Dr. Sanjay Tirathkar)", "Silver Star Celebration Hall", "Shegaon-Rahatgaon Road, Amravati", "10:30 AM", "1 January 2027", "With Regards: Sau. Archana &amp; Mr. Subhash Gulhane, Surali, Tal. Warud, Dist. Amravati", "917709806289"]) {
  if (!en.includes(must)) { console.error("English check failed:", must); process.exit(1); }
}

/* ---------- link previews, canonical URLs, search engines ----------
   og:url/og:image must be absolute for WhatsApp/Facebook. noindex keeps the invite (names, phone
   number) out of Google; link-preview bots still read the tags. robots.txt is deliberately not used
   to block crawling, because some preview bots obey it and would then show no preview. */
const ALT = `<link rel="alternate" hreflang="en" href="${SITE}/en/">
<link rel="alternate" hreflang="mr" href="${SITE}/ma/">
<link rel="alternate" hreflang="x-default" href="${SITE}/">`;
const OG_IMG = (f) => `<meta property="og:image" content="${SITE}/assets/${f}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">`;
const meta = (path, locale, img) => `<meta name="robots" content="noindex">
<link rel="canonical" href="${SITE}${path}">
${ALT}
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:locale" content="${locale}">
${OG_IMG(img)}
`;
// Inline favicon (burgundy disc, gold V&V) so browsers don't request a missing /favicon.ico.
const ICON = '<link rel="icon" href="data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="31" fill="#5C2330" stroke="#C9A96A" stroke-width="2"/><text x="32" y="42" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="26" fill="#E8D3A0">V&amp;V</text></svg>') + '">';
const THEME_TAG = '<meta name="theme-color" content="#5C2330">';
const THEME = ICON + "\n" + THEME_TAG;
const addMeta = (h, m) => {
  if (h.split(THEME_TAG).length !== 2) { console.error("theme-color meta must appear exactly once"); process.exit(1); }
  return h.replace(THEME_TAG, () => m + THEME);
};

/* ---------- write dist/ ---------- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(new URL("./en/", OUT), { recursive: true });
mkdirSync(new URL("./ma/", OUT), { recursive: true });
writeFileSync(new URL("./en/index.html", OUT), addMeta(en, meta("/en/", "en_IN", "og-en.jpg")));
writeFileSync(new URL("./ma/index.html", OUT), addMeta(mr, meta("/ma/", "mr_IN", "og-mr.jpg")));

// Site files: only what the pages use (web images, previews, photos). Masters/raw/ref stay out.
mkdirSync(new URL("./assets/flow/", OUT), { recursive: true });
for (const f of readdirSync(new URL("./assets/flow/", import.meta.url))) {
  if (f.endsWith(".webp")) cpSync(new URL("./assets/flow/" + f, import.meta.url), new URL("./assets/flow/" + f, OUT));
}
mkdirSync(new URL("./assets/audio/", OUT), { recursive: true });
for (const f of ["instrumental.mp3", "verse.mp3"]) cpSync(new URL("./assets/audio/" + f, import.meta.url), new URL("./assets/audio/" + f, OUT));
mkdirSync(new URL("./assets/photos/", OUT), { recursive: true });
for (const p of GALLERY) for (const f of [`${p.id}.webp`, `${p.id}t.webp`]) cpSync(new URL("./assets/photos/" + f, import.meta.url), new URL("./assets/photos/" + f, OUT));
for (const f of ["og-en.jpg", "og-mr.jpg"]) cpSync(new URL("./assets/" + f, import.meta.url), new URL("./assets/" + f, OUT));
for (const n of [1, 2, 3, 4]) cpSync(new URL(`./photo${n}.jpg`, import.meta.url), new URL(`./photo${n}.jpg`, OUT));

const ROOT_TITLE = "Vrishali &amp; Vedant · Wedding Invitation · वृषाली 卐 वेदांत";
const ROOT_DESC = "Friday, 1 January 2027 · 10:30 AM · Silver Star Celebration Hall, Shegaon-Rahatgaon Road, Amravati";
const PLAIN_CSS = "body{margin:0;min-height:100vh;display:grid;place-items:center;text-align:center;background:#5C2330;color:#F6EBCB;font-family:Georgia,serif}a{display:inline-block;color:#E8D3A0;font-size:20px;margin:0 8px;padding:12px 16px;min-height:44px;box-sizing:border-box}p{font-size:18px}";

// Root page: remembers the last language chosen with the toggle, else browser language, else English.
// Hosted: absolute /en/ and /ma/. Opened from disk (file://): relative en/index.html.
writeFileSync(new URL("./index.html", OUT), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${ROOT_TITLE}</title>
<meta name="description" content="${ROOT_DESC}">
<meta property="og:title" content="${ROOT_TITLE}">
<meta property="og:description" content="${ROOT_DESC}">
${meta("/", "en_IN", "og-en.jpg")}${THEME}
<script>
  (function () {
    var l = null;
    try { l = localStorage.getItem('vv-lang'); } catch (e) {}
    if (!l) l = /^mr\\b/i.test(navigator.language || '') ? 'mr' : 'en';
    var d = l === 'mr' ? 'ma' : 'en';
    location.replace(location.protocol === 'file:' ? d + '/index.html' : '/' + d + '/');
  })();
</script>
<style>${PLAIN_CSS}</style>
</head>
<body><p><a href="/en/">English</a> <a href="/ma/" lang="mr">मराठी</a></p></body>
</html>
`);

// 404 page (also stops Pages from serving the root page for every unknown path).
writeFileSync(new URL("./404.html", OUT), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found · Vrishali &amp; Vedant</title>
<meta name="robots" content="noindex">
${THEME}
<style>${PLAIN_CSS}</style>
</head>
<body><div><p>This page does not exist. · हे पान उपलब्ध नाही.</p><p><a href="/en/">Open the invitation</a> <a href="/ma/" lang="mr">निमंत्रण उघडा</a></p></div></body>
</html>
`);

// Cloudflare Pages headers. Pages already sends nosniff and a referrer policy.
// No custom caching: Pages' defaults (ETag revalidation, CDN cache until next deploy) are what Cloudflare recommends.
writeFileSync(new URL("./_headers", OUT), `/*
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  X-Robots-Tag: noindex
`);

console.log("built dist/ for " + SITE + "  (en " + en.length + " chars, ma " + mr.length + " chars)");
