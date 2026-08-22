const COMMON_CARE = {
  Apple: {
    watering: 'Water deeply at the root when the upper soil begins to dry; avoid wetting foliage.',
    sunlight: 'Provide 6–8 hours of direct sunlight with good airflow through the canopy.',
    soil: 'Use well-drained, fertile soil and maintain a clean organic mulch away from the trunk.'
  },
  Tomato: {
    watering: 'Water consistently at soil level in the morning; avoid splashing the leaves.',
    sunlight: 'Provide 6–8 hours of direct sunlight and space plants for airflow.',
    soil: 'Use fertile, well-drained soil with mulch to reduce soil splash and moisture swings.'
  }
};

const DISEASE_GUIDANCE = {
  Apple___Apple_scab: {
    disease: 'Apple scab',
    symptoms: ['Olive-brown leaf spots that may become dark and velvety', 'Premature yellowing or leaf drop'],
    treatment: ['Remove heavily infected leaves and fallen debris', 'Ask a local expert about a registered protectant fungicide if infection is spreading'],
    prevention: ['Prune for airflow and avoid overhead irrigation', 'Clear fallen leaves at the end of the season']
  },
  Apple___Black_rot: {
    disease: 'Apple black rot',
    symptoms: ['Purple or brown spots that enlarge on leaves', 'Dark cankers or rotting fruit may appear nearby'],
    treatment: ['Prune infected twigs and cankers with sanitized tools', 'Remove mummified fruit and badly affected plant material'],
    prevention: ['Disinfect pruning tools between cuts', 'Reduce tree stress and remove dead wood promptly']
  },
  Apple___Cedar_apple_rust: {
    disease: 'Cedar apple rust',
    symptoms: ['Bright yellow-orange spots on the upper leaf surface', 'Small tube-like growths may form below spots'],
    treatment: ['Remove badly affected leaves where practical', 'Consult a local expert before using a registered fungicide'],
    prevention: ['Avoid planting susceptible apples close to juniper or cedar hosts', 'Choose resistant apple varieties where available']
  },
  Tomato___Bacterial_spot: {
    disease: 'Tomato bacterial spot',
    symptoms: ['Small dark, water-soaked spots on leaves', 'Spots may develop yellow margins and merge'],
    treatment: ['Remove badly affected leaves without touching healthy plants', 'Avoid working among plants while foliage is wet'],
    prevention: ['Use disease-free seed and sanitize tools', 'Rotate away from tomato and pepper crops']
  },
  Tomato___Early_blight: {
    disease: 'Tomato early blight',
    symptoms: ['Brown lesions with concentric target-like rings', 'Yellowing commonly begins on older lower leaves'],
    treatment: ['Remove affected lower leaves and dispose of them away from the crop', 'Use only a locally registered fungicide after expert guidance if disease continues spreading'],
    prevention: ['Mulch to prevent infected soil splashing onto leaves', 'Rotate crops and stake plants for better airflow']
  },
  Tomato___Late_blight: {
    disease: 'Tomato late blight',
    symptoms: ['Large irregular water-soaked brown patches', 'White growth may appear beneath lesions in humid weather'],
    treatment: ['Isolate and remove severely infected plants quickly', 'Contact a local agricultural expert because late blight can spread rapidly'],
    prevention: ['Avoid overhead watering and prolonged leaf wetness', 'Use certified plants and monitor crops during cool, humid weather']
  },
  Tomato___Leaf_Mold: {
    disease: 'Tomato leaf mold',
    symptoms: ['Pale yellow patches on upper leaf surfaces', 'Olive-green or gray mold beneath affected areas'],
    treatment: ['Remove infected leaves and reduce greenhouse humidity', 'Increase ventilation around plants'],
    prevention: ['Keep foliage dry and provide generous spacing', 'Use resistant varieties in humid growing conditions']
  },
  Tomato___Septoria_leaf_spot: {
    disease: 'Tomato Septoria leaf spot',
    symptoms: ['Many small round spots with pale centers and dark borders', 'Lower leaves yellow and die first'],
    treatment: ['Remove infected lower leaves promptly', 'Keep foliage dry and ask about locally registered controls if needed'],
    prevention: ['Mulch below plants and rotate crops', 'Clean stakes, cages, and fallen plant debris']
  },
  'Tomato___Spider_mites Two-spotted_spider_mite': {
    disease: 'Two-spotted spider mite damage',
    symptoms: ['Fine pale stippling or bronzing across leaves', 'Fine webbing may be visible under severe infestation'],
    treatment: ['Rinse leaf undersides with water where practical', 'Use insecticidal soap or horticultural oil only according to its label'],
    prevention: ['Check leaf undersides regularly during hot, dry weather', 'Reduce plant stress and avoid unnecessary broad-spectrum insecticides']
  },
  Tomato___Target_Spot: {
    disease: 'Tomato target spot',
    symptoms: ['Brown circular lesions with concentric rings', 'Spots may merge and cause leaf collapse'],
    treatment: ['Remove badly affected leaves and crop debris', 'Improve airflow and seek local advice if a fungicide is required'],
    prevention: ['Rotate crops and avoid overhead irrigation', 'Space and prune plants to shorten leaf-wetness periods']
  },
  Tomato___Tomato_Yellow_Leaf_Curl_Virus: {
    disease: 'Tomato yellow leaf curl virus',
    symptoms: ['Upward curling, yellowing, and reduced leaf size', 'Stunted growth and poor fruit set'],
    treatment: ['Remove strongly symptomatic plants to reduce spread', 'Control whiteflies using locally recommended integrated pest management'],
    prevention: ['Use resistant varieties and healthy transplants', 'Use insect screens or reflective mulch where appropriate']
  },
  Tomato___Tomato_mosaic_virus: {
    disease: 'Tomato mosaic virus',
    symptoms: ['Mottled light and dark green mosaic pattern', 'Distorted or narrow leaves and reduced growth'],
    treatment: ['Remove infected plants; viral diseases have no curative spray', 'Wash hands and disinfect tools before handling healthy plants'],
    prevention: ['Use certified disease-free seed', 'Avoid tobacco contact before handling tomato plants']
  }
};

