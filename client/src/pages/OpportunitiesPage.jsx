import React from 'react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Briefcase, Calendar, MapPin, ExternalLink, Sparkles, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SAMPLE_OPPORTUNITIES = [
  {
    id: 1,
    title: 'Google Summer of Code 2026',
    company: 'Google Open Source',
    type: 'Mentorship / Stipend',
    deadline: 'April 15, 2026',
    mode: 'Remote',
    stipend: '$1,500 - $3,000',
    tags: ['Open Source', 'Software Development', 'Python / Go / C++'],
    link: 'https://summerofcode.withgoogle.com',
  },
  {
    id: 2,
    title: 'Smart India Hackathon 2026 (SIH)',
    company: 'Govt. of India & AICTE',
    type: 'National Hackathon',
    deadline: 'May 30, 2026',
    mode: 'In-Person / Finals',
    stipend: '₹1,00,000 Cash Prize',
    tags: ['AI/ML', 'GovTech', 'Web3', 'Hardware'],
    link: 'https://www.sih.gov.in',
  },
  {
    id: 3,
    title: 'Software Engineering Intern (Summer 2026)',
    company: 'Microsoft India',
    type: 'Internship',
    deadline: 'March 31, 2026',
    mode: 'Hyderabad / Bengaluru',
    stipend: 'Competitive Monthly Stipend',
    tags: ['DSA', 'Cloud', 'System Design'],
    link: 'https://careers.microsoft.com',
  },
];

const OpportunitiesPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Career & Opportunities"
        description="Discover student hackathons, summer research internships, open-source programs, and hiring challenges."
        badge="Live Hub"
      />

      <div className="space-y-4">
        {SAMPLE_OPPORTUNITIES.map((opp) => (
          <Card key={opp.id} padding="p-5" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary" size="sm">
                  {opp.type}
                </Badge>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {opp.company}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {opp.mode}
                </span>
              </div>

              <h3 className="text-base font-bold text-[#172033] dark:text-white">
                {opp.title}
              </h3>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {opp.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {opp.stipend}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Deadline: {opp.deadline}
              </span>
              <a
                href={opp.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E63946] hover:bg-[#D92332] text-white shadow-xs transition-colors mt-1"
              >
                <span>Apply / Details</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OpportunitiesPage;
