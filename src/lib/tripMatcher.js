// Smart trip recommendations based on organization characteristics

export const TRIPS = {
  // Budget-Friendly ($1,295-$1,995)
  las_vegas: {
    name: 'Las Vegas Experience',
    price: '$1,295',
    description: '3-night Vegas getaway for 2',
    tags: ['domestic', 'budget', 'entertainment', 'accessible']
  },
  punta_cana: {
    name: 'Punta Cana All-Inclusive',
    price: '$1,795',
    description: '4-night all-inclusive for 2',
    tags: ['beach', 'budget', 'caribbean', 'accessible']
  },
  nashville: {
    name: 'Nashville Opry Getaway',
    price: '$1,995',
    description: '3-night Nashville experience for 2',
    tags: ['domestic', 'budget', 'music', 'accessible']
  },
  cabo: {
    name: 'Fiesta en Mexico (Cabo or Cancun)',
    price: '$1,995',
    description: '4-night Mexico getaway for 2',
    tags: ['beach', 'budget', 'mexico', 'accessible']
  },
  dove_hunt: {
    name: 'Argentinian Dove Hunting',
    price: '$1,995',
    description: '5-night hunt for 4 guests',
    tags: ['adventure', 'sports', 'hunting', 'group']
  },

  // Mid-Range ($2,495-$3,995)
  tuscany: {
    name: 'Tuscany Wine Experience',
    price: '$2,495',
    description: '6-night villa stay for 2',
    tags: ['luxury', 'wine', 'cultural', 'italy']
  },
  costa_rica: {
    name: 'Costa Rica Adventure',
    price: '$2,495',
    description: '5-night eco-adventure for 2',
    tags: ['adventure', 'nature', 'family', 'popular']
  },
  kentucky_bourbon: {
    name: 'Kentucky Bourbon Trail',
    price: '$2,495',
    description: '3-night bourbon experience for 2',
    tags: ['domestic', 'culinary', 'popular', 'accessible']
  },
  rome: {
    name: 'Rome, Italy',
    price: '$3,495',
    description: '4-night Roman holiday for 2',
    tags: ['cultural', 'italy', 'popular', 'heritage']
  },
  iceland: {
    name: 'Iceland Adventure',
    price: '$3,995',
    description: '5-night Nordic adventure for 2',
    tags: ['adventure', 'nature', 'unique', 'luxury']
  },

  // Premium ($4,595-$10,995)
  paris: {
    name: 'Paris, France',
    price: '$4,595',
    description: '5-night Parisian escape for 2',
    tags: ['luxury', 'france', 'romantic', 'cultural']
  },
  swiss_summer: {
    name: 'Swiss Summer',
    price: '$4,995',
    description: '4-night Swiss Alps experience for 2',
    tags: ['luxury', 'adventure', 'nature', 'europe']
  },
  mykonos: {
    name: 'Mykonos Luxury Villa',
    price: '$10,995',
    description: '5-night Greek villa for 6 guests',
    tags: ['luxury', 'beach', 'greece', 'group']
  },

  // Ultra-Luxury / Signature Events ($18,950+)
  us_masters: {
    name: '2027 US Masters',
    price: '$18,950',
    description: '3-night Augusta experience for 2',
    tags: ['golf', 'ultra-luxury', 'exclusive', 'sports']
  },
  monaco_gp: {
    name: 'Monaco Grand Prix',
    price: '$29,950',
    description: '3-night Monaco F1 experience for 2',
    tags: ['ultra-luxury', 'exclusive', 'motorsport', 'europe']
  },
  costa_rica_paradise: {
    name: 'Costa Rican Paradise',
    price: '$34,950',
    description: '6-night luxury retreat for 10 guests',
    tags: ['ultra-luxury', 'group', 'nature', 'exclusive']
  },

  // Heritage/Cultural
  dublin: {
    name: 'Dublin & Irish Countryside',
    price: '$3,295',
    description: '6-night Ireland experience for 2',
    tags: ['cultural', 'ireland', 'popular', 'accessible']
  },
  scotland: {
    name: 'Scottish Highlands',
    price: '$3,495',
    description: '6-night Scotland experience for 2',
    tags: ['golf', 'cultural', 'scotland', 'adventure']
  }
};

// Heritage matching for international/cultural orgs
const HERITAGE_TRIPS = {
  italian: ['tuscany', 'rome'],
  spanish: ['cabo'],
  hispanic: ['cabo', 'costa_rica', 'punta_cana'],
  irish: ['dublin'],
  french: ['paris'],
  greek: ['mykonos'],
  scottish: ['scotland'],
  german: ['swiss_summer', 'tuscany'],
  polish: ['tuscany'],
  romanian: ['tuscany', 'mykonos'],
  mexican: ['cabo'],
  caribbean: ['punta_cana']
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
      recommended.push('us_masters', 'scotland', 'dove_hunt');
      break;
    case 'arts_culture':
      recommended.push('tuscany', 'paris', 'rome');
      break;
    case 'health_medical':
      recommended.push('costa_rica', 'iceland', 'tuscany');
      break;
    case 'professional_trade':
      recommended.push('monaco_gp', 'mykonos', 'swiss_summer');
      break;
    case 'faith_based':
      recommended.push('dublin', 'rome', 'costa_rica');
      break;
    case 'children_youth':
    case 'social_services':
      // Budget-friendly for grassroots orgs
      recommended.push('nashville', 'las_vegas', 'kentucky_bourbon');
      break;
    default:
      // Best sellers as default
      recommended.push('tuscany', 'kentucky_bourbon', 'costa_rica', 'nashville');
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
