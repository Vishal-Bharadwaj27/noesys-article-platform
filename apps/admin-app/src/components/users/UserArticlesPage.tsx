import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArticlesTable from "../../components/articles/ArticlesTable";
import { ArticleSummary } from "../../components/articles/ArticlesRow";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type UserInfo = {
  id: string;
  name: string;
  email: string;
};

export default function UserArticlesPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const res = await fetch(
          `${BACKEND_URL}/api/users/${id}/articles`,
          {
            credentials: "include",
          },
        );


        if (!res.ok) {
          throw new Error("Failed to fetch user articles");
        }

        const json = await res.json();
        setArticles(json.data);
        setUser(json.data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="m-5">
        <p>Loading...</p>
      </div>
    );
  }


  return (
    <div className="m-5">
      <div className="mb-5">
        <button
          onClick={() => navigate("/users")}
          className="text-sm text-indigo-600 hover:text-indigo-700 mb-3"
        >
          ← Back to Users
        </button>

        <h1 className="text-3xl font-semibold">
          {/* {user?.name}'s Articles */}
        </h1>

        <p className="text-slate-500 mt-1">
          {user?.email}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">
            Total Articles
          </p>

          <p className="text-2xl font-semibold mt-1">
            {articles.length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">
            Approved
          </p>

          <p className="text-2xl font-semibold mt-1 text-emerald-600">
            {
              articles.filter(
                (a) => a.status === "approved",
              ).length
            }
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">
            Pending
          </p>

          <p className="text-2xl font-semibold mt-1 text-amber-600">
            {
              articles.filter(
                (a) => a.status === "pending",
              ).length
            }
          </p>
        </div>
      </div>

      <ArticlesTable
        articles={articles}
        onRowClick={(articleId) =>
          navigate(`/articles/${articleId}`)
        }
      />
    </div>
  );
}