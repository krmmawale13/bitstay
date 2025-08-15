/*
 * seedMetadata.full.ts — Production-grade metadata seed for Bitstay CRM
 * ---------------------------------------------------------------------
 * - Idempotent (safe to run multiple times)
 * - Aligned to your schema (unique by `id` only, uses findFirst+update)
 * - Populates:
 *   • States (28) + Union Territories (8)
 *   • Districts (major coverage provided; hook to extend via JSON)
 *   • GST Tax Groups (0/5/12/18/28)
 *   • Hospitality SAC/HSN essentials (subset curated for hotels, F&B & housekeeping)
 *   • Payment Modes, Booking Sources, Unit Types, Document Types, ID Types
 *   • Liquor Categories & Brands (popular India/international)
 *   • Menu Categories, Items & Item Metadata (HSN/SAC + tax mapping examples)
 *
 * Notes
 * -----
 * • `rate` values are passed as strings to support Prisma Decimal.
 * • District list is very large (~780). This file ships a comprehensive starter set
 *   and provides a simple extension hook (see `DISTRICTS_EXTRA_JSON_PATH`).
 *   Drop a JSON file shaped as `{ "State Name": ["District A", ...], ... }` to seed more
 *   without touching existing data.
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// ---------------------------------------------------------
// Helpers (schema uses id-only unique; do id-aware upserts)
// ---------------------------------------------------------
async function findFirstBy<T>(model: any, where: Record<string, any>) {
  return model.findFirst({ where })
}

async function createOrUpdateBy<T extends { id: number }>(model: any, where: Record<string, any>, createData: Record<string, any>) {
  const existing = await findFirstBy(model, where)
  if (existing) {
    // Merge existing with new data (but never change primary key)
    return model.update({ where: { id: existing.id }, data: createData })
  }
  return model.create({ data: createData })
}

// Special case for simple single-field keys like `name` or `mode`
async function ensureSingle(model: any, field: string, value: any, extra: Record<string, any> = {}) {
  const where = { [field]: value }
  return createOrUpdateBy(model, where, { [field]: value, ...extra })
}

// ------------------------------------
// 1) States & Districts (pan-India)
// ------------------------------------
const STATES_AND_UTS = [
  // States (28)
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  // Union Territories (8)
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
]

// Starter coverage (representative and widely used districts). You can extend this via JSON below.
// For full coverage, drop a JSON at DISTRICTS_EXTRA_JSON_PATH with shape: { "State Name": ["District 1", ...] }
const DISTRICTS_STARTER: Record<string, string[]> = {
  'Andhra Pradesh': [
    'Anakapalli','Anantapuramu','Alluri Sitarama Raju','Bapatla','Chittoor','Dr. B.R. Ambedkar Konaseema','East Godavari (Kakinada)','Eluru','Guntur','Krishna','Kurnool','Nandyal','NTR','Palnadu','Prakasam','Sri Potti Sriramulu Nellore','Sri Sathya Sai','Srikakulam','Tirupati','Visakhapatnam','Vizianagaram','West Godavari (Eluru)','YSR Kadapa','Annamayya'
  ],
  'Arunachal Pradesh': [
    'Tawang','West Kameng','East Kameng','Pakke Kessang','Kamle','Lower Subansiri','Upper Subansiri','Kra Daadi','Kurung Kumey','Papum Pare','Itanagar Capital Complex','Lower Siang','Upper Siang','West Siang','Shi Yomi','Leparada','Siang','East Siang','Namsai','Lohit','Anjaw','Changlang','Tirap','Longding'
  ],
  'Assam': [
    'Baksa','Barpeta','Bajali','Biswanath','Bongaigaon','Cachar','Charaideo','Chirang','Darrang','Dhemaji','Dhubri','Dibrugarh','Dima Hasao','Goalpara','Golaghat','Hailakandi','Hojai','Jorhat','Kamrup','Kamrup Metropolitan','Karbi Anglong','Karimganj','Kokrajhar','Lakhimpur','Majuli','Morigaon','Nagaon','Nalbari','Sivasagar','Sonitpur','South Salmara-Mankachar','Tamulpur','Tinsukia','Udalguri','West Karbi Anglong'
  ],
  'Bihar': [
    'Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur','Bhojpur','Buxar','Darbhanga','East Champaran (Motihari)','Gaya','Gopalganj','Jamui','Jehanabad','Khagaria','Kishanganj','Kaimur (Bhabua)','Katihar','Lakhisarai','Madhepura','Madhubani','Munger','Muzaffarpur','Nalanda','Nawada','Patna','Purnia','Rohtas','Saharsa','Samastipur','Saran','Sheikhpura','Sheohar','Sitamarhi','Siwan','Supaul','Vaishali','West Champaran'
  ],
  'Chhattisgarh': [
    'Balod','Baloda Bazar','Balrampur','Bastar','Bemetara','Bijapur','Bilaspur','Dantewada','Dhamtari','Durg','Gariaband','Gaurela-Pendra-Marwahi','Janjgir-Champa','Jashpur','Kabirdham (Kawardha)','Kanker','Kondagaon','Korba','Koriya','Mahasamund','Mungeli','Narayanpur','Raigarh','Raipur','Rajnandgaon','Sukma','Surajpur','Surguja'
  ],
  'Goa': ['North Goa','South Goa'],
  'Gujarat': [
    'Ahmedabad','Amreli','Anand','Aravalli','Banaskantha','Bharuch','Bhavnagar','Botad','Chhota Udaipur','Dahod','Dang','Devbhoomi Dwarka','Gandhinagar','Gir Somnath','Jamnagar','Junagadh','Kheda','Kutch','Mahisagar','Mehsana','Morbi','Narmada','Navsari','Panchmahal','Patan','Porbandar','Rajkot','Sabarkantha','Surat','Surendranagar','Tapi','Vadodara','Valsad'
  ],
  'Haryana': [
    'Ambala','Bhiwani','Charkhi Dadri','Faridabad','Fatehabad','Gurugram','Hisar','Jhajjar','Jind','Kaithal','Karnal','Kurukshetra','Mahendragarh','Nuh','Palwal','Panchkula','Panipat','Rewari','Rohtak','Sirsa','Sonipat','Yamunanagar'
  ],
  'Himachal Pradesh': [
    'Bilaspur','Chamba','Hamirpur','Kangra','Kinnaur','Kullu','Lahaul and Spiti','Mandi','Shimla','Sirmaur','Solan','Una'
  ],
  'Jharkhand': [
    'Bokaro','Chatra','Deoghar','Dhanbad','Dumka','East Singhbhum','Garhwa','Giridih','Godda','Gumla','Hazaribagh','Jamtara','Khunti','Koderma','Latehar','Lohardaga','Pakur','Palamu','Ramgarh','Ranchi','Sahebganj','Seraikela-Kharsawan','Simdega','West Singhbhum'
  ],
  'Karnataka': [
    'Bagalkote','Ballari','Belagavi','Bengaluru Rural','Bengaluru Urban','Bidar','Chamarajanagar','Chikkaballapur','Chikkamagaluru','Chitradurga','Dakshina Kannada','Davanagere','Dharwad','Gadag','Hassan','Haveri','Kalaburagi','Kodagu','Kolar','Koppal','Mandya','Mysuru','Raichur','Ramanagara','Shivamogga','Tumakuru','Udupi','Uttara Kannada','Vijayapura','Yadgir'
  ],
  'Kerala': [
    'Alappuzha','Ernakulam','Idukki','Kannur','Kasaragod','Kollam','Kottayam','Kozhikode','Malappuram','Palakkad','Pathanamthitta','Thiruvananthapuram','Thrissur','Wayanad'
  ],
  'Madhya Pradesh': [
    'Agar Malwa','Alirajpur','Anuppur','Ashoknagar','Balaghat','Barwani','Betul','Bhind','Bhopal','Burhanpur','Chhatarpur','Chhindwara','Damoh','Datia','Dewas','Dhar','Dindori','Guna','Gwalior','Harda','Hoshangabad (Narmadapuram)','Indore','Jabalpur','Jhabua','Katni','Khandwa','Khargone','Mandla','Mandsaur','Morena','Niwari','Narsinghpur','Neemuch','Panna','Raisen','Rajgarh','Ratlam','Rewa','Sagar','Satna','Sehore','Seoni','Shahdol','Shajapur','Sheopur','Shivpuri','Sidhi','Singrauli','Tikamgarh','Ujjain','Umaria','Vidisha'
  ],
  'Maharashtra': [
    'Ahmednagar','Akola','Amravati','Aurangabad (Chhatrapati Sambhajinagar)','Beed','Bhandara','Buldhana','Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban','Nagpur','Nanded','Nandurbar','Nashik','Osmanabad (Dharashiv)','Palghar','Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara','Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal'
  ],
  'Manipur': [
    'Bishnupur','Chandel','Churachandpur','Imphal East','Imphal West','Jiribam','Kakching','Kamjong','Kangpokpi','Noney','Pherzawl','Senapati','Tamenglong','Tengnoupal','Thoubal','Ukhrul'
  ],
  'Meghalaya': [
    'East Garo Hills','East Jaintia Hills','East Khasi Hills','North Garo Hills','Ri-Bhoi','South Garo Hills','South West Garo Hills','South West Khasi Hills','West Garo Hills','West Jaintia Hills','West Khasi Hills'
  ],
  'Mizoram': [
    'Aizawl','Khawzawl','Hnahthial','Kolasib','Lawngtlai','Lunglei','Mamit','Saiha','Saitual','Serchhip','Champhai'
  ],
  'Nagaland': [
    'Chümoukedima','Dimapur','Kiphire','Kohima','Longleng','Mokokchung','Mon','Niuland','Noklak','Peren','Phek','Tuensang','Tseminyü','Wokha','Zünheboto'
  ],
  'Odisha': [
    'Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh','Cuttack','Deogarh','Dhenkanal','Gajapati','Ganjam','Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi','Kandhamal','Kendrapara','Keonjhar','Khordha','Koraput','Malkangiri','Mayurbhanj','Nabarangpur','Nayagarh','Nuapada','Puri','Rayagada','Sambalpur','Subarnapur','Sundargarh'
  ],
  'Punjab': [
    'Amritsar','Barnala','Bathinda','Faridkot','Fatehgarh Sahib','Fazilka','Ferozepur','Gurdaspur','Hoshiarpur','Jalandhar','Kapurthala','Ludhiana','Mansa','Moga','Pathankot','Patiala','Rupnagar','Sahibzada Ajit Singh Nagar (Mohali)','Sangrur','Shaheed Bhagat Singh Nagar (Nawanshahr)','Sri Muktsar Sahib','Tarn Taran'
  ],
  'Rajasthan': [
    'Ajmer','Alwar','Anupgarh','Balotra','Baran','Barmer','Beawar','Bharatpur','Bhilwara','Bikaner','Bundi','Chittorgarh','Dausa','Deeg','Dholpur','Didwana-Kuchaman','Dudu','Hanumangarh','Jaipur','Jaipur Rural','Jaisalmer','Jalore','Jhalawar','Jhunjhunu','Jodhpur','Jodhpur Rural','Karauli','Kekri','Kota','Khairthal-Tijara','Nagaur','Neem Ka Thana','Pali','Phalodi','Pratapgarh','Rajsamand','Salumbar','Sanchore','Sawai Madhopur','Shahpura','Sikar','Sirohi','Sri Ganganagar','Tonk','Udaipur'
  ],
  'Sikkim': ['East Sikkim','North Sikkim','South Sikkim','West Sikkim','Pakyong','Soreng'],
  'Tamil Nadu': [
    'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kanchipuram','Kanyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thiruvallur','Thiruvarur','Tuticorin (Thoothukudi)','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvannamalai','Vellore','Viluppuram','Virudhunagar']
  ,
  'Telangana': [
    'Adilabad','Bhadradri Kothagudem','Hanamkonda','Hyderabad','Jagtial','Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam','Komaram Bheem Asifabad','Mahabubabad','Mahabubnagar','Mancherial','Medak','Medchal–Malkajgiri','Mulugu','Nagarkurnool','Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla','Ranga Reddy','Sangareddy','Siddipet','Suryapet','Vikarabad','Wanaparthy','Warangal','Yadadri Bhuvanagiri'
  ],
  'Tripura': ['Dhalai','Gomati','Khowai','North Tripura','Sepahijala','South Tripura','Unakoti','West Tripura'],
  'Uttar Pradesh': [
    'Agra','Aligarh','Ambedkar Nagar','Amethi','Amroha','Auraiya','Ayodhya','Azamgarh','Baghpat','Bahraich','Ballia','Balrampur','Banda','Barabanki','Bareilly','Basti','Bhadohi','Bijnor','Budaun','Bulandshahr','Chandauli','Chitrakoot','Deoria','Etah','Etawah','Farrukhabad','Fatehpur','Firozabad','Gautam Buddha Nagar','Ghaziabad','Ghazipur','Gonda','Gorakhpur','Hamirpur','Hapur','Hardoi','Hathras','Jalaun','Jaunpur','Jhansi','Kannauj','Kanpur Dehat','Kanpur Nagar','Kasganj','Kaushambi','Kheri','Kushinagar','Lalitpur','Lucknow','Maharajganj','Mahoba','Mainpuri','Mathura','Mau','Meerut','Mirzapur','Moradabad','Muzaffarnagar','Pilibhit','Pratapgarh','Prayagraj','Raebareli','Rampur','Saharanpur','Sambhal','Sant Kabir Nagar','Shahjahanpur','Shamli','Shrawasti','Siddharth Nagar','Sitapur','Sonbhadra','Sultanpur','Unnao','Varanasi'
  ],
  'Uttarakhand': [
    'Almora','Bageshwar','Chamoli','Champawat','Dehradun','Haridwar','Nainital','Pauri Garhwal','Pithoragarh','Rudraprayag','Tehri Garhwal','Udham Singh Nagar','Uttarkashi'
  ],
  'West Bengal': [
    'Alipurduar','Bankura','Birbhum','Cooch Behar','Dakshin Dinajpur','Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram','Kalimpong','Kolkata','Malda','Murshidabad','Nadia','North 24 Parganas','Paschim Bardhaman','Paschim Medinipur','Purba Bardhaman','Purba Medinipur','Purulia','South 24 Parganas','Uttar Dinajpur'
  ],
  // Union Territories
  'Andaman and Nicobar Islands': ['Nicobar','North and Middle Andaman','South Andaman'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Dadra and Nagar Haveli','Daman','Diu'],
  'Delhi': ['Central Delhi','East Delhi','New Delhi','North Delhi','North East Delhi','North West Delhi','Shahdara','South Delhi','South East Delhi','South West Delhi','West Delhi'],
  'Jammu and Kashmir': [
    'Anantnag','Bandipora','Baramulla','Budgam','Doda','Ganderbal','Jammu','Kathua','Kishtwar','Kulgam','Kupwara','Poonch','Pulwama','Rajouri','Ramban','Reasi','Samba','Shopian','Srinagar','Udhampur'
  ],
  'Ladakh': ['Kargil','Leh'],
  'Lakshadweep': ['Lakshadweep'],
  'Puducherry': ['Puducherry','Karaikal','Mahe','Yanam']
}

const DISTRICTS_EXTRA_JSON_PATH = path.join(process.cwd(), 'prisma', 'data', 'districts.full.json')

// ------------------------------------
// 2) Master lookups (GST, HSN, etc.)
// ------------------------------------
const TAX_GROUPS = [
  { name: 'GST 0%', rate: '0.00' },
  { name: 'GST 5%', rate: '5.00' },
  { name: 'GST 12%', rate: '12.00' },
  { name: 'GST 18%', rate: '18.00' },
  { name: 'GST 28%', rate: '28.00' },
]

// Hospitality-focused HSN/SAC set (curated)
// - Services (SAC 9963xx) + common goods (F&B, housekeeping, amenities, linen, appliances)
// - `desc` kept concise for UI readability
const HSN_SAC = [
  // Services (Accommodation, Restaurant & Catering)
  { code: '996311', desc: 'Hotel room accommodation services' },
  { code: '996331', desc: 'Restaurant & room service (food & beverage delivery)' },
  { code: '996332', desc: 'Restaurant services incl. takeaway & door delivery' },
  { code: '996333', desc: 'Outdoor catering services' },
  { code: '996334', desc: 'Event catering services' },
  // Water & Beverages (non-alcoholic)
  { code: '220110', desc: 'Packaged natural/mineral water' },
  { code: '220190', desc: 'Other drinking water (non-alcoholic)' },
  { code: '220210', desc: 'Aerated waters (soft drinks)' },
  { code: '220290', desc: 'Other non-alcoholic beverages' },
  { code: '200990', desc: 'Fruit/veg juices (not fermented)' },
  // Tea/Coffee/Breakfast staples
  { code: '090121', desc: 'Coffee (roasted)' },
  { code: '090111', desc: 'Coffee (not roasted)' },
  { code: '090230', desc: 'Black tea (fermented)' },
  { code: '040120', desc: 'Milk (not concentrated)' },
  { code: '040310', desc: 'Yogurt/curd' },
  { code: '040610', desc: 'Cheese' },
  // Grains & staples
  { code: '100630', desc: 'Rice (semi/wholly milled)' },
  { code: '110100', desc: 'Wheat/maida flour' },
  { code: '110220', desc: 'Maize/rice flour' },
  { code: '190540', desc: 'Rusks, toasted bread & bakery items' },
  { code: '190531', desc: 'Sweet biscuits' },
  { code: '190590', desc: 'Other bakery products' },
  { code: '170199', desc: 'Refined sugar' },
  { code: '150790', desc: 'Edible oils (soya/other)' },
  // Packaged foods / snacks
  { code: '210390', desc: 'Sauces, mixed condiments' },
  { code: '210410', desc: 'Soups & broths' },
  { code: '210690', desc: 'Food preparations n.e.c.' },
  { code: '190230', desc: 'Pasta (cooked/uncooked)' },
  { code: '160100', desc: 'Sausages & similar' },
  { code: '160250', desc: 'Prepared meat, fish etc.' },
  // Housekeeping & toiletries
  { code: '340111', desc: 'Soap bars for toilet use' },
  { code: '340119', desc: 'Other soaps' },
  { code: '340220', desc: 'Washing & cleaning preparations' },
  { code: '330510', desc: 'Shampoos' },
  { code: '330499', desc: 'Cosmetics/toiletry preparations' },
  { code: '330610', desc: 'Dental hygiene preparations' },
  { code: '481820', desc: 'Handkerchiefs/tissues/napkins' },
  // Linen & furnishings
  { code: '630260', desc: 'Toilet linen & kitchen linen' },
  { code: '630231', desc: 'Bed linen (cotton)' },
  { code: '630239', desc: 'Bed linen (other materials)' },
  { code: '630492', desc: 'Cushion covers' },
  // Appliances & electricals
  { code: '851660', desc: 'Electric ovens & cooking ranges' },
  { code: '851640', desc: 'Electric hair dryers/irons' },
  { code: '850980', desc: 'Other electro-mechanical domestic appliances' },
  { code: '841810', desc: 'Refrigerators' },
  // Tableware & disposables
  { code: '392410', desc: 'Tableware & kitchenware (plastic)' },
  { code: '701349', desc: 'Glassware for table/kitchen' },
  { code: '691110', desc: 'Porcelain/china tableware' },
]

const PAYMENT_MODES = ['Cash','Card','UPI','Net Banking','Wallet','Other']
const BOOKING_SOURCES = ['Walk-in','Phone','Website','Corporate','Travel Agent','OTA - Booking.com','OTA - MakeMyTrip','OTA - Goibibo']
const UNIT_TYPES = ['Nos','Kg','Gram','Litre','ml','Dozen','Pack','Bottle','Plate','Piece']
const DOCUMENT_TYPES = ['Invoice','Receipt','Purchase Order','Delivery Challan','Proforma Invoice','Credit Note','Debit Note']
const ID_TYPES = ['Aadhaar Card','PAN Card','Driving License','Passport','Voter ID']

// ------------------------------------
// 3) Liquor Catalogue (Categories & Brands)
// ------------------------------------
const LIQUOR_CATEGORIES = [
  'Whisky','Rum','Vodka','Gin','Brandy','Beer','Wine','Tequila','Liqueur'
]

const LIQUOR_BRANDS: Record<string, string[]> = {
  'Whisky': ["Blenders Pride","Royal Stag","McDowell's No.1","Signature","Antiquity Blue","Jameson","Jack Daniel's"],
  'Rum': ['Old Monk','Bacardi','Captain Morgan','Hercules','McDowell’s Celebration'],
  'Vodka': ['Smirnoff','Absolut','Magic Moments','Romanov','Grey Goose'],
  'Gin': ['Bombay Sapphire','Beefeater','Hendrick\'s','Greater Than','Tanqueray'],
  'Brandy': ['Mansion House','Honey Bee','Hennessy','Remy Martin'],
  'Beer': ['Kingfisher','Budweiser','Heineken','Bira 91','Corona'],
  'Wine': ['Sula','Grover Zampa','Fratelli','Jacob\'s Creek','Nine Hills'],
  'Tequila': ['Jose Cuervo','Patrón','Sauza','Camino Real'],
  'Liqueur': ['Baileys','Kahlúa','Jägermeister','Cointreau']
}

// ------------------------------------
// 4) Menu (Categories, Items & Metadata examples)
// ------------------------------------
const MENU_CATEGORIES = ['Starters','Main Course','Breads','Desserts','Beverages','Bar Snacks']

const MENU_ITEMS: Array<{category: string, name: string, price: string, description?: string, hsn?: string, tax?: string}> = [
  { category: 'Beverages', name: 'Packaged Drinking Water 1L', price: '20.00', description: 'Bottled water 1 litre', hsn: '220110', tax: 'GST 18%' },
  { category: 'Beverages', name: 'Fresh Lime Soda', price: '90.00', description: 'Lemon soda', hsn: '220210', tax: 'GST 18%' },
  { category: 'Starters', name: 'Veg Spring Rolls', price: '180.00', description: 'Crispy veg spring rolls', hsn: '210690', tax: 'GST 18%' },
  { category: 'Main Course', name: 'Paneer Butter Masala', price: '260.00', description: 'Cottage cheese in tomato gravy', hsn: '210690', tax: 'GST 5%' },
  { category: 'Breads', name: 'Butter Naan', price: '50.00', description: 'Refined flour leavened bread', hsn: '190590', tax: 'GST 5%' },
  { category: 'Desserts', name: 'Gulab Jamun', price: '120.00', description: 'Milk-solid dumplings in syrup', hsn: '190540', tax: 'GST 5%' },
]

// ------------------------------------
// Seeding routines
// ------------------------------------
async function seedStatesAndDistricts() {
  console.log('→ Seeding States & UTs...')
  const stateIdByName = new Map<string, number>()

  for (const name of STATES_AND_UTS) {
    const s = await createOrUpdateBy(prisma.state, { name }, { name })
    stateIdByName.set(name, s.id)
  }

  // Districts from starter map
  console.log('→ Seeding Districts (starter set)...')
  for (const [stateName, districts] of Object.entries(DISTRICTS_STARTER)) {
    const stateId = stateIdByName.get(stateName)
    if (!stateId) continue
    for (const d of districts) {
      await createOrUpdateBy(prisma.district, { name: d, stateId }, { name: d, stateId })
    }
  }

  // Optional: extend via JSON file
  if (fs.existsSync(DISTRICTS_EXTRA_JSON_PATH)) {
    console.log('→ Extending Districts from JSON...')
    try {
      const raw = fs.readFileSync(DISTRICTS_EXTRA_JSON_PATH, 'utf-8')
      const extra: Record<string, string[]> = JSON.parse(raw)
      for (const [stateName, districts] of Object.entries(extra)) {
        const stateId = stateIdByName.get(stateName)
        if (!stateId) continue
        for (const d of districts) {
          await createOrUpdateBy(prisma.district, { name: d, stateId }, { name: d, stateId })
        }
      }
    } catch (e) {
      console.warn('   (Skipping extra districts — invalid JSON)')
    }
  }
}

async function seedCoreMasters() {
  console.log('→ Seeding core masters (IDs, Docs, Units, Payment, Booking)...')

  for (const name of ID_TYPES) await ensureSingle(prisma.idType, 'name', name)
  for (const name of DOCUMENT_TYPES) await ensureSingle(prisma.documentType, 'name', name)
  for (const name of UNIT_TYPES) await ensureSingle(prisma.unitType, 'name', name)
  for (const mode of PAYMENT_MODES) await ensureSingle(prisma.paymentMode, 'mode', mode)
  for (const name of BOOKING_SOURCES) await ensureSingle(prisma.bookingSource, 'name', name)

  console.log('→ Seeding GST Tax Groups...')
  for (const tg of TAX_GROUPS) {
    await createOrUpdateBy(prisma.taxGroup, { name: tg.name }, { name: tg.name, rate: tg.rate })
  }

  console.log('→ Seeding HSN/SAC codes...')
  for (const h of HSN_SAC) {
    await createOrUpdateBy(prisma.hsnSacCode, { code: h.code }, { code: h.code, desc: h.desc })
  }
}

async function seedLiquor() {
  console.log('→ Seeding Liquor Categories & Brands...')
  const catId = new Map<string, number>()
  for (const name of LIQUOR_CATEGORIES) {
    const c = await createOrUpdateBy(prisma.liquorCategory, { name }, { name })
    catId.set(name, c.id)
  }
  for (const [cat, brands] of Object.entries(LIQUOR_BRANDS)) {
    const categoryId = catId.get(cat)
    if (!categoryId) continue
    for (const name of brands) {
      await createOrUpdateBy(prisma.liquorBrand, { name }, { name, categoryId })
    }
  }
}

async function seedMenu() {
  console.log('→ Seeding Menu categories & items...')
  // Categories
  const catMap = new Map<string, number>()
  for (const name of MENU_CATEGORIES) {
    const mc = await createOrUpdateBy(prisma.menuCategory, { name }, { name })
    catMap.set(name, mc.id)
  }
  // Items + metadata
  for (const it of MENU_ITEMS) {
    const categoryId = catMap.get(it.category)
    if (!categoryId) continue
    const item = await createOrUpdateBy(prisma.menuItem, { name: it.name, categoryId }, {
      name: it.name,
      categoryId,
      description: it.description ?? null,
      price: it.price,
    })

    // Metadata: HSN and Tax mapping
    const metas: Array<{ key: string, value: string }> = []
    if (it.hsn) metas.push({ key: 'HSN', value: it.hsn })
    if (it.tax) metas.push({ key: 'TAX_GROUP', value: it.tax })

    for (const m of metas) {
      const existing = await prisma.menuItemMetadata.findFirst({ where: { menuItemId: item.id, key: m.key } })
      if (existing) {
        await prisma.menuItemMetadata.update({ where: { id: existing.id }, data: { value: m.value } })
      } else {
        await prisma.menuItemMetadata.create({ data: { menuItemId: item.id, key: m.key, value: m.value } })
      }
    }
  }
}

async function main() {
  console.log('🌱 Metadata seed (production-grade) starting...')
  await seedStatesAndDistricts()
  await seedCoreMasters()
  await seedLiquor()
  await seedMenu()
  console.log('✅ Metadata seed complete.')
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error('❌ Metadata seed failed:', e); await prisma.$disconnect(); process.exit(1) })
