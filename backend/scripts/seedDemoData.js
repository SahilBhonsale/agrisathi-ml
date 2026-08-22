require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const CareTip = require('../models/CareTip');
const Product = require('../models/Product');
const Question = require('../models/Question');

const careTips = [
  { name: 'Tomato', watering: 'Water deeply every 2–3 days; keep leaves dry.', sunlight: '6–8 hours of direct sunlight.', remedies: 'Use neem oil for early pest pressure and remove affected leaves.', diseases: 'Early blight, late blight, leaf mold.', plantType: 'Vegetable' },
  { name: 'Apple', watering: 'Deep water weekly for young trees; reduce during rain.', sunlight: 'Full sun with good air movement.', remedies: 'Prune infected twigs and clear fallen leaves.', diseases: 'Apple scab, black rot, cedar apple rust.', plantType: 'Fruit' },
  { name: 'Tulsi', watering: 'Water when the top soil feels dry; avoid waterlogging.', sunlight: '4–6 hours of morning sunlight.', remedies: 'Pinch tips regularly; apply diluted neem oil for aphids.', diseases: 'Root rot and leaf spot.', plantType: 'Herb' },
  { name: 'Wheat', watering: 'Irrigate at crown-root, flowering and grain-filling stages.', sunlight: 'Open field with full sunlight.', remedies: 'Use certified seed and rotate crops to reduce disease.', diseases: 'Rust, smut and powdery mildew.', plantType: 'General' },
  { name: 'Rose', watering: 'Water deeply twice weekly at soil level.', sunlight: 'At least 6 hours of sunlight.', remedies: 'Improve airflow and use neem oil for aphids.', diseases: 'Black spot, rust and powdery mildew.', plantType: 'Flower' },
  { name: 'Mango', watering: 'Young trees weekly; established trees mainly during flowering and fruiting.', sunlight: 'Full sun in a warm, open position.', remedies: 'Prune dead growth and maintain orchard sanitation.', diseases: 'Anthracnose and powdery mildew.', plantType: 'Fruit' },
  { name: 'Potato', watering: 'Keep soil evenly moist, especially during tuber formation; avoid standing water.', sunlight: '6–8 hours of direct sunlight in cool conditions.', remedies: 'Earth up soil around stems and remove infected foliage promptly.', diseases: 'Late blight, early blight and common scab.', plantType: 'Vegetable' },
  { name: 'Chilli', watering: 'Water when the upper soil begins to dry; reduce water during cool, humid weather.', sunlight: '6–8 hours of bright direct sunlight.', remedies: 'Use sticky traps for whiteflies and remove curled, badly affected leaves.', diseases: 'Leaf curl, anthracnose and bacterial leaf spot.', plantType: 'Vegetable' },
  { name: 'Brinjal', watering: 'Water deeply two or three times weekly, keeping moisture consistent.', sunlight: 'Full sun for at least 6 hours.', remedies: 'Remove shoot-and-fruit-borer damage and keep the plot free of crop debris.', diseases: 'Bacterial wilt, little leaf and fruit rot.', plantType: 'Vegetable' },
  { name: 'Okra', watering: 'Water deeply when the top soil dries; avoid wet foliage late in the day.', sunlight: 'Full sun and warm growing conditions.', remedies: 'Remove severely curled plants and monitor the underside of leaves for whiteflies.', diseases: 'Yellow vein mosaic, powdery mildew and wilt.', plantType: 'Vegetable' },
  { name: 'Cucumber', watering: 'Maintain even moisture and water at the root, especially during flowering and fruiting.', sunlight: '6–8 hours of sunlight with afternoon protection in extreme heat.', remedies: 'Train vines for airflow and remove leaves with advanced fungal growth.', diseases: 'Downy mildew, powdery mildew and mosaic virus.', plantType: 'Vegetable' },
  { name: 'Onion', watering: 'Water lightly and consistently during bulb formation; stop near harvest.', sunlight: 'Full sun in an open, well-drained bed.', remedies: 'Rotate crops and remove infected bulbs rather than composting them.', diseases: 'Purple blotch, basal rot and downy mildew.', plantType: 'Vegetable' },
  { name: 'Rice', watering: 'Maintain water according to crop stage and field method; avoid prolonged deep flooding.', sunlight: 'Open field with full sunlight.', remedies: 'Use clean seed, balanced nutrition and remove volunteer plants around bunds.', diseases: 'Blast, bacterial leaf blight and sheath blight.', plantType: 'General' },
  { name: 'Maize', watering: 'Prioritize irrigation during knee-high, tasseling, silking and grain-filling stages.', sunlight: 'Full sun in an open field.', remedies: 'Scout whorls early for fall armyworm and destroy heavily infested plant material.', diseases: 'Leaf blight, downy mildew and stalk rot.', plantType: 'General' },
  { name: 'Cotton', watering: 'Irrigate deeply but infrequently; avoid water stress during flowering and boll development.', sunlight: 'Full sun with warm, dry airflow.', remedies: 'Monitor pest thresholds, conserve beneficial insects and remove crop residue after harvest.', diseases: 'Bacterial blight, wilt and leaf curl.', plantType: 'General' },
  { name: 'Banana', watering: 'Provide frequent deep watering while keeping the root zone well drained.', sunlight: 'Full sun with shelter from damaging winds.', remedies: 'Remove old infected leaves, sanitize tools and maintain clean planting material.', diseases: 'Sigatoka leaf spot, Panama wilt and bunchy top.', plantType: 'Fruit' },
  { name: 'Guava', watering: 'Water young trees regularly; established trees need extra moisture during flowering and fruit set.', sunlight: 'Full sun for strong flowering and fruit quality.', remedies: 'Prune crowded branches and collect fallen or damaged fruit.', diseases: 'Wilt, anthracnose and fruit canker.', plantType: 'Fruit' },
  { name: 'Lemon', watering: 'Water deeply after the top few centimetres of soil dry; never leave roots waterlogged.', sunlight: '6–8 hours of direct sunlight.', remedies: 'Prune dead wood, control leaf miners early and keep mulch away from the trunk.', diseases: 'Citrus canker, gummosis and citrus greening.', plantType: 'Fruit' },
  { name: 'Papaya', watering: 'Water regularly in small amounts and ensure rapid drainage around the stem.', sunlight: 'Full sun in a warm, wind-protected position.', remedies: 'Remove virus-affected plants, control aphid vectors and avoid stem injury.', diseases: 'Papaya ringspot, powdery mildew and root rot.', plantType: 'Fruit' },
  { name: 'Coriander', watering: 'Keep soil lightly moist during germination, then water when the surface begins to dry.', sunlight: 'Morning sun or partial shade in hot weather.', remedies: 'Thin seedlings for airflow and avoid overhead watering.', diseases: 'Powdery mildew, wilt and stem gall.', plantType: 'Herb' },
  { name: 'Mint', watering: 'Keep soil consistently moist but not saturated.', sunlight: 'Morning sun with afternoon shade in hot regions.', remedies: 'Trim crowded growth, remove rusted leaves and grow in a controlled bed or container.', diseases: 'Mint rust, powdery mildew and leaf spot.', plantType: 'Herb' },
  { name: 'Marigold', watering: 'Water at the base after soil begins to dry; avoid constantly wet roots.', sunlight: 'At least 6 hours of direct sunlight.', remedies: 'Deadhead regularly and remove affected leaves to improve airflow.', diseases: 'Botrytis blight, leaf spot and root rot.', plantType: 'Flower' }
];

