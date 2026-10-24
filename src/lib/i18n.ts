export type Lang = 'th' | 'en';
export const LANGS: Lang[] = ['th', 'en'];
export const isLang = (x: string): x is Lang => x === 'th' || x === 'en';
/** public URL for a path in a language (Thai has no prefix) */
export const href = (lang: Lang, path = '/') => (lang === 'en' ? '/en' + (path === '/' ? '' : path) : path) || '/';
export const SITE = (process.env.APP_URL || 'https://boattripthailand.com').replace(/\/$/, '');
export const abs = (lang: Lang, path = '/') => SITE + href(lang, path);
export const alternates = (pathTh: string | null, pathEn: string | null, lang: Lang) => ({
  canonical: lang === 'en' ? (pathEn ? abs('en', pathEn) : undefined) : (pathTh ? abs('th', pathTh) : undefined),
  languages: { ...(pathTh ? { th: abs('th', pathTh), 'x-default': abs('th', pathTh) } : {}), ...(pathEn ? { en: abs('en', pathEn) } : {}) },
});

export const TYPE_LABEL: Record<string, { th: string; en: string }> = {
  yacht: { th: 'เรือยอชต์', en: 'Motor Yacht' }, sail: { th: 'เรือใบคาตามารัน', en: 'Sailing Catamaran' }, power: { th: 'พาวเวอร์คาตามารัน', en: 'Power Catamaran' },
  speed: { th: 'สปีดโบ๊ท', en: 'Speedboat' }, longtail: { th: 'เรือหางยาว', en: 'Long-tail Boat' },
};

