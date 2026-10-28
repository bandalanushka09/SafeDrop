import React from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets,
  Flame,
  FlaskConical,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const WaterSafetyGuidePage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-surface-border p-8 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-50 border border-brand-200 text-brand-800 text-xs font-semibold uppercase tracking-wider">
          <Droplets className="w-3.5 h-3.5" />
          <span>Practical Household Guidelines</span>
        </div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
          Safe Drinking-Water & Treatment Guide
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
          When piped infrastructure is unverified or community water sources are affected by monsoon runoff,
          applying proven household water treatment barriers significantly reduces waterborne pathogen transmission.
        </p>
      </div>

      {/* The 4 Core Treatment Barriers */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-text-primary">
          The 4 Barriers of Drinking-Water Safety
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Barrier 1: Settlement & Filtration */}
          <div className="bg-white rounded-lg border border-surface-border p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-brand-700 flex items-center justify-center border border-brand-200 font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-base text-text-primary">
              Pre-Treatment: Sedimentation & Straining
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              If water is muddy or cloudy (high turbidity), microorganisms can hide behind suspended silt particles,
              severely reducing the effectiveness of boiling and chlorination.
            </p>
            <ul className="space-y-1.5 text-xs text-text-primary">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-700 shrink-0 mt-0.5" />
                <span>Allow water to settle undisturbed in a covered container for 2–4 hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-700 shrink-0 mt-0.5" />
                <span>Pour clear supernatant water through a clean, tightly-woven folded cotton cloth.</span>
              </li>
            </ul>
          </div>

          {/* Barrier 2: Thermal Disinfection (Boiling) */}
          <div className="bg-white rounded-lg border border-surface-border p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-status-warning flex items-center justify-center border border-amber-200 font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
              <Flame className="w-4 h-4 text-status-warning" />
              <span>Thermal Disinfection: Rolling Boil</span>
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Boiling is the single most reliable method for neutralizing all categories of waterborne pathogens,
              including heat-resistant bacterial spores and protozoan cysts like Cryptosporidium.
            </p>
            <ul className="space-y-1.5 text-xs text-text-primary">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-warning shrink-0 mt-0.5" />
                <span>Heat water until large, vigorous rolling bubbles appear across the entire surface.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-warning shrink-0 mt-0.5" />
                <span>Maintain a continuous rolling boil for at least <strong>1 full minute</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-warning shrink-0 mt-0.5" />
                <span>Allow water to cool naturally inside the covered pot. Do not add ice.</span>
              </li>
            </ul>
          </div>

          {/* Barrier 3: Chemical Chlorination */}
          <div className="bg-white rounded-lg border border-surface-border p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-status-info flex items-center justify-center border border-blue-200 font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-status-info" />
              <span>Chemical Chlorination</span>
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Chlorine provides residual protection, preventing bacteria from multiplying even while water is stored for several days.
            </p>
            <ul className="space-y-1.5 text-xs text-text-primary">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-info shrink-0 mt-0.5" />
                <span>Use certified public-health chlorine tablets or liquid sodium hypochlorite.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-info shrink-0 mt-0.5" />
                <span>Follow standard dosage: typically 1 tablet per 20 litres of clear water.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-info shrink-0 mt-0.5" />
                <span>Wait at least <strong>30 minutes</strong> contact time before drinking.</span>
              </li>
            </ul>
          </div>

          {/* Barrier 4: Safe Household Storage */}
          <div className="bg-white rounded-lg border border-surface-border p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-status-success flex items-center justify-center border border-emerald-200 font-bold text-sm">
              4
            </div>
            <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-status-success" />
              <span>Hygienic Storage & Dispensing</span>
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              More than 40% of treated water becomes re-contaminated in the home due to dirty hands and open vessels.
            </p>
            <ul className="space-y-1.5 text-xs text-text-primary">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                <span>Store water in containers with narrow mouths or a fitted bottom tap.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                <span>Keep storage vessels elevated off the floor, away from animals and dust.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                <span>Never dip hands, mugs, or utensils into the drinking water container.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* When to Report Callout */}
      <section className="bg-amber-50/70 rounded-xl border border-amber-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-text-primary">
              Notice a Problem with Your Water Source?
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">
              If water from your village hand pump or tap develops an unusual odor, brown cloudiness, or pipe damage, submit an observation report.
            </p>
          </div>
        </div>
        <Link
          to="/submit-report"
          className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded font-medium text-xs transition-colors shrink-0"
        >
          Submit Community Report →
        </Link>
      </section>
    </div>
  );
};

export default WaterSafetyGuidePage;

