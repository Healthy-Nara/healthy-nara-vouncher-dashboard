import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBlogById,
  deleteBlog,
  updateBlogStatus,
} from "../api";
import { format } from "date-fns";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Globe,
  Clock,
  Share2,
  Tag,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { useState } from "react";

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlogById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBlog(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      navigate("/blogs");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: "Draft" | "Published" | "Archived") =>
      updateBlogStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", id] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd MMMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-2">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Loading article details...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-20 text-slate-400 space-y-3">
        <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
        <p className="font-bold text-slate-700">Article not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/blogs")}>
          Back to Blog List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl w-full mx-auto pb-10">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/blogs")}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            title="Back to Blogs"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {blog.title}
              </h1>
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
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              /{blog.slug}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={<Share2 size={14} />}
          >
            {copied ? "Link Copied" : "Share"}
          </Button>

          {blog.status === "Draft" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => statusMutation.mutate("Published")}
              leftIcon={<Globe size={14} />}
              className="text-emerald-600 hover:bg-emerald-50"
            >
              Publish
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => statusMutation.mutate("Draft")}
              leftIcon={<Clock size={14} />}
              className="text-amber-600 hover:bg-amber-50"
            >
              Set to Draft
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/blogs/edit/${blog._id}`)}
            leftIcon={<Edit3 size={14} />}
            className="bg-[#0d6d5c] hover:bg-teal-700 font-bold"
          >
            Edit Article
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {/* Grid Layout: Main Article (Left 2 cols) & Sidebar Metadata (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Article Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white overflow-hidden shadow-2xs">
            {/* Cover Image Banner */}
            {blog.coverImage && (
              <div className="w-full aspect-[21/9] bg-slate-100 overflow-hidden relative border-b border-slate-100">
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardContent className="p-5 sm:p-7 space-y-5">
              {blog.excerpt && (
                <div className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                  "{blog.excerpt}"
                </div>
              )}

              {/* Article Body */}
              <div className="text-slate-800 leading-relaxed text-sm sm:text-base whitespace-pre-wrap font-sans space-y-4">
                {blog.content}
              </div>

              {/* Tags Footer */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
                      <Tag size={13} /> Tags:
                    </span>
                    {blog.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info & Metrics */}
        <div className="lg:col-span-1 space-y-4">
          {/* Article Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Article Metadata
              </h2>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                {blog.category}
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Author</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Avatar name={blog.authorName || "Staff"} size="xs" />
                  {blog.authorName || "Healthy Nara Team"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Status</span>
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
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Published Date</span>
                <span className="font-bold text-slate-800">
                  {formatDate(blog.publishedAt || blog.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-bold">Reading Time</span>
                <span className="font-bold text-slate-800">
                  ~{blog.readTimeMinutes || 3} mins
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 font-bold">Total Views</span>
                <span className="font-bold text-[#0d6d5c] font-mono text-sm">
                  {blog.viewCount || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Quick Actions
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => navigate(`/blogs/edit/${blog._id}`)}
              leftIcon={<Edit3 size={14} />}
            >
              Edit Content & Slug
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleCopyLink}
              leftIcon={<Share2 size={14} />}
            >
              Copy Article Link
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-black text-slate-900">Delete Blog Post</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete this article? This action cannot be reversed.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-full bg-rose-600 hover:bg-rose-700"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
