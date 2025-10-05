const { Router } = require('express');
const db = require('../db/db');
const { requireAdmin } = require('../middleware/admin');

const r = Router();

// --- Seed 100+ baby clothing items -----------------------------------------
r.post('/admin/seed/baby', requireAdmin, (req, res) => {
  const count = Math.min(Number(req.query.count) || 100, 500);

  const types = [
    'Onesie','Bodysuit','Sleepsuit','Romper','Coverall','Pyjamas','Sleeping Bag',
    'T-shirt','Long Sleeve Tee','Sweatshirt','Hoodie','Cardigan','Vest',
    'Pants','Leggings','Joggers','Shorts','Skirt','Tights','Dungarees',
    'Dress','Outfit Set','Onesie Set','Cardigan Set',
    'Jacket','Fleece Jacket','Puffer Jacket','Rain Suit','Snowsuit','Gilet',
    'Hat','Beanie','Cap','Balaclava','Scarf','Mittens','Gloves','Socks','Booties',
    'Bib','Swaddle','Blanket','Thermal Set','Bamboo Bodysuit','Organic Cotton Bodysuit'
  ];
  const sizes = ['NB','0-3m','3-6m','6-9m','9-12m','12-18m','18-24m','2T','3T'];
  const colors = ['cream','white','grey','blue','navy','green','olive','pink','peach','yellow','brown','black'];
  const seasons = ['All-season','Spring','Summer','Autumn','Winter'];
  const brands = ['H&M','Zara','Next',"Carter's",'Gap','Lindex','Name It','M&S','Uniqlo','Petit Bateau','Polarn O. Pyret'];
  const materials = ['organic cotton','cotton','bamboo blend','merino blend','fleece','waterproof shell'];
  const conditions = ['New with tags','Like new','Excellent used condition','Good used condition','Well-loved'];
  const cities = ['Tallinn','Tartu','Pärnu','Narva'];

  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }
  function priceFor(type){
    const t = type.toLowerCase();
    let min=3,max=20;
    if (/(jacket|snowsuit|rain|puffer)/.test(t)) { min=18; max=60; }
    else if (/(sleep|blanket|bag)/.test(t))     { min=10; max=35; }
    else if (/(set)/.test(t))                   { min=12; max=40; }
    return Math.round((min + Math.random()*(max-min)) * 100); // cents
  }

  const items = [];
  for (let i=0; i<count; i++){
    const type = pick(types);
    const size = pick(sizes);
    const color = pick(colors);
    const brand = pick(brands);
    const material = pick(materials);
    const season = pick(seasons);
    const condition = pick(conditions);
    const city = pick(cities);

    const title = `${brand} ${type} - ${size} - ${color}`;
    const description = `${condition} ${type.toLowerCase()} in ${color}. Size ${size}. ${season}. Soft ${material}. Freshly washed and from smoke-free home.`;
    const price_cents = priceFor(type);
    const image_url = `https://picsum.photos/seed/baby-${i+1}/600/400`;

    items.push({ title, description, price_cents, image_url, city });
  }

  const stmt = db.prepare(`INSERT INTO listings (title, description, price_cents, image_url, city)
                           VALUES (?, ?, ?, ?, ?)`);
  const tx = db.transaction((arr) => {
    for (const x of arr) stmt.run(x.title, x.description, x.price_cents, x.image_url, x.city);
  });
  tx(items);

  res.json({ inserted: items.length });
});

module.exports = r;
