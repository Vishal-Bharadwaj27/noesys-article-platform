import React from "react";
import ArticlesTable from "../../components/articles/ArticlesTable";
import { ArticleSummary } from "../../components/articles/ArticlesRow";

const mockArticles: ArticleSummary[] = [
  {
    id: "art_001",
    title: "The Future of AI Agents in Software Development",
    type: "Technology",
    version: 1,
    ai_score: 92,
    status: "approved",
    created_at: "2026-08-01T10:30:00Z",
    author_name: "Vishal Bharadwaj",
  },
  {
    id: "art_002",
    title: "10 SEO Strategies That Still Work in 2026",
    type: "Marketing",
    version: 2,
    ai_score: 88,
    status: "approved",
    created_at: "2026-08-03T08:20:00Z",
    author_name: "Sarah Johnson",
  },
  {
    id: "art_003",
    title: "Building High-Performance React Applications",
    type: "Technology",
    version: 1,
    ai_score: null,
    status: "approved",
    created_at: "2026-08-05T14:45:00Z",
    author_name: "Rahul Sharma",
  },
  {
    id: "art_004",
    title: "Employee Retention Strategies for Growing Teams",
    type: "Human Resources",
    version: 3,
    ai_score: 84,
    status: "approved",
    created_at: "2026-08-06T12:10:00Z",
    author_name: "Emma Wilson",
  },
  {
    id: "art_005",
    title: "Common Investing Mistakes First-Time Investors Make",
    type: "Finance",
    version: 1,
    ai_score: 48,
    status: "rewrite_required",
    created_at: "2026-08-07T15:00:00Z",
    author_name: "Alex Morgan",
  },
  {
    id: "art_006",
    title: "A Complete Guide to Automated Testing",
    type: "Technology",
    version: 2,
    ai_score: 95,
    status: "approved",
    created_at: "2026-08-08T09:15:00Z",
    author_name: "Priya Patel",
  },
  {
    id: "art_007",
    title: "Leading Engineering Teams Through Change",
    type: "Leadership",
    version: 1,
    ai_score: null,
    status: "approved",
    created_at: "2026-08-09T16:30:00Z",
    author_name: "Michael Lee",
  },
  {
    id: "art_008",
    title: "How Content Marketing Drives SaaS Growth",
    type: "Marketing",
    version: 4,
    ai_score: 90,
    status: "approved",
    created_at: "2026-08-10T11:25:00Z",
    author_name: "Ananya Reddy",
  },
  {
    id: "art_009",
    title: "Understanding Cloudflare Workers",
    type: "Technology",
    version: 1,
    ai_score: 76,
    status: "approved",
    created_at: "2026-08-11T13:45:00Z",
    author_name: "John Carter",
  },
  {
    id: "art_010",
    title: "Hiring Engineers in a Competitive Market",
    type: "Human Resources",
    version: 2,
    ai_score: null,
    status: "rewrite_required",
    created_at: "2026-08-12T09:00:00Z",
    author_name: "Sophia Davis",
  },
];
const AllArticles = () => {
  return (
    <div className="m-5">
      <div className="text-3xl font-semibold mb-3">
        <h1>All Articles</h1>
      </div>
      <div>
        <ArticlesTable articles={mockArticles} />
      </div>
    </div>
  );
};

export default AllArticles;
