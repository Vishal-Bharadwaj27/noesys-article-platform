import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, Card, Form, Input, Select, Spin, Alert } from "antd";
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import { api } from "../http-client";

type ArticleType = {
  id: string;
  name: string;
  description: string | null;
};

type ArticleTypesResponse = ArticleType[];

type CreateResponse = {
  id: string;
  status: string;
};

type FormValues = {
  article_type_id: string;
  title: string;
  content: string;
};

export default function ArticleCreation() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();

  const [types, setTypes] = useState<ArticleType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadTypes() {
      setLoadingTypes(true);
      try {
        const result = await api<ArticleTypesResponse>("/article-types");
        if (active) {
          setTypes(result);
        }
      } catch (err) {
        if (active) {
          setTypesError(
            err instanceof Error ? err.message : "Failed to load article types"
          );
        }
      } finally {
        if (active) {
          setLoadingTypes(false);
        }
      }
    }
    loadTypes();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const result = await api<CreateResponse>("/articles", {
        method: "POST",
        body: JSON.stringify({
          article_type_id: values.article_type_id,
          title: values.title.trim(),
          content: values.content.trim(),
        }),
      });
      message.success("Article submitted successfully");
      navigate(`/articles/${result.id}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to submit article");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/")}
          className="text-gray-600 hover:text-gray-900 !-ml-2 mb-6"
        >
          Back to Articles
        </Button>

        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Create New Article
        </h1>

        <Card className="!rounded-2xl border-gray-200 shadow-sm">
          {typesError && (
            <Alert
              type="error"
              message={typesError}
              showIcon
              className="mb-4"
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
            className="space-y-2"
          >
            <Form.Item
              name="article_type_id"
              label={<span className="text-gray-700">Article Type</span>}
              rules={[{ required: true, message: "Please select an article type" }]}
            >
              <Select
                placeholder="Select an article type"
                loading={loadingTypes}
                disabled={loadingTypes}
                options={types.map((t) => ({
                  value: t.id,
                  label: t.description
                    ? `${t.name} — ${t.description}`
                    : t.name,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="title"
              label={<span className="text-gray-700">Title</span>}
              rules={[{ required: true, message: "Please enter a title" }]}
            >
              <Input placeholder="Enter article title" />
            </Form.Item>

            <Form.Item
              name="content"
              label={<span className="text-gray-700">Content</span>}
              rules={[{ required: true, message: "Please enter article content" }]}
            >
              <Input.TextArea
                rows={12}
                placeholder="Write your article content here..."
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={submitting}
                block
                size="large"
              >
                Submit Article
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}