// Organization classification into 14 categories
// Each category has a primary product recommendation

export const CATEGORIES = {
  health_medical: {
    name: 'Health & Medical',
    primaryProduct: 'Trips',
    keywords: ['health', 'medical', 'hospital', 'cancer', 'sickle cell', 'heart', 'diabetes', 'hospice', 'clinic', 'foundation fighting', 'blindness', 'disease', 'healthcare', 'wellness'],
    color: 'bg-red-100 text-red-800'
  },
  education: {
    name: 'Education',
    primaryProduct: 'Golden Ticket',
    keywords: ['school', 'academy', 'university', 'college', 'education', 'learning', 'library', 'literacy', 'student'],
    domainKeywords: ['.edu'],
    color: 'bg-blue-100 text-blue-800'
  },
  arts_culture: {
    name: 'Arts & Culture',
    primaryProduct: 'Trips',
    keywords: ['art', 'museum', 'opera', 'theater', 'theatre', 'gallery', 'symphony', 'orchestra', 'ballet', 'dance', 'music', 'cultural', 'mansion', 'historic', 'heritage'],
    color: 'bg-purple-100 text-purple-800'
  },
  animal_welfare: {
    name: 'Animal Welfare',
    primaryProduct: 'Golden Ticket',
    keywords: ['animal', 'humane', 'rescue', 'wildlife', 'zoo', 'pet', 'dog', 'cat', 'horse', 'equine', 'shelter', 'spca', 'aspca'],
    color: 'bg-amber-100 text-amber-800'
  },
  community_civic: {
    name: 'Community & Civic',
    primaryProduct: 'Golden Ticket',
    keywords: ['lions club', 'rotary', 'chamber', 'community', 'civic', 'kiwanis', 'elks', 'moose', 'eagles', 'vfw', 'american legion', 'junior league'],
    color: 'bg-green-100 text-green-800'
  },
  children_youth: {
    name: 'Children & Youth',
    primaryProduct: 'Golden Ticket',
    keywords: ['children', 'youth', 'boys & girls', 'boys and girls', 'kids', 'child', 'young', 'teen', 'adolescent', 'juvenile', 'big brothers', 'big sisters', 'scout', 'ymca', 'ywca'],
    color: 'bg-pink-100 text-pink-800'
  },
  faith_based: {
    name: 'Faith-Based',
    primaryProduct: 'Golden Ticket',
    keywords: ['church', 'baptist', 'catholic', 'faith', 'methodist', 'lutheran', 'episcopal', 'presbyterian', 'christian', 'ministry', 'sisters', 'brothers', 'parish', 'diocese', 'congregation', 'temple', 'synagogue', 'mosque'],
    color: 'bg-indigo-100 text-indigo-800'
  },
  housing_shelter: {
    name: 'Housing & Shelter',
    primaryProduct: 'Trips',
    keywords: ['housing', 'shelter', 'homeless', 'habitat', 'home', 'affordable housing', 'transitional', 'domestic violence'],
    color: 'bg-teal-100 text-teal-800'
  },
  professional_trade: {
    name: 'Professional & Trade',
    primaryProduct: 'Trips',
    keywords: ['association', 'bar association', 'realtors', 'business', 'professional', 'trade', 'industry', 'congress', 'league', 'chamber of commerce', 'board of'],
    color: 'bg-slate-100 text-slate-800'
  },
  international_cultural: {
    name: 'International & Cultural',
    primaryProduct: 'Trips',
    keywords: ['international', 'romanian', 'italian', 'latino', 'hispanic', 'african', 'asian', 'irish', 'german', 'polish', 'greek', 'spanish', 'french', 'india', 'chinese', 'korean', 'japanese', 'spanish-u.s.', 'spain-u.s.'],
    color: 'bg-cyan-100 text-cyan-800'
  },
  social_services: {
    name: 'Social Services',
    primaryProduct: 'Golden Ticket',
    keywords: ['crisis', 'family', 'women', 'recovery', 'addiction', 'teen challenge', 'adult challenge', 'rehabilitation', 'counseling', 'mental health', 'support', 'services', 'pour life', "sisters' house", 'pearl house'],
    color: 'bg-rose-100 text-rose-800'
  },
  sports_recreation: {
    name: 'Sports & Recreation',
    primaryProduct: 'Golf Prizes',
    keywords: ['sports', 'golf', 'fire fighter', 'firefighter', 'athletic', 'baseball', 'basketball', 'football', 'soccer', 'hockey', 'wild foundation', 'recreation', 'park'],
    color: 'bg-orange-100 text-orange-800'
  },
  auctioneer_vendor: {
    name: 'Auctioneer/Vendor',
    primaryProduct: 'Partnership',
    keywords: ['auction', 'auctioneer', 'benefit auction', 'event planner', 'fundraising consultant'],
    color: 'bg-yellow-100 text-yellow-800'
  },
  other: {
    name: 'Other',
    primaryProduct: 'Trips',
    keywords: [],
    color: 'bg-gray-100 text-gray-800'
  }
};

export function classifyOrganization(lead) {
  const orgName = (lead.organization || '').toLowerCase();
  const email = (lead.email || '').toLowerCase();

  // Check each category's keywords
  for (const [categoryKey, category] of Object.entries(CATEGORIES)) {
    if (categoryKey === 'other') continue; // Skip 'other' as it's the fallback

    // Check organization name against keywords
    for (const keyword of category.keywords) {
      if (orgName.includes(keyword.toLowerCase())) {
        return {
          category: categoryKey,
          ...category,
          matchedKeyword: keyword
        };
      }
    }

    // Check email domain for education
    if (category.domainKeywords) {
      for (const domain of category.domainKeywords) {
        if (email.includes(domain)) {
          return {
            category: categoryKey,
            ...category,
            matchedKeyword: domain
          };
        }
      }
    }
  }

  // Default to 'other'
  return {
    category: 'other',
    ...CATEGORIES.other,
    matchedKeyword: null
  };
}

export function getCategoryDescription(category) {
  const descriptions = {
    health_medical: 'Health nonprofit - likely runs galas, benefit auctions, walks/runs',
    education: 'Educational institution - scholarships, student programs, campus events',
    arts_culture: 'Arts & cultural organization - galas, exhibitions, patron events',
    animal_welfare: 'Animal welfare org - adoption events, fundraising walks, galas',
    community_civic: 'Community/civic group - local events, member appreciation, fundraisers',
    children_youth: 'Youth-serving org - family events, scholarships, community programs',
    faith_based: 'Faith-based organization - community outreach, mission trips, charity events',
    housing_shelter: 'Housing/shelter org - capital campaigns, benefit events, awareness galas',
    professional_trade: 'Professional association - member benefits, conferences, networking events',
    international_cultural: 'International/cultural org - heritage events, cultural celebrations, exchange programs',
    social_services: 'Social services org - benefit events, awareness campaigns, recovery programs',
    sports_recreation: 'Sports/recreation org - golf tournaments, athletic events, team fundraisers',
    auctioneer_vendor: 'Auction professional - potential partnership opportunity',
    other: 'Organization type unclear - general fundraising approach'
  };

  return descriptions[category] || descriptions.other;
}
