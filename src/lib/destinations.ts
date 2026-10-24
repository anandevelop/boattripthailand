/**
 * Destination landing pages (SEO). Content is general guidance — check national-park notices
 * for current closures and fees before publishing changes.
 */
export type Destination = {
  slug: string;
  match: RegExp;
  hero: string;
  name: { th: string; en: string };
  seoTitle: { th: string; en: string };
  seoDesc: { th: string; en: string };
  intro: { th: string; en: string };
  facts: { th: [string, string][]; en: [string, string][] };
  highlights: { th: [string, string][]; en: [string, string][] };
  tips: { th: string[]; en: string[] };
  faq: { th: [string, string][]; en: [string, string][] };
};

export const DESTINATIONS: Destination[] = [
  {
    slug: 'phi-phi',
    match: /phi\s?phi|maya|pileh|bamboo/i,
    hero: '/boats/the-origin-90-ft-hero.webp',
    name: { th: 'เกาะพีพี', en: 'Phi Phi Islands' },
    seoTitle: { th: 'เช่าเรือไปเกาะพีพี เรือส่วนตัวจากภูเก็ต | Boat Trip Thailand', en: 'Phi Phi Private Boat Charter from Phuket | Boat Trip Thailand' },
    seoDesc: { th: 'เช่าเรือยอชต์ คาตามารัน หรือสปีดโบ๊ทส่วนตัวไปเกาะพีพีจากภูเก็ต แวะอ่าวปิเละ อ่าวมาหยา เกาะไผ่ ออกเรือเวลาที่คุณเลือก ดูเรือและราคาตามฤดูกาล', en: 'Charter a private yacht, catamaran or speedboat from Phuket to Phi Phi. Pileh Lagoon, Maya Bay, Bamboo Island on your own schedule. See boats and seasonal prices.' },
    intro: { th: 'หมู่เกาะพีพีคือจุดหมายยอดนิยมที่สุดของการเช่าเรือจากภูเก็ต น้ำทะเลใส หน้าผาหินปูนสูงชัน และอ่าวที่เห็นในภาพยนตร์ การเช่าเรือส่วนตัวทำให้คุณเลือกเวลาออกเรือได้เอง หลีกเลี่ยงช่วงที่นักท่องเที่ยวหนาแน่น และแวะเฉพาะจุดที่อยากไป', en: 'The Phi Phi Islands are the most popular charter destination from Phuket: clear water, towering limestone cliffs and bays you have seen in films. A private boat lets you choose your departure time, avoid the busiest hours and stop only where you want.' },
    facts: { th: [['ระยะทางจากภูเก็ต', 'ประมาณ 45–50 กม.'], ['เวลาเดินทาง', 'สปีดโบ๊ทราว 1 ชม. · เรือยอชต์/คาตามารัน 1.5–2.5 ชม.'], ['เหมาะกับ', 'ทริปเต็มวัน'], ['ช่วงทะเลดีที่สุด', 'พฤศจิกายน – เมษายน']], en: [['Distance from Phuket', 'about 45–50 km'], ['Travel time', 'speedboat ~1 hr · yacht/catamaran 1.5–2.5 hrs'], ['Best for', 'full-day trips'], ['Calmest seas', 'November – April']] },
    highlights: { th: [['อ่าวปิเละ', 'ลากูนน้ำสีเขียวมรกตล้อมด้วยหน้าผา เหมาะกับการว่ายน้ำและพายคายัค'], ['อ่าวมาหยา', 'อ่าวที่มีชื่อเสียงที่สุด อุทยานจำกัดจำนวนคนและไม่อนุญาตให้ลงเล่นน้ำ และปิดฟื้นฟูธรรมชาติเป็นช่วงในแต่ละปี'], ['ถ้ำไวกิ้ง', 'ชมจากเรือ ถ้ำที่เก็บรังนกนางแอ่น'], ['เกาะไผ่', 'หาดทรายขาวน้ำตื้น เหมาะดำน้ำตื้นและพักผ่อน']], en: [['Pileh Lagoon', 'an emerald lagoon enclosed by cliffs — great for swimming and kayaking'], ['Maya Bay', 'the most famous bay; the national park limits visitor numbers, does not allow swimming and closes it for recovery for part of each year'], ['Viking Cave', 'viewed from the boat — home to swiftlet nests'], ['Bamboo Island', 'white sand and shallow water, ideal for snorkelling and relaxing']] },
    tips: { th: ['ออกเรือเช้า (ก่อน 9 โมง) จะถึงอ่าวสวย ๆ ก่อนเรือทัวร์ใหญ่', 'ค่าธรรมเนียมอุทยานแห่งชาติจ่ายตามจริงต่อคน ทีมงานแจ้งยอดก่อนยืนยัน', 'ช่วงมรสุม (พ.ค.–ต.ค.) คลื่นอาจแรง ทีมงานจะแนะนำเส้นทางสำรองที่ปลอดภัยกว่า', 'ตรวจสอบประกาศเปิด–ปิดอ่าวมาหยาของอุทยานก่อนวันเดินทาง'], en: ['Leave early (before 9am) to reach the best bays before the big tour boats', 'National park fees are paid per person at cost — we confirm the total before you book', 'In the monsoon (May–Oct) seas can be rough; we will suggest a safer alternative route if needed', 'Check the national park’s Maya Bay opening notice before your trip date'] },
    faq: { th: [['เช่าเรือไปพีพีใช้เวลาทั้งวันไหม', 'ส่วนใหญ่เป็นทริปเต็มวัน 7–8 ชั่วโมง ถ้าใช้สปีดโบ๊ทเร็วจะมีเวลาแวะหลายจุดมากขึ้น'], ['ลงเล่นน้ำที่อ่าวมาหยาได้ไหม', 'ไม่ได้ อุทยานอนุญาตให้ชมจากชายหาดและทางเดินเท่านั้น แต่ว่ายน้ำได้ที่อ่าวปิเละและเกาะไผ่'], ['ไปพีพีช่วงหน้าฝนได้ไหม', 'ไปได้ในวันที่อากาศดี แต่ต้องดูสภาพคลื่นลมเป็นรายวัน ทีมงานจะแจ้งและเสนอเส้นทางอื่นถ้าไม่ปลอดภัย']], en: [['Is a Phi Phi charter a full day?', 'Usually yes — 7–8 hours. A fast speedboat gives you time for more stops.'], ['Can I swim at Maya Bay?', 'No. The national park only allows viewing from the beach and boardwalk, but you can swim at Pileh Lagoon and Bamboo Island.'], ['Can I go to Phi Phi in the rainy season?', 'Yes on good-weather days, but sea conditions are checked daily. We will suggest another route if it is not safe.']] },
  },
  {
    slug: 'phang-nga-bay',
    match: /phang\s?nga|james\s?bond|hong|panyee|panyi/i,
    hero: '/boats/siam-princess-70-ft-hero.webp',
    name: { th: 'อ่าวพังงา & เกาะเจมส์บอนด์', en: 'Phang Nga Bay & James Bond Island' },
    seoTitle: { th: 'เช่าเรือไปอ่าวพังงา เกาะเจมส์บอนด์ เรือส่วนตัว | Boat Trip Thailand', en: 'Phang Nga Bay & James Bond Island Private Boat | Boat Trip Thailand' },
    seoDesc: { th: 'เช่าเรือส่วนตัวจากภูเก็ตไปอ่าวพังงา ชมเกาะเขาพิงกัน (เกาะเจมส์บอนด์) พายเรือแคนูลอดถ้ำ เกาะห้อง เกาะปันหยี น้ำทะเลเรียบ เที่ยวได้เกือบทั้งปี', en: 'Private boat from Phuket to Phang Nga Bay: James Bond Island, sea-cave canoeing at Hong islands and Koh Panyee village. Calm, sheltered water most of the year.' },
    intro: { th: 'อ่าวพังงามีเกาะหินปูนรูปทรงแปลกตานับร้อยโผล่ขึ้นจากทะเลสีเขียว เป็นทะเลในที่ได้รับการกำบังจากคลื่นลม จึงเหมาะกับครอบครัวและคนที่กังวลเรื่องเมาเรือ และเป็นทางเลือกที่ดีในช่วงมรสุม', en: 'Phang Nga Bay is a sheltered sea of hundreds of dramatic limestone islands rising from green water. Its calm conditions make it ideal for families and anyone worried about seasickness — and a good choice in the monsoon season.' },
    facts: { th: [['ท่าเรือที่ใกล้ที่สุด', 'ฝั่งตะวันออกของภูเก็ต เช่น อ่าวปอ และรอยัลภูเก็ตมารีน่า'], ['เวลาเดินทาง', 'ประมาณ 45–90 นาที ขึ้นกับเรือ'], ['เหมาะกับ', 'ครึ่งวันถึงเต็มวัน'], ['ช่วงที่ไปได้', 'เกือบทั้งปี น้ำเรียบกว่าฝั่งทะเลเปิด']], en: [['Nearest marinas', 'Phuket’s east coast, e.g. Ao Po and Royal Phuket Marina'], ['Travel time', 'about 45–90 minutes depending on the boat'], ['Best for', 'half-day to full-day trips'], ['Season', 'most of the year — calmer than open-sea routes']] },
    highlights: { th: [['เกาะเขาพิงกัน (เกาะเจมส์บอนด์)', 'ชมเกาะตะปูที่โด่งดังจากภาพยนตร์ (ชมจากฝั่ง เข้าใกล้เกาะตะปูไม่ได้)'], ['เกาะห้อง', 'พายเรือแคนูลอดถ้ำเข้าไปในทะเลในกลางเกาะ'], ['เกาะปันหยี', 'หมู่บ้านชาวประมงมุสลิมที่สร้างบนเสาเหนือน้ำ แวะทานอาหารทะเล'], ['ถ้ำลอด', 'นั่งเรือหรือแคนูลอดใต้หินงอกหินย้อย']], en: [['Khao Phing Kan (James Bond Island)', 'see the famous Ko Tapu rock from the film (viewed from the shore; boats cannot approach Ko Tapu)'], ['Hong islands', 'canoe through sea caves into hidden lagoons'], ['Koh Panyee', 'a Muslim fishing village built on stilts — a classic lunch stop'], ['Tham Lod', 'pass beneath stalactites by boat or canoe']] },
    tips: { th: ['ช่วงน้ำขึ้น–น้ำลงมีผลกับการพายแคนูเข้าถ้ำ ทีมงานจะวางเวลาให้ตรงกับน้ำ', 'ค่าธรรมเนียมอุทยานและค่าแคนูจ่ายตามจริง แจ้งยอดก่อนยืนยัน', 'เรือคาตามารันและเรือยอชต์ขนาดใหญ่เหมาะกับทริปชิล ๆ ทานอาหารบนเรือ'], en: ['Tides affect cave canoeing; we time the itinerary around them', 'National park and canoe fees are paid at cost — confirmed before you book', 'Catamarans and larger yachts are perfect for a relaxed day with lunch on board'] },
    faq: { th: [['อ่าวพังงาเหมาะกับเด็กไหม', 'เหมาะมาก น้ำเรียบ ระยะทางไม่ไกล และมีกิจกรรมพายแคนูที่เด็กสนุก'], ['ไปเกาะเจมส์บอนด์ใช้เวลานานไหม', 'จากท่าเรือฝั่งตะวันออกประมาณ 1 ชั่วโมง ทริปครึ่งวันก็ไปได้ถ้าเลือกสปีดโบ๊ท'], ['หน้ามรสุมไปอ่าวพังงาได้ไหม', 'ส่วนใหญ่ไปได้ เพราะเป็นทะเลในที่คลื่นสงบกว่าฝั่งอันดามันเปิด']], en: [['Is Phang Nga Bay good for kids?', 'Very — calm water, short distances and canoeing that kids love.'], ['How long to James Bond Island?', 'About an hour from the east-coast marinas; a half day works with a speedboat.'], ['Can I go in the monsoon season?', 'Usually yes — the bay is sheltered and much calmer than the open Andaman Sea.']] },
  },
  {
    slug: 'racha-island',
    match: /racha|raya/i,
    hero: '/boats/leopard-40-ft-hero.webp',
    name: { th: 'เกาะราชา', en: 'Racha Islands' },
    seoTitle: { th: 'เช่าเรือไปเกาะราชา ดำน้ำน้ำใส เรือส่วนตัว | Boat Trip Thailand', en: 'Racha Island Private Boat Charter from Phuket | Boat Trip Thailand' },
    seoDesc: { th: 'เช่าเรือส่วนตัวไปเกาะราชาใหญ่และราชาน้อย น้ำทะเลใสที่สุดใกล้ภูเก็ต ดำน้ำตื้น หาดทรายขาว ใช้เวลาเดินทางไม่นาน เหมาะทริปครึ่งวันและเต็มวัน', en: 'Private boat to Racha Yai and Racha Noi — some of the clearest water near Phuket. Snorkelling, white beaches and a short ride, perfect for half or full-day trips.' },
    intro: { th: 'เกาะราชาอยู่ทางใต้ของภูเก็ต ขึ้นชื่อเรื่องน้ำทะเลใสและทรายขาวละเอียด เดินทางไม่ไกลจากท่าเรือฉลอง จึงเหมาะกับทริปที่อยากใช้เวลาว่ายน้ำและดำน้ำมากกว่านั่งเรือ', en: 'The Racha Islands lie south of Phuket and are known for crystal-clear water and fine white sand. They are a short ride from Chalong, so you spend more time swimming and snorkelling than travelling.' },
    facts: { th: [['ระยะทางจากภูเก็ต', 'ประมาณ 20 กม. ทางใต้'], ['เวลาเดินทาง', 'สปีดโบ๊ทราว 30–45 นาที'], ['เหมาะกับ', 'ดำน้ำตื้น ว่ายน้ำ พักผ่อน'], ['ช่วงทะเลดีที่สุด', 'พฤศจิกายน – เมษายน']], en: [['Distance from Phuket', 'about 20 km south'], ['Travel time', 'speedboat ~30–45 minutes'], ['Best for', 'snorkelling, swimming, relaxing'], ['Calmest seas', 'November – April']] },
    highlights: { th: [['อ่าวปะตก (ราชาใหญ่)', 'อ่าวรูปเกือกม้า ทรายขาว น้ำใส จุดยอดนิยม'], ['อ่าวสยาม', 'อ่าวเงียบสงบ ดำน้ำตื้นดูปะการังและปลา'], ['เกาะราชาน้อย', 'แนวหินใต้น้ำสวย นิยมดำน้ำลึก'], ['รวมกับเกาะเฮหรือแหลมพรหมเทพ', 'ต่อทริปขากลับชมพระอาทิตย์ตก']], en: [['Patok Bay (Racha Yai)', 'a horseshoe bay with white sand and clear water'], ['Siam Bay', 'a quieter bay for snorkelling over coral and fish'], ['Racha Noi', 'beautiful underwater rocks, popular with divers'], ['Combine with Coral Island or Promthep Cape', 'add a sunset stop on the way back']] },
    tips: { th: ['ช่วง High Season อ่าวปะตกคนเยอะช่วงสาย ออกเช้าหรือแวะอ่าวสยามก่อน', 'ช่วงมรสุมทะเลฝั่งใต้อาจมีคลื่น ทีมงานจะเช็กสภาพอากาศให้ก่อน', 'นำครีมกันแดดที่ไม่ทำร้ายปะการังไปด้วย'], en: ['In high season Patok Bay gets busy late morning — go early or start at Siam Bay', 'In the monsoon the southern sea can be choppy; we check conditions in advance', 'Bring reef-safe sunscreen'] },
    faq: { th: [['เกาะราชาเหมาะครึ่งวันไหม', 'เหมาะ ถ้าใช้สปีดโบ๊ท ครึ่งวันจะได้เวลาเล่นน้ำ 2–3 ชั่วโมง'], ['ราชาใหญ่กับราชาน้อยต่างกันอย่างไร', 'ราชาใหญ่มีหาดและที่พัก เหมาะว่ายน้ำ ราชาน้อยเงียบกว่าและเหมาะดำน้ำลึก'], ['มีอุปกรณ์ดำน้ำบนเรือไหม', 'เรือส่วนใหญ่มีหน้ากากและท่อหายใจให้ ดูรายการ “รวมในราคา” ของแต่ละลำ']], en: [['Is Racha good for a half day?', 'Yes — with a speedboat you get 2–3 hours in the water.'], ['Racha Yai vs Racha Noi?', 'Racha Yai has beaches and resorts, great for swimming; Racha Noi is quieter and better for diving.'], ['Is snorkel gear provided?', 'Most boats include masks and snorkels — check each boat’s “Included” list.']] },
  },
  {
    slug: 'khai-island',
    match: /khai|naka|rang\s?yai/i,
    hero: '/boats/coco-40-ft-hero.webp',
    name: { th: 'เกาะไข่ & เกาะใกล้ภูเก็ต', en: 'Khai Islands & islands near Phuket' },
    seoTitle: { th: 'เช่าเรือไปเกาะไข่ เกาะนาคาน้อย เกาะรังใหญ่ ทริปครึ่งวัน | Boat Trip Thailand', en: 'Khai Island Half-Day Private Boat from Phuket | Boat Trip Thailand' },
    seoDesc: { th: 'เช่าเรือส่วนตัวครึ่งวันไปเกาะไข่นอก ไข่นุ้ย เกาะนาคาน้อย เกาะรังใหญ่ ใกล้ภูเก็ต นั่งเรือไม่นาน ทรายขาวน้ำใส เหมาะครอบครัวและคนมีเวลาจำกัด', en: 'Half-day private boat to Khai Nok, Khai Nui, Naka Noi and Rang Yai — close to Phuket with white sand and clear water. Ideal for families and short trips.' },
    intro: { th: 'ถ้ามีเวลาไม่มากหรือมากับเด็กเล็ก หมู่เกาะใกล้ฝั่งตะวันออกของภูเก็ตคือคำตอบ นั่งเรือไม่นานก็ถึงหาดทรายขาว น้ำใส แวะได้หลายเกาะในทริปครึ่งวัน', en: 'Short on time or travelling with small kids? The islands off Phuket’s east coast are a short ride away, with white sand and clear water — several stops fit easily into a half day.' },
    facts: { th: [['เวลาเดินทาง', 'ประมาณ 20–40 นาที'], ['เหมาะกับ', 'ทริปครึ่งวัน 4–6 ชั่วโมง'], ['เกาะยอดนิยม', 'ไข่นอก ไข่นุ้ย นาคาน้อย รังใหญ่'], ['ช่วงที่ไปได้', 'เกือบทั้งปี ขึ้นกับคลื่นลม']], en: [['Travel time', 'about 20–40 minutes'], ['Best for', 'half-day trips of 4–6 hours'], ['Popular islands', 'Khai Nok, Khai Nui, Naka Noi, Rang Yai'], ['Season', 'most of the year, weather permitting']] },
    highlights: { th: [['เกาะไข่นอก', 'หาดทรายขาว น้ำตื้น เหมาะเล่นน้ำ'], ['เกาะไข่นุ้ย', 'ดำน้ำตื้นใกล้ชายหาด เห็นปลาเยอะ'], ['เกาะนาคาน้อย', 'เกาะเล็กเงียบสงบ บรรยากาศส่วนตัว'], ['เกาะรังใหญ่', 'หาดกว้าง ร่มรื่น เหมาะครอบครัว']], en: [['Khai Nok', 'white sand and shallow water, great for swimming'], ['Khai Nui', 'snorkelling right off the beach with plenty of fish'], ['Naka Noi', 'a small, quiet island with a private feel'], ['Rang Yai', 'a wide, shady beach — good for families']] },
    tips: { th: ['ทริปครึ่งวันมีรอบเช้าและบ่าย เลือกรอบบ่ายเพื่อกลับมาทันพระอาทิตย์ตก', 'งดให้อาหารปลา เพื่อรักษาระบบนิเวศ', 'บางเกาะมีค่าธรรมเนียมขึ้นเกาะ จ่ายตามจริง'], en: ['Half-day trips run morning and afternoon — the afternoon slot gets you back for sunset', 'Please don’t feed the fish — it harms the reef', 'Some islands charge a small landing fee, paid at cost'] },
    faq: { th: [['ทริปครึ่งวันไปได้กี่เกาะ', 'ส่วนใหญ่ 2–3 เกาะ เช่น ไข่นอก + ไข่นุ้ย หรือ นาคาน้อย + รังใหญ่'], ['เหมาะกับคนเมาเรือไหม', 'เหมาะกว่าทริปไกล เพราะนั่งเรือไม่นานและทะเลค่อนข้างสงบ'], ['ต้องเตรียมอะไรบ้าง', 'ชุดว่ายน้ำ ผ้าเช็ดตัว ครีมกันแดด และหมวก ส่วนน้ำดื่มและอุปกรณ์ดำน้ำส่วนใหญ่มีบนเรือ']], en: [['How many islands in a half day?', 'Usually 2–3, e.g. Khai Nok + Khai Nui or Naka Noi + Rang Yai.'], ['Good if I get seasick?', 'Better than long trips — short rides and generally calm water.'], ['What should I bring?', 'Swimwear, towel, sunscreen and a hat. Water and snorkel gear are usually on board.']] },
  },
];
export const destinationBySlug = (s: string) => DESTINATIONS.find(d => d.slug === s);
