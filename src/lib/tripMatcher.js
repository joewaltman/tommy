// Smart trip recommendations based on organization characteristics

export const TRIPS = {
  // Luxury/High-End
  tuscany: {
    name: 'Tuscany Wine Experience',
    price: '$4,995',
    description: '7-night villa stay with wine tours',
    tags: ['luxury', 'wine', 'cultural', 'italy']
  },
  amalfi: {
    name: 'Amalfi Coast Retreat',
    price: '$5,495',
    description: '6-night coastal Italian getaway',
    tags: ['luxury', 'beach', 'italy', 'romantic']
  },
  ferrari: {
    name: 'Ferrari Driving Experience',
    price: '$3,995',
    description: 'Exotic car adventure in Italy',
    tags: ['luxury', 'adventure', 'professional', 'italy']
  },
  mykonos: {
    name: 'Mykonos Greek Escape',
    price: '$4,795',
    description: '5-night Greek island luxury',
    tags: ['luxury', 'beach', 'greece', 'professional']
  },

  // Mid-Range Popular
  kentucky_bourbon: {
    name: 'Kentucky Bourbon Trail',
    price: '$2,495',
    description: '4-night bourbon experience',
    tags: ['domestic', 'culinary', 'popular', 'accessible']
  },
  costa_rica: {
    name: 'Costa Rica Adventure',
    price: '$2,995',
    description: '6-night eco-adventure',
    tags: ['adventure', 'nature', 'family', 'popular']
  },
  dublin: {
    name: 'Dublin & Irish Countryside',
    price: '$3,295',
    description: '6-night Ireland experience',
    tags: ['cultural', 'ireland', 'popular', 'accessible']
  },
  napa: {
    name: 'Napa Valley Wine Escape',
    price: '$2,795',
    description: '4-night California wine country',
    tags: ['domestic', 'wine', 'luxury', 'accessible']
  },

  // Budget-Friendly
  nashville: {
    name: 'Nashville Music City',
    price: '$1,995',
    description: '3-night Nashville experience',
    tags: ['domestic', 'budget', 'music', 'accessible']
  },
  las_vegas: {
    name: 'Las Vegas Getaway',
    price: '$1,295',
    description: '3-night Vegas experience',
    tags: ['domestic', 'budget', 'entertainment', 'accessible']
  },
  sedona: {
    name: 'Sedona Wellness Retreat',
    price: '$2,195',
    description: '4-night Arizona spa experience',
    tags: ['domestic', 'wellness', 'nature', 'accessible']
  },

  // Cultural Heritage Specific
  spain: {
    name: 'Spain & Barcelona',
    price: '$3,795',
    description: '7-night Spanish adventure',
    tags: ['cultural', 'spain', 'heritage', 'luxury']
  },
  paris: {
    name: 'Paris Romance',
    price: '$3,995',
    description: '5-night Parisian escape',
    tags: ['luxury', 'france', 'romantic', 'cultural']
  },
  scotland: {
    name: 'Scottish Highlands',
    price: '$3,495',
    description: '6-night Scotland experience',
    tags: ['golf', 'cultural', 'scotland', 'adventure']
  },

  // Golf Specific
  pebble_beach: {
    name: 'Pebble Beach Golf',
    price: '$4,995',
    description: 'Iconic California golf package',
    tags: ['golf', 'luxury', 'domestic', 'sports']
  },
  st_andrews: {
    name: 'St Andrews Golf Pilgrimage',
    price: '$5,995',
    description: 'The home of golf experience',
    tags: ['golf', 'luxury', 'scotland', 'sports']
  }
};

// Heritage matching for international/cultural orgs
const HERITAGE_TRIPS = {
  italian: ['tuscany', 'amalfi', 'ferrari'],
  spanish: ['spain'],
  hispanic: ['spain', 'costa_rica'],
  irish: ['dublin'],
  french: ['paris'],
  greek: ['mykonos'],
  scottish: ['scotland', 'st_andrews'],
  german: ['tuscany'], // Closest European option
  polish: ['tuscany'],
  romanian: ['tuscany', 'mykonos']
};

export function getRecommendedTrips(lead, classification) {
  const orgName = (lead.organization || '').toLowerCase();
  const category = classification.category;
  const recommended = [];

  // 1. Check for heritage matching
  for (const [heritage, trips] of Object.entries(HERITAGE_TRIPS)) {
    if (orgName.includes(heritage) || orgName.includes(heritage.replace('ish', ''))) {
      trips.forEach(t => {
        if (!recommended.includes(t)) recommended.push(t);
      });
    }
  }

  // 2. Category-specific recommendations
  switch (category) {
    case 'sports_recreation':
      recommended.push('pebble_beach', 'st_andrews', 'scotland');
      break;
    case 'arts_culture':
      recommended.push('tuscany', 'paris', 'dublin');
      break;
    case 'health_medical':
      recommended.push('costa_rica', 'sedona', 'tuscany');
      break;
    case 'professional_trade':
      recommended.push('ferrari', 'mykonos', 'napa');
      break;
    case 'faith_based':
      recommended.push('dublin', 'tuscany', 'costa_rica');
      break;
    case 'children_youth':
    case 'social_services':
      // Budget-friendly for grassroots orgs
      recommended.push('nashville', 'las_vegas', 'kentucky_bourbon');
      break;
    default:
      // Best sellers as default
      recommended.push('tuscany', 'kentucky_bourbon', 'costa_rica', 'dublin');
  }

  // 3. Limit to 4 unique trips
  const uniqueTrips = [...new Set(recommended)].slice(0, 4);

  return uniqueTrips.map(key => ({
    key,
    ...TRIPS[key]
  }));
}

export function getProductRecommendations(classification) {
  const products = {
    'Trips': 'Consignment travel packages - no risk to the nonprofit, items sell for $2,000-$8,000',
    'Golden Ticket': 'Raffle-style travel drawing - drives engagement, easy to sell $100 tickets',
    'Golf Prizes': 'Premium golf experiences - perfect for tournament silent auctions',
    'Partnership': 'Partner with HGA to offer travel packages to your nonprofit clients'
  };

  const primary = classification.primaryProduct;
  const secondary = primary === 'Trips' ? 'Golden Ticket' : 'Trips';

  return [
    { name: primary, description: products[primary], isPrimary: true },
    { name: secondary, description: products[secondary], isPrimary: false }
  ];
}
