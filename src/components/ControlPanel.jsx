import { CATEGORIES } from '../lib/classifier';

export default function ControlPanel({
  stats,
  generating,
  generateProgress,
  onGenerate,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange
}) {
  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <div>
        <button
          onClick={() => onGenerate(10)}
          disabled={generating || stats.new === 0}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            generating || stats.new === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner"></span>
              Generating...
            </span>
          ) : (
            `Generate 10 Emails`
          )}
        </button>
        <p className="text-sm text-gray-500 mt-2 text-center">
          {stats.new} leads remaining
        </p>
      </div>

      {/* Stats */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Statistics</h3>
        <div className="space-y-2">
          <StatRow label="Total Leads" value={stats.total} />
          <StatRow label="Pending" value={stats.new} color="text-gray-600" />
          <StatRow label="Generated" value={stats.generated} color="text-yellow-600" />
          <StatRow label="Sent" value={stats.sent} color="text-green-600" />
          <StatRow label="Skipped" value={stats.skipped} color="text-gray-400" />
        </div>
      </div>

      {/* Search */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Filters</h3>
        <input
          type="text"
          placeholder="Search name, org, email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Category</label>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <option key={key} value={key}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="new">Pending</option>
          <option value="generated">Ready for Review</option>
          <option value="sent">Sent</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      {/* Keyboard shortcuts */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Shortcuts</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <p><kbd className="px-1 py-0.5 bg-gray-100 rounded">C</kbd> Copy full email</p>
          <p><kbd className="px-1 py-0.5 bg-gray-100 rounded">S</kbd> Mark as sent</p>
          <p><kbd className="px-1 py-0.5 bg-gray-100 rounded">G</kbd> Generate batch</p>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}
