import React, { useEffect, useState } from "react";
import ArticleTypesManager, {
  ArticleTypeWithPrompt,
} from "./ArticleTypesManager";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ArticleTypesPage = () => {
  const [types, setTypes] = useState<ArticleTypeWithPrompt[]>([]);

  async function createArticleType(data: {
    name: string;
    description: string;
    promptContent: string;
  }) {
    const res = await fetch(`${BACKEND_URL}/api/article-types`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        articleType: data.name,
        prompt: data.promptContent,
        description: data.description,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to create article type");
    }

    return res.json();
  }

  async function updateArticleType(
    id: string,
    data: {
      name: string;
      description: string;
      promptContent: string;
    },
  ) {
    const res = await fetch(`${BACKEND_URL}/api/article-types/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        articleType: data.name,
        prompt: data.promptContent,
        description: data.description,
      }),
    });

    if (!res.ok) {
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
      throw new Error("Failed to delete article type");
    }
  }

  useEffect(() => {
    loadArticleTypes();
  }, []);

  async function loadArticleTypes() {
    const res = await fetch(`${BACKEND_URL}/api/article-types`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch article types");
    }

    const json = await res.json();

    setTypes(json.data);
  }

  const handleCreate = async (data: {
    name: string;
    description: string;
    promptContent: string;
  }) => {
    await createArticleType(data);

    await loadArticleTypes();
  };

  const handleUpdate = async (
    id: string,
    data: {
      name: string;
      description: string;
      promptContent: string;
    },
  ) => {
    await updateArticleType(id, data);

    await loadArticleTypes();
  };

  const handleDeleteType = async (id: string) => {
    await deleteArticleType(id);

    await loadArticleTypes();
  };


  return (
    <div>
      <div>
        <ArticleTypesManager
          articleTypes={types}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDeleteType}
        />
      </div>
    </div>
  );
};

export default ArticleTypesPage;