const th = {
  nav: { fleet: 'เช่าเรือ', destinations: 'จุดหมาย', blog: 'บทความ', about: 'เกี่ยวกับเรา', contact: 'ขอใบเสนอราคา' },
  heroTitle: 'เช่าเรือยอชต์ส่วนตัวในภูเก็ต', heroSub: 'เรือส่วนตัวกว่า 70 ลำ ทั้งเรือยอชต์ คาตามารัน และสปีดโบ๊ท ไปพีพี อ่าวพังงา ราชา และเกาะไข่ ทีมงานคนไทยตอบไวทุกวัน',
  guests: 'จำนวนคน', anyType: 'ทุกประเภท', search: 'ค้นหาเรือ', from: 'เริ่มต้น', perBoat: 'ต่อลำ', upTo: 'สูงสุด', people: 'คน', viewBoat: 'ดูรายละเอียด',
  featured: 'เรือแนะนำ', allBoats: 'ดูเรือทั้งหมด', destinations: 'จุดหมายยอดนิยม', latest: 'คู่มือ & ไอเดียทริปทะเล', readMore: 'อ่านต่อ', allPosts: 'ดูบทความทั้งหมด',
  how: 'จองเรือง่าย ๆ 4 ขั้นตอน', steps: [['บอกความต้องการ', 'วันที่ จำนวนคน และสไตล์ทริป'], ['รับตัวเลือกเรือ', 'ทีมงานเช็กคิวและเสนอเรือที่เหมาะ'], ['คุยกับเซลล์และยืนยัน', 'เซลล์ตัวจริงดูแลทาง WhatsApp / LINE'], ['ออกทะเล', 'ลูกเรือดูแลตลอดทริป']],
  formTitle: 'ขอใบเสนอราคา / เช็กคิวเรือ', formSub: 'ไม่มีค่าใช้จ่าย ทีมงานติดต่อกลับภายใน 15 นาที (09:00–21:00)',
  f: { item: 'เรือ / ทริปที่สนใจ', chooseItem: '— ยังไม่เลือก ให้ทีมงานแนะนำ —', program: 'โปรแกรม', anyProgram: '— ยังไม่เลือก —', name: 'ชื่อ', phone: 'เบอร์โทร / WhatsApp / LINE ID', email: 'อีเมล (ถ้ามี)', date: 'วันที่ต้องการ', adults: 'ผู้ใหญ่', children: 'เด็ก', message: 'รายละเอียดเพิ่มเติม', messagePh: 'เช่น ฉลองวันเกิด ต้องการรถรับส่ง มีเด็กเล็ก…', contactNote: 'ทีมขายจะติดต่อกลับทาง WhatsApp / LINE / โทรศัพท์ เพื่อเช็กคิวเรือและเสนอทริปตามคำขอนี้', marketing: 'รับข่าวสาร โปรโมชัน และคิวเรือว่างช่วงพิเศษ (ยกเลิกได้ทุกเมื่อ)', submit: 'ส่งคำขอ', sending: 'กำลังส่ง…', required: 'กรุณากรอกชื่อและเบอร์ติดต่อ', error: 'ส่งไม่สำเร็จ กรุณาลองอีกครั้ง หรือทักเราทาง WhatsApp / LINE', thanks: 'ได้รับคำขอแล้ว', thanksSub: 'ทีมงานจะติดต่อกลับเร็วที่สุด · เลขอ้างอิง', chatNow: 'หรือทักแชทเลยตอนนี้' },
  boat: { specs: 'ข้อมูลเรือ', prices: 'โปรแกรม & ราคา', priceFor: 'ราคาสำหรับวันที่', changeDate: 'เปลี่ยนวันที่', includes: 'รวมในราคา', notIncluded: 'ไม่รวมในราคา', complimentary: 'ของแถม', times: 'รอบเวลา', notes: 'หมายเหตุ', marina: 'ท่าเรือ', size: 'ขนาด', capacity: 'รับได้', request: 'เช็กคิว & ขอใบเสนอราคา', priceNote: 'ราคาต่อลำ รวมกัปตัน ลูกเรือ น้ำมัน และประกัน ตามรายการด้านล่าง', similar: 'เรือที่ใกล้เคียง' },
  fleet: { title: 'เช่าเรือยอชต์ภูเก็ต · เรือทั้งหมด', sub: 'เลือกเรือส่วนตัวตามจำนวนคนและสไตล์ทริป ราคาแสดงตามฤดูกาลของวันนี้', count: 'ลำ', none: 'ไม่พบเรือที่ตรงเงื่อนไข' },
  blog: { title: 'บทความ & คู่มือเช่าเรือ', sub: 'เคล็ดลับเช่าเรือยอชต์ภูเก็ต เส้นทางเกาะ และไอเดียทริปจากทีมงาน', all: 'ทั้งหมด', toc: 'สารบัญ', related: 'บทความที่เกี่ยวข้อง', cta: 'อยากให้ช่วยวางแผนทริปนี้?', ctaSub: 'บอกวันที่และจำนวนคน ทีมงานเช็กคิวเรือให้ฟรี', thOnly: 'บทความนี้มีเฉพาะภาษาอังกฤษ', prev: 'ก่อนหน้า', next: 'ถัดไป', min: 'นาที' },
  footer: { tagline: 'Sea by Soul · เช่าเรือส่วนตัวในภูเก็ต', privacy: 'นโยบายความเป็นส่วนตัว', license: 'ใบอนุญาตประกอบธุรกิจนำเที่ยว ททท. 34/03754' },
  cookie: { text: 'เราใช้คุกกี้เพื่อวัดผลและปรับปรุงเว็บไซต์ และเพื่อแสดงโฆษณาที่เกี่ยวข้อง', accept: 'ยอมรับทั้งหมด', necessary: 'เฉพาะที่จำเป็น' },
  faq: 'คำถามที่พบบ่อย', home: 'หน้าแรก',
};
const en: typeof th = {
  nav: { fleet: 'Yacht charter', destinations: 'Destinations', blog: 'Blog', about: 'About', contact: 'Get a quote' },
  heroTitle: 'Private yacht charter in Phuket', heroSub: '70+ private boats — motor yachts, catamarans and speedboats — to Phi Phi, Phang Nga Bay, Racha and Khai islands. Fast, friendly replies every day.',
  guests: 'Guests', anyType: 'Any type', search: 'Find a boat', from: 'From', perBoat: 'per boat', upTo: 'up to', people: 'guests', viewBoat: 'View details',
  featured: 'Featured boats', allBoats: 'See all boats', destinations: 'Popular destinations', latest: 'Guides & trip ideas', readMore: 'Read more', allPosts: 'All articles',
  how: 'Book in 4 easy steps', steps: [['Tell us your plan', 'Date, group size and trip style'], ['Get boat options', 'We check availability and shortlist boats'], ['Chat & confirm', 'A real person looks after you on WhatsApp / LINE'], ['Set sail', 'Your crew takes care of everything']],
  formTitle: 'Get a quote / check availability', formSub: 'Free, no obligation. We usually reply within 15 minutes (09:00–21:00).',
  f: { item: 'Boat / trip', chooseItem: '— Not sure yet, please recommend —', program: 'Program', anyProgram: '— Not sure yet —', name: 'Name', phone: 'Phone / WhatsApp / LINE ID', email: 'Email (optional)', date: 'Date', adults: 'Adults', children: 'Children', message: 'Anything else?', messagePh: 'e.g. birthday, hotel pick-up, small kids…', contactNote: 'Our sales team will contact you on WhatsApp / LINE / phone to check availability and suggest options for this request.', marketing: 'Send me news, offers and last-minute availability (unsubscribe anytime)', submit: 'Send request', sending: 'Sending…', required: 'Please enter your name and a contact number', error: 'Something went wrong. Please try again or message us on WhatsApp / LINE.', thanks: 'Request received', thanksSub: 'We will be in touch shortly · Reference', chatNow: 'Or chat with us now' },
  boat: { specs: 'Boat details', prices: 'Programs & prices', priceFor: 'Prices for', changeDate: 'Change date', includes: 'Included', notIncluded: 'Not included', complimentary: 'Complimentary', times: 'Time slots', notes: 'Notes', marina: 'Marina', size: 'Size', capacity: 'Capacity', request: 'Check availability & get a quote', priceNote: 'Price per boat including captain, crew, fuel and insurance as listed below', similar: 'Similar boats' },
  fleet: { title: 'Phuket yacht charter · all boats', sub: 'Choose a private boat by group size and trip style. Prices shown for today’s season.', count: 'boats', none: 'No boats match these filters' },
  blog: { title: 'Phuket yacht charter guides', sub: 'Tips, island routes and trip ideas from our team', all: 'All', toc: 'Contents', related: 'Related articles', cta: 'Want help planning this trip?', ctaSub: 'Tell us your date and group size — we check availability for free', thOnly: 'This article is available in Thai only', prev: 'Previous', next: 'Next', min: 'min read' },
  footer: { tagline: 'Sea by Soul · Private boat charters in Phuket', privacy: 'Privacy policy', license: 'Tourism Authority of Thailand licence 34/03754' },
  cookie: { text: 'We use cookies to measure and improve the site and to show relevant ads.', accept: 'Accept all', necessary: 'Necessary only' },
  faq: 'FAQ', home: 'Home',
};
export const dict = (lang: Lang) => (lang === 'en' ? en : th);
export type Dict = typeof th;
