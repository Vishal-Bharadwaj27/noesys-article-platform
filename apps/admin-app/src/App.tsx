import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import UsersLayout from "./pages/users/UsersLayout";
import UsersPage from "./pages/users/UsersPage";
import ArticleTypesOutlet from "./pages/articleTypes/ArticleTypesOutlet";
import ArticleTypesPage from "./pages/articleTypes/ArticleTypesPage";

function App() {
  return (
    <div>
      <div className="flex flex flex-col lg:flex-row">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <Routes>
            <Route path="/article-types" element={<ArticleTypesOutlet />}>
              <Route index element={<ArticleTypesPage />} />
            </Route>

            <Route path="/users" element={<UsersLayout />}>
              <Route index element={<UsersPage />} />
            </Route>
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