const prettifyClassName = (className) => className
  .replace('___', ' — ')
  .replaceAll('_', ' ')
  .replace('Two-spotted spider mite', 'two-spotted spider mite');

const formatLocalPrediction = (prediction) => {
  const [plant = 'Unknown', condition = 'Unknown'] = prediction.className.split('___');
  const healthy = condition.toLowerCase() === 'healthy';
  const uncertain = prediction.confidence < 45;
  const guidance = DISEASE_GUIDANCE[prediction.className];
  const care = COMMON_CARE[plant] || {
    watering: 'Water according to the crop needs and keep foliage dry.',
    sunlight: 'Provide the light and airflow recommended for this crop.',
    soil: 'Use fertile, well-drained soil.'
  };

  return {
    plantName: plant,
    scientificName: plant === 'Apple' ? 'Malus domestica' : plant === 'Tomato' ? 'Solanum lycopersicum' : 'Unknown',
    healthStatus: uncertain ? 'Uncertain' : healthy ? 'Healthy' : 'Diseased',
    confidence: Math.round(prediction.confidence),
    disease: healthy ? 'None detected' : (guidance?.disease || condition.replaceAll('_', ' ')),
    symptoms: healthy
      ? ['Leaf appearance is most consistent with the healthy examples in the training dataset.']
      : (guidance?.symptoms || ['Visible pattern is most similar to this condition in the training dataset.']),
    care,
    treatment: healthy
      ? ['Continue monitoring new and older leaves for changes.']
      : (guidance?.treatment || ['Remove badly affected leaves and consult a local agricultural expert.']),
    prevention: healthy
      ? ['Maintain good airflow, clean tools, and consistent watering.']
      : (guidance?.prevention || ['Keep foliage dry and inspect nearby plants regularly.']),
    provider: 'Local MobileNetV2 model',
    predictedClass: prediction.className,
    alternatives: prediction.topPredictions.slice(1).map((item) => ({
      label: prettifyClassName(item.className),
      confidence: Math.round(item.confidence)
    })),
    disclaimer: uncertain
      ? 'The local model has low confidence. Retake a sharp photo on a plain background or consult a local agricultural expert.'
      : 'This result is produced by the AgriSathi ML model and is not a laboratory diagnosis. Consult a local agricultural expert before chemical treatment.'
  };
};

module.exports = { formatLocalPrediction };
