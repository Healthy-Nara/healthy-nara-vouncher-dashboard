import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  fetchBlogs,
  deleteBlog,
  updateBlogStatus,
  type BlogItem,
} from "../api";
import { format } from "date-fns";
import {
  BookOpen,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Globe,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { SearchInput } from "../components/ui/SearchInput";
import { Tabs, type TabItem } from "../components/ui/Tabs";

const CATEGORIES = [
  "All",
  "Childcare",
  "Elderly Care",
  "Nursing Tips",
  "Health & Wellness",
  "Nutrition",
  "Company News",
];

const STATUS_TABS = ["All", "Published", "Draft", "Archived"] as const;

export default function Blogs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [deleteBlogId, setDeleteBlogId] = useState<BlogItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["blogs", { search, category: selectedCategory, status: selectedStatus }],
    queryFn: () =>
      fetchBlogs({
        search: search || undefined,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        status: selectedStatus !== "All" ? selectedStatus : undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      setDeleteBlogId(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "Draft" | "Published" | "Archived" }) =>
      updateBlogStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });

  const blogs = data?.blogs || [];
  const stats = data?.stats || {
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
  };

  const tabItems: TabItem[] = useMemo(() => {
    return STATUS_TABS.map((tab) => {
      let count = 0;
      if (tab === "All") count = stats.totalPosts;
      else if (tab === "Published") count = stats.publishedPosts;
      else if (tab === "Draft") count = stats.draftPosts;
      else if (tab === "Archived") {
        count = Math.max(0, stats.totalPosts - stats.publishedPosts - stats.draftPosts);
      }
      return {
        id: tab,
        label: tab,
        count,
      };
    });
  }, [stats]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 min-h-0 overflow-hidden">
      {/* Top Page Header */}
      <div className="shrink-0">
        <PageHeader
          category="CONTENT MANAGEMENT"
          title="Blog Posts"
          subtitle="Manage, write, and publish health articles and clinical care guides."
          actions={
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/blogs/new")}
              leftIcon={<Plus size={16} />}
            >
              Write New Post
            </Button>
          }
        />
      </div>

      {/* 4 Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 tracking-tight font-mono">
              {stats.totalPosts}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Articles
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Globe size={18} />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-700 tracking-tight font-mono">
              {stats.publishedPosts}
            </div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Published
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-xl font-black text-amber-700 tracking-tight font-mono">
              {stats.draftPosts}
            </div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              Drafts
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="text-xl font-black text-purple-700 tracking-tight font-mono">
              {stats.totalViews.toLocaleString()}
            </div>
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
              Total Views
            </p>
          </div>
        </div>
      </div>

      {/* Main Table & Filter Card */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white shadow-2xs">
        <CardHeader className="shrink-0 border-b border-slate-100 p-4 space-y-3.5">
          {/* Status Tabs matching Leads / Bookings */}
          <Tabs
            items={tabItems}
            activeId={selectedStatus}
            onChange={(id) => setSelectedStatus(id)}
          />

          {/* Filter & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="w-full sm:w-80">
              <SearchInput
                placeholder="Search by title, tag, author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none cursor-pointer hover:border-slate-300 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "All Categories" : `Category: ${cat}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading blog articles...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Sparkles className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No articles found</p>
            <p className="text-xs text-slate-400">
              Try adjusting your search criteria or create a new blog post.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/blogs/new")}
              leftIcon={<Plus size={14} />}
              className="bg-[#0d6d5c]"
            >
              Write First Article
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block flex-1 overflow-y-auto min-h-0">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-xs z-10">
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Article</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Views</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {blogs.map((blog) => (
                    <tr
                      key={blog._id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/blogs/${blog._id}`)}
                    >
                      {/* Title & Cover */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          {blog.coverImage ? (
                            <img
                              src={blog.coverImage}
                              alt={blog.title}
                              className="w-12 h-10 rounded-lg object-cover border border-slate-200/80 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-10 rounded-lg bg-teal-50 border border-teal-100 text-[#0d6d5c] flex items-center justify-center font-bold text-xs shrink-0">
                              <BookOpen size={16} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {blog.isFeatured && (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                                  Featured
                                </span>
                              )}
                              <p className="font-bold text-slate-900 truncate hover:text-[#0d6d5c] transition-colors">
                                {blog.title}
                              </p>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                              /{blog.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                          {blog.category}
                        </span>
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {blog.authorName || "Staff"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            blog.status === "Published"
                              ? "completed"
                              : blog.status === "Draft"
                              ? "pending"
                              : "slate"
                          }
                          dot
                        >
                          {blog.status}
                        </Badge>
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {blog.viewCount || 0}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formatDate(blog.publishedAt || blog.createdAt)}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {blog.status === "Draft" ? (
                            <button
                              onClick={() =>
                                statusMutation.mutate({ id: blog._id, status: "Published" })
                              }
                              title="Publish Now"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <Globe size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                statusMutation.mutate({ id: blog._id, status: "Draft" })
                              }
                              title="Set to Draft"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <Clock size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                            title="Edit Article"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0d6d5c] hover:bg-teal-50 transition-colors"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => setDeleteBlogId(blog)}
                            title="Delete Article"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="lg:hidden flex-1 overflow-y-auto min-h-0 p-2 sm:p-3 space-y-2.5 bg-slate-50/50">
              {blogs.map((blog) => (
                <div
                  key={blog._id}
                  onClick={() => navigate(`/blogs/${blog._id}`)}
                  className="w-full p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-16 h-14 rounded-xl object-cover border border-slate-200/80 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-14 rounded-xl bg-teal-50 border border-teal-100 text-[#0d6d5c] flex items-center justify-center font-bold text-xs shrink-0">
                        <BookOpen size={20} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <Badge
                          variant={
                            blog.status === "Published"
                              ? "completed"
                              : blog.status === "Draft"
                              ? "pending"
                              : "slate"
                          }
                          dot
                        >
                          {blog.status}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(blog.publishedAt || blog.createdAt)}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm mt-1 line-clamp-2">
                        {blog.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {blog.category}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-slate-600">
                      <Eye size={12} /> {blog.viewCount || 0} views
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div
                    className="flex items-center justify-end gap-2 pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                      leftIcon={<Edit3 size={12} />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setDeleteBlogId(blog)}
                      className="text-rose-600 hover:bg-rose-50"
                      leftIcon={<Trash2 size={12} />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteBlogId && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-black text-slate-900">Delete Blog Article</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-slate-800">"{deleteBlogId.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setDeleteBlogId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-rose-600 hover:bg-rose-700"
                onClick={() => deleteMutation.mutate(deleteBlogId._id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
