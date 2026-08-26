import { useEffect, useState } from "react";
import ArticleTypesManager, {
  ArticleTypeWithPrompt,
} from "./ArticleTypesManager";
import { tokenStorage } from "@/http-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type ArticleTypeFormData = {
  name: string;
  description: string;
  promptContent: string;
  parameters?: unknown[];
};

const DEFAULT_SCORE_MIN = 0;
const DEFAULT_SCORE_MAX = 10;
const DEFAULT_PASS_THRESHOLD = 7;

const ArticleTypesPage = () => {
  const [types, setTypes] = useState<ArticleTypeWithPrompt[]>([]);

  async function deleteArticleType(id: string) {
    const res = await fetch(`${BACKEND_URL}/api/article-types/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${tokenStorage.get()}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Delete article type failed:", res.status, errorText);
      throw new Error("Failed to delete article type");
    }
  }

  async function loadArticleTypes() {
    const token = tokenStorage.get();

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${BACKEND_URL}/api/article-types`, {
      credentials: "include",
      headers,
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

  const handleDeleteType = async (id: string) => {
    await deleteArticleType(id);
    await loadArticleTypes();
  };

  return (
    <div>
      <ArticleTypesManager articleTypes={types} onDelete={handleDeleteType} />
    </div>
  );
};

export default ArticleTypesPage;
