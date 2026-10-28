import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileWarning } from 'lucide-react';
import { sourceService } from '../../services/sourceService';
import WaterSourceMap from '../../components/maps/WaterSourceMap';
import Skeleton from '../../components/common/Skeleton';

export const WaterSafetyMapPage = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoading(true);
        const res = await sourceService.getAll({ limit: 2000, forMap: 'true' });
        if (res.success) {
          setSources(res.data);
          setTotal(res.meta?.total || res.data.length);
        }
      } catch (err) {
        setErrorMessage(err.message || 'Water sources could not be loaded. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSources();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Water Safety Map</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Explore {total.toLocaleString()} registered water sources across India. Search by place or source, then filter by risk and testing status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/submit-report" className="inline-flex min-h-10 items-center gap-2 rounded border border-brand-700 px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-teal-50">
            <FileWarning className="h-4 w-4" /> Report Concern
          </Link>
          <Link to="/track-report" className="inline-flex min-h-10 items-center rounded border border-surface-border px-3 py-2 text-sm font-semibold text-text-primary hover:bg-slate-50">
            Track Report
          </Link>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[600px] w-full rounded-xl" />
      ) : (
        <>
          {errorMessage ? (
            <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessage}</div>
          ) : (
            <>
              {total > sources.length && (
                <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="status">
                  Showing the {sources.length.toLocaleString()} most recently updated mapped records of {total.toLocaleString()} sources. Use the filters to narrow the results.
                </p>
              )}
              <WaterSourceMap sources={sources} height="min(70vh, 720px)" />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default WaterSafetyMapPage;
