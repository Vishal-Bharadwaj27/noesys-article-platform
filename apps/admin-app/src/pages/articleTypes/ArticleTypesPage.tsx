import React from "react";
import ArticleTypesManager, {
  ArticleTypeWithPrompt,
} from "./ArticleTypesManager";

const mockArticleTypes: ArticleTypeWithPrompt[] = [
  {
    id: "type_1",
    name: "Technology",
    description: "Software engineering, AI, cloud and development topics",
    is_active: 1,
    created_by: "usr_001",
    created_at: "2026-01-10T09:00:00Z",
    updated_at: "2026-01-10T09:00:00Z",
    prompt: {
      id: "prompt_1",
      article_type_id: "type_1",
      content: `Evaluate the article on:
- Technical accuracy
- Depth of explanation
- Originality
- Practical applicability

Return a score out of 100.`,
      created_by: "usr_001",
      created_at: "2026-01-10T09:00:00Z",
      updated_at: "2026-01-15T12:00:00Z",
    },
  },

  {
    id: "type_2",
    name: "Marketing",
    description: "SEO, branding and growth content",
    is_active: 1,
    created_by: "usr_001",
    created_at: "2026-01-12T09:00:00Z",
    updated_at: "2026-01-12T09:00:00Z",
    prompt: {
      id: "prompt_2",
      article_type_id: "type_2",
      content: `Score based on:
- Clarity
- Audience targeting
- Persuasiveness
- SEO optimization

Return a score between 0 and 100.`,
      created_by: "usr_001",
      created_at: "2026-01-12T09:00:00Z",
      updated_at: "2026-01-16T15:30:00Z",
    },
  },

  {
    id: "type_3",
    name: "Human Resources",
    description: "Workplace, hiring and people management",
    is_active: 1,
    created_by: "usr_002",
    created_at: "2026-02-01T09:00:00Z",
    updated_at: "2026-02-01T09:00:00Z",
    prompt: {
      id: "prompt_3",
      article_type_id: "type_3",
      content: `Evaluate:
- Professional tone
- Accuracy
- Compliance awareness
- Practical value

Provide detailed feedback and a score.`,
      created_by: "usr_002",
      created_at: "2026-02-01T09:00:00Z",
      updated_at: "2026-02-05T10:45:00Z",
    },
  },

  {
    id: "type_4",
    name: "Finance",
    description: "Personal finance and investing articles",
    is_active: 0,
    created_by: "usr_001",
    created_at: "2026-02-10T09:00:00Z",
    updated_at: "2026-02-10T09:00:00Z",
    prompt: {
      id: "prompt_4",
      article_type_id: "type_4",
      content: `Assess:
- Financial accuracy
- Risk disclosure
- Readability
- Actionability

Return a score and explanation.`,
      created_by: "usr_001",
      created_at: "2026-02-10T09:00:00Z",
      updated_at: "2026-02-11T11:00:00Z",
    },
  },

  {
    id: "type_5",
    name: "Leadership",
    description: "Management and leadership content",
    is_active: 1,
    created_by: "usr_003",
    created_at: "2026-03-01T09:00:00Z",
    updated_at: "2026-03-01T09:00:00Z",
    prompt: null,
  },
];

const ArticleTypesPage = () => {
  return (
    <div>
      <div>
        <ArticleTypesManager
          articleTypes={mockArticleTypes}
          onCreate={(data) => console.log("create", data)}
          onUpdate={(id, data) => console.log("update", id, data)}
          onDelete={(id) => console.log("delete", id)}
        />
      </div>
    </div>
  );
};

export default ArticleTypesPage;
