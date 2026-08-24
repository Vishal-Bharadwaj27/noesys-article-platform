import { useEffect, useState } from "react";
import ArticleTypesManager, {
  ArticleTypeWithPrompt,
} from "./ArticleTypesManager";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type ArticleTypeFormData = {
  name: string;
  description: string;
  promptContent: string;
  parameters?: unknown[];
};

const DEFAULT_SCORE_MIN = 0;
const DEFAULT_SCORE_MAX = 10;
const DEFAULT_PASS_THRESHOLD = 5;

const ArticleTypesPage = () => {
  const [types, setTypes] = useState<ArticleTypeWithPrompt[]>([]);

  async function createArticleType(data: ArticleTypeFormData) {
    const res = await fetch(`${BACKEND_URL}/api/article-types`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        scorePrompt: data.promptContent,
        scoreMin: DEFAULT_SCORE_MIN,
        scoreMax: DEFAULT_SCORE_MAX,
        passThreshold: DEFAULT_PASS_THRESHOLD,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Create article type failed:", res.status, errorText);
      throw new Error("Failed to create article type");
    }

    return res.json();
  }

  async function updateArticleType(id: string, data: ArticleTypeFormData) {
    const res = await fetch(`${BACKEND_URL}/api/article-types/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        scorePrompt: data.promptContent,
        scoreMin: DEFAULT_SCORE_MIN,
        scoreMax: DEFAULT_SCORE_MAX,
        passThreshold: DEFAULT_PASS_THRESHOLD,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Update article type failed:", res.status, errorText);
      throw new Error("Failed to update article type");
    }

    return res.json();
  }

  async function deleteArticleType(id: string) {
    const res = await fetch(`${BACKEND_URL}/api/article-types/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Delete article type failed:", res.status, errorText);
      throw new Error("Failed to delete article type");
    }
  }

  async function loadArticleTypes() {
    const res = await fetch(`${BACKEND_URL}/api/article-types`, {
      credentials: "include",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Load article types failed:", res.status, errorText);
      throw new Error("Failed to fetch article types");
    }

    const json = await res.json();
    setTypes(json.data);
  }

  useEffect(() => {
    loadArticleTypes().catch((error) => {
      console.error(error);
    });
  }, []);

  const handleCreate = async (data: ArticleTypeFormData) => {
    await createArticleType(data);
    await loadArticleTypes();
  };

  const handleUpdate = async (id: string, data: ArticleTypeFormData) => {
    await updateArticleType(id, data);
    await loadArticleTypes();
  };

  const handleDeleteType = async (id: string) => {
    await deleteArticleType(id);
    await loadArticleTypes();
  };

  return (
    <div>
      <ArticleTypesManager
        articleTypes={types}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDeleteType}
      />
    </div>
  );
};

export default ArticleTypesPage;