const communityQuestions = [
  { title: 'How can I protect tomato plants during heavy monsoon rain?', content: 'Looking for drainage, staking and disease-prevention advice for a small tomato plot. The lower leaves have started staying wet for most of the day after repeated rain.', category: 'Weather', tags: ['tomato', 'monsoon', 'drainage'], views: 46, isPinned: true },
  { title: 'Best organic method to improve low soil fertility?', content: 'The soil is compact and low in organic matter. Which green manure or compost schedule works well before the next vegetable cycle?', category: 'Soil Health', tags: ['soil', 'organic', 'compost'], views: 31 },
  { title: 'When should wheat receive its first irrigation?', content: 'Please share practical timing for crown-root initiation and later critical irrigation stages. The field was sown on time in medium-textured soil.', category: 'Irrigation', tags: ['wheat', 'irrigation'], views: 38 },
  { title: 'How do I control whiteflies on chilli without harming beneficial insects?', content: 'Whiteflies are gathering below the newer chilli leaves, but I also see ladybirds in the plot. I would like an integrated approach that protects beneficial insects.', category: 'Pest Control', tags: ['chilli', 'whitefly', 'neem'], views: 28 },
  { title: 'Which green manure works well before a monsoon rice crop?', content: 'I have a short window before transplanting rice and want to add biomass to a low-organic-matter field. Which crop establishes quickly and when should it be incorporated?', category: 'Organic Farming', tags: ['rice', 'green-manure', 'soil'], views: 22 },
  { title: 'How can I tell when groundnut is ready to harvest?', content: 'The foliage is beginning to yellow, but pod maturity is uneven. What field signs should I check before lifting the crop to avoid immature kernels?', category: 'Harvesting', tags: ['groundnut', 'harvest', 'timing'], views: 35 },
  { title: 'Is drip irrigation worth it for a one-acre vegetable plot?', content: 'I grow seasonal tomato, chilli and okra on one acre. I am comparing the initial cost of drip irrigation with possible water and labour savings.', category: 'Technology', tags: ['drip', 'vegetables', 'water'], views: 52 },
  { title: 'How should onion bulbs be cured and stored after harvest?', content: 'I need a practical curing and storage routine for a small onion harvest in warm weather. How much neck drying and ventilation should I look for?', category: 'Harvesting', tags: ['onion', 'storage', 'post-harvest'], views: 41 },
  { title: 'What should I check before buying tomato seed for the next season?', content: 'Besides germination percentage, which details on the packet and variety description matter most for selecting seed for an open-field crop?', category: 'Seeds', tags: ['tomato', 'seeds', 'planning'], views: 19 },
  { title: 'Where can small growers track reliable local mandi prices?', content: 'I want to compare nearby market prices before transporting vegetables. Which official sources or daily checks are useful for a small grower?', category: 'Market', tags: ['mandi', 'prices', 'market'], views: 44 }
];

