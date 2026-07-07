import React, { useState } from 'react';

export default function Filters({ filters = {}, onApply, onClear }) {
  const [local, setLocal] = useState({
    from: filters.from || '',
    subject: filters.subject || '',
    keyword: filters.keyword || '',
    unread: filters.unread || false,
    days: filters.days || '',
    after: filters.after || '',
    before: filters.before || '',
  });

  const set = (k, v) => setLocal(p => ({ ...p, [k]: v }));

  const handleApply = () => {
    const clean = {};
    if (local.from) clean.from = local.from;
    if (local.subject) clean.subject = local.subject;
    if (local.keyword) clean.keyword = local.keyword;
    if (local.unread) clean.unread = true;
    if (local.days) clean.days = local.days;
    if (local.after) clean.after = local.after;
    if (local.before) clean.before = local.before;
    onApply(clean);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">From</label>
          <input
            type="text"
            className="input-field text-sm"
            placeholder="sender@example.com"
            value={local.from}
            onChange={e => set('from', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Subject contains</label>
          <input
            type="text"
            className="input-field text-sm"
            placeholder="Keyword in subject"
            value={local.subject}
            onChange={e => set('subject', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Keyword</label>
          <input
            type="text"
            className="input-field text-sm"
            placeholder="Any keyword"
            value={local.keyword}
            onChange={e => set('keyword', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Last N days</label>
          <input
            type="number"
            className="input-field text-sm"
            placeholder="e.g. 7"
            min="1"
            max="365"
            value={local.days}
            onChange={e => set('days', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">After date</label>
          <input
            type="date"
            className="input-field text-sm"
            value={local.after}
            onChange={e => set('after', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Before date</label>
          <input
            type="date"
            className="input-field text-sm"
            value={local.before}
            onChange={e => set('before', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="filter-unread"
          checked={local.unread}
          onChange={e => set('unread', e.target.checked)}
          className="w-4 h-4 accent-brand-500"
        />
        <label htmlFor="filter-unread" className="text-sm text-gray-300">Unread only</label>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={handleApply} className="btn-primary text-sm px-4 py-1.5">
          Apply Filters
        </button>
        <button onClick={onClear} className="btn-secondary text-sm px-4 py-1.5">
          Clear All
        </button>
      </div>
    </div>
  );
}