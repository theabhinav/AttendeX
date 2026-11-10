import React, { useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { BookOpen, Download, Search, FileText, ExternalLink, Filter, FolderPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const SAMPLE_RESOURCES = [
  {
    id: 1,
    title: 'Data Structures & Algorithms - Complete Lecture Notes',
    subject: 'Computer Science',
    type: 'Lecture Notes (PDF)',
    uploadedBy: 'Prof. Sharma',
    date: 'Oct 2026',
    downloads: 342,
    size: '4.8 MB',
  },
  {
    id: 2,
    title: 'Operating Systems - Previous 5 Years Midterm Question Papers',
    subject: 'OS & Systems',
    type: 'Question Bank',
    uploadedBy: 'Dept. Academic Cell',
    date: 'Nov 2026',
    downloads: 512,
    size: '2.1 MB',
  },
  {
    id: 3,
    title: 'Database Management Systems - Lab Manual & SQL Cheatsheet',
    subject: 'DBMS',
    type: 'Lab Manual',
    uploadedBy: 'Tech Society',
    date: 'Sep 2026',
    downloads: 289,
    size: '3.4 MB',
  },
  {
    id: 4,
    title: 'Digital Electronics - Formula Handbook & Circuit Diagrams',
    subject: 'Electronics',
    type: 'Cheatsheet',
    uploadedBy: 'Faculty Advisor',
    date: 'Nov 2026',
    downloads: 198,
    size: '1.7 MB',
  },
];

const ResourcesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = SAMPLE_RESOURCES.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Academic Resources"
        description="Access verified lecture notes, laboratory manuals, past year question papers, and study cheat sheets."
        badge="Curated"
        actions={
          <Button
            size="sm"
            variant="primary"
            leftIcon={FolderPlus}
            onClick={() => toast.success('Upload resource feature opening soon for campus verified contributors!')}
          >
            Upload Notes
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search subjects, previous year papers, or course notes..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-[#172033] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E63946]/15 focus:border-[#E63946]"
        />
      </div>

      {/* Grid of Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <Card key={item.id} padding="p-5" className="flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {item.subject}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {item.size}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#172033] dark:text-white">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shared by {item.uploadedBy} • {item.downloads} student downloads
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Badge variant="default" size="sm">
                {item.type}
              </Badge>
              <Button
                size="xs"
                variant="secondary"
                leftIcon={Download}
                onClick={() => toast.success(`Downloading ${item.title}`)}
              >
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResourcesPage;