const ensureDemoData = async () => {
  let admin = await User.findOne({ email: 'admin@agrisathi.local' });
  if (!admin) {
    admin = await User.create({
      name: 'AgriSathi Admin',
      email: 'admin@agrisathi.local',
      password: process.env.SEED_ADMIN_PASSWORD || 'AgriSathi@123',
      isAdmin: true
    });
  } else if (!admin.isAdmin) {
    admin.isAdmin = true;
    await admin.save();
  }

  for (const tip of careTips) {
    await CareTip.updateOne(
      { createdBy: admin._id, name: tip.name },
      { $setOnInsert: { ...tip, createdBy: admin._id } },
      { upsert: true }
    );
  }

  if (await Product.countDocuments({ seller: admin._id }) === 0) {
    await Product.insertMany([
      { title: 'Certified Tomato Seeds', description: 'High-germination, disease-tolerant tomato seeds suitable for kitchen gardens and small farms.', price: 180, category: 'Seeds', images: ['/uploads/demo/tomato-seeds.svg'], condition: 'New', location: { city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' }, seller: admin._id, contactInfo: { phone: '9999999999', email: 'admin@agrisathi.local', whatsapp: '919999999999' }, quantity: 25, unit: 'piece' },
      { title: 'Organic Vermicompost', description: 'Screened organic vermicompost for vegetables, flowers and fruit plants.', price: 420, category: 'Organic Products', images: ['/uploads/demo/vermicompost.svg'], condition: 'New', location: { city: 'Anand', state: 'Gujarat', pincode: '388001' }, seller: admin._id, contactInfo: { phone: '9999999999', email: 'admin@agrisathi.local', whatsapp: '919999999999' }, quantity: 50, unit: 'kg' },
      { title: 'Hand Cultivator Set', description: 'Durable three-piece garden tool set with comfortable handles for everyday field and garden work.', price: 650, category: 'Tools', images: ['/uploads/demo/garden-tools.svg'], condition: 'New', location: { city: 'Vadodara', state: 'Gujarat', pincode: '390001' }, seller: admin._id, contactInfo: { phone: '9999999999', email: 'admin@agrisathi.local', whatsapp: '919999999999' }, quantity: 12, unit: 'piece' }
    ]);
  }

  for (const question of communityQuestions) {
    await Question.updateOne(
      { author: admin._id, title: question.title },
      { $setOnInsert: { ...question, author: admin._id } },
      { upsert: true }
    );
  }

  return admin;
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrisathi');
  await ensureDemoData();
  console.log('Demo data ready');
  console.log('Admin: admin@agrisathi.local / AgriSathi@123');
  await mongoose.disconnect();
};

if (require.main === module) {
  run().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  });
}

module.exports = { ensureDemoData };
