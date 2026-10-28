import React from 'react';
import { Droplets, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-surface-border text-xs text-text-secondary mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-brand-700 flex items-center justify-center text-white">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-base text-brand-800">SafeDrop</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-md">
              SafeDrop empowers rural and semi-urban communities with transparent drinking-water source monitoring,
              verified water-quality testing, timely contamination reporting, and evidence-based public health education.
            </p>
            <p className="font-semibold text-text-primary text-xs">
              Tagline: Safe Water. Healthy Villages.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h5 className="font-semibold text-text-primary uppercase tracking-wider mb-3">
              Platform
            </h5>
            <ul className="space-y-2">
              <li>
                <Link to="/sources" className="hover:text-brand-700 transition-colors">
                  Water Source Directory
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-brand-700 transition-colors">
                  Water Safety Map
                </Link>
              </li>
              <li>
                <Link to="/submit-report" className="hover:text-brand-700 transition-colors">
                  Report a Water Concern
                </Link>
              </li>
              <li>
                <Link to="/track-report" className="hover:text-brand-700 transition-colors">
                  Track a Report
                </Link>
              </li>
              <li>
                <Link to="/alerts" className="hover:text-brand-700 transition-colors">
                  Public Safety Alerts
                </Link>
              </li>
              <li>
                <Link to="/education" className="hover:text-brand-700 transition-colors">
                  Disease Education Centre
                </Link>
              </li>
              <li>
                <Link to="/water-safety-guide" className="hover:text-brand-700 transition-colors">
                  Household Treatment Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & References */}
          <div>
            <h5 className="font-semibold text-text-primary uppercase tracking-wider mb-3">
              Guidelines
            </h5>
            <ul className="space-y-2 text-text-secondary">
              <li>WHO Guidelines for Drinking-water Quality (4th Ed.)</li>
              <li>Bureau of Indian Standards (BIS IS 10500:2012)</li>
              <li>UNICEF WASH Guidelines</li>
              <li>National Health Mission Water Safety Framework</li>
            </ul>
          </div>
        </div>

        {/* Public Health Disclaimer (Mandatory) */}
        <div className="p-4 rounded-lg bg-slate-50 border border-surface-border mb-6">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-text-primary block">
                Public Health & Water Safety Disclaimer
              </span>
              <p className="leading-relaxed">
                SafeDrop is an operational monitoring, awareness, and community reporting tool.
                It does not independently certify any water source as absolutely safe, nor does it provide clinical medical diagnosis.
                Measurements indicate tested parameters at the specified time of collection.
                If you or a community member experience acute symptoms such as severe watery diarrhea, persistent vomiting, or high fever,
                seek professional care immediately at the nearest primary health centre.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-surface-border text-center sm:text-left gap-2">
          <p>© {new Date().getFullYear()} SafeDrop. All rights reserved.</p>
          <p className="text-text-secondary">
            Community-driven water safety and public health awareness.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
