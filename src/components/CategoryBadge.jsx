export default function CategoryBadge({ category, name, color }) {
  // Default colors if not provided
  const defaultColors = {
    health_medical: 'bg-red-100 text-red-800',
    education: 'bg-blue-100 text-blue-800',
    arts_culture: 'bg-purple-100 text-purple-800',
    animal_welfare: 'bg-amber-100 text-amber-800',
    community_civic: 'bg-green-100 text-green-800',
    children_youth: 'bg-pink-100 text-pink-800',
    faith_based: 'bg-indigo-100 text-indigo-800',
    housing_shelter: 'bg-teal-100 text-teal-800',
    professional_trade: 'bg-slate-100 text-slate-800',
    international_cultural: 'bg-cyan-100 text-cyan-800',
    social_services: 'bg-rose-100 text-rose-800',
    sports_recreation: 'bg-orange-100 text-orange-800',
    auctioneer_vendor: 'bg-yellow-100 text-yellow-800',
    other: 'bg-gray-100 text-gray-800'
  };

  const badgeColor = color || defaultColors[category] || defaultColors.other;

  // Short display names
  const shortNames = {
    health_medical: 'Health',
    education: 'Education',
    arts_culture: 'Arts',
    animal_welfare: 'Animals',
    community_civic: 'Civic',
    children_youth: 'Youth',
    faith_based: 'Faith',
    housing_shelter: 'Housing',
    professional_trade: 'Professional',
    international_cultural: 'International',
    social_services: 'Social Services',
    sports_recreation: 'Sports',
    auctioneer_vendor: 'Vendor',
    other: 'Other'
  };

  const displayName = shortNames[category] || name || 'Other';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
      {displayName}
    </span>
  );
}
