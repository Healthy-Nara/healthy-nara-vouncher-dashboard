import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBlogById,
  createBlog,
  updateBlog,
  type BlogItem,
} from "../api";
import {
  ArrowLeft,
  Save,
  Globe,
  Eye,
  Edit3,
  Image,
  Tag,
  Sparkles,
  X,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

const CATEGORIES = [
  "General",
  "Childcare",
  "Elderly Care",
  "Nursing Tips",
  "Health & Wellness",
  "Nutrition",
  "Company News",
];

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [tagInput, setTagInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "General",
    tags: [] as string[],
    status: "Draft" as "Draft" | "Published" | "Archived",
    isFeatured: false,
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Fetch existing blog if in edit mode
  const { data: existingBlog, isLoading } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlogById(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingBlog) {
      setFormData({
        title: existingBlog.title || "",
        slug: existingBlog.slug || "",
        excerpt: existingBlog.excerpt || "",
        content: existingBlog.content || "",
        coverImage: existingBlog.coverImage || "",
        category: existingBlog.category || "General",
        tags: existingBlog.tags || [],
        status: existingBlog.status || "Draft",
        isFeatured: Boolean(existingBlog.isFeatured),
      });
      setSlugManuallyEdited(true);
    }
  }, [existingBlog]);

  // Auto-generate slug when title changes unless user manually edited slug
  const handleTitleChange = (val: string) => {
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (!slugManuallyEdited) {
        updated.slug = val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }
      return updated;
    });
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const saveMutation = useMutation({
    mutationFn: (dataToSave: Partial<BlogItem>) => {
      if (isEditMode) {
        return updateBlog(id!, dataToSave);
      }
      return createBlog(dataToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blog", id] });
      navigate("/blogs");
    },
  });

  const handleSave = (targetStatus?: "Draft" | "Published") => {
    if (!formData.title.trim()) {
      alert("Please provide a title for the blog post.");
      return;
    }
    if (!formData.content.trim()) {
      alert("Please write some content for the article.");
      return;
    }

    const payload = {
      ...formData,
      status: targetStatus || formData.status,
    };

    saveMutation.mutate(payload);
  };

  const estimatedReadTime = Math.max(
    1,
    Math.ceil(formData.content.trim().split(/\s+/).filter(Boolean).length / 200)
  );

  if (isEditMode && isLoading) {
    return (
      <div className="py-24 text-center space-y-2">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Loading article for editing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl w-full mx-auto pb-10">
      {/* Top Header Bar with Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/blogs")}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            title="Back to Blogs"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {isEditMode ? "Edit Blog Article" : "Compose New Article"}
              </h1>
              <Badge variant={formData.status === "Published" ? "completed" : "pending"} dot>
                {formData.status}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              {estimatedReadTime} min read estimated • {formData.content.length} characters
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave("Draft")}
            disabled={saveMutation.isPending}
            leftIcon={<Save size={14} />}
          >
            Save Draft
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSave("Published")}
            disabled={saveMutation.isPending}
            leftIcon={<Globe size={14} />}
            className="bg-[#0d6d5c] hover:bg-teal-700 font-bold"
          >
            {saveMutation.isPending
              ? "Saving..."
              : formData.status === "Published"
              ? "Update Published"
              : "Publish Now"}
          </Button>
        </div>
      </div>

      {/* Main Grid: Content Area (8 cols) & Meta Settings (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Title, Excerpt, Content Editor */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="bg-white p-4 sm:p-6 space-y-4">
            {/* Title Input */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                ARTICLE TITLE <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Essential Post-Operative Nursing Care Tips for Families"
                className="w-full text-base sm:text-lg font-extrabold text-slate-900 placeholder-slate-300 border-b-2 border-slate-100 hover:border-slate-200 focus:border-[#0d6d5c] py-2 outline-none transition-colors"
                autoFocus
              />
            </div>

            {/* Custom Slug Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                URL SLUG (PERMALINK)
              </label>
              <div className="flex items-center gap-1 text-xs text-slate-400 font-mono bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                <span>/blogs/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setFormData({ ...formData, slug: e.target.value });
                  }}
                  placeholder="post-url-slug"
                  className="flex-1 bg-transparent font-bold text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Excerpt / Summary */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                EXCERPT / BRIEF SUMMARY
              </label>
              <textarea
                rows={2}
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Write a catchy 1-2 sentence overview for preview cards and social sharing..."
                className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-slate-50/50 p-3 rounded-xl border border-slate-200/80 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0d6d5c] resize-none"
              />
            </div>

            {/* Editor vs Preview Tabs */}
            <div className="pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("write")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "write"
                        ? "bg-[#0d6d5c] text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Edit3 size={13} className="inline mr-1 -mt-0.5" />
                    Write Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "preview"
                        ? "bg-[#0d6d5c] text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Eye size={13} className="inline mr-1 -mt-0.5" />
                    Live Preview
                  </button>
                </div>

                <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                  Supports Markdown & Plain Text
                </span>
              </div>

              {activeTab === "write" ? (
                <textarea
                  rows={16}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your article body here... (You can use markdown like ## Headings, **bold**, - lists, or paragraphs)"
                  className="w-full text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 bg-slate-50/40 p-4 rounded-xl border border-slate-200/80 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0d6d5c] leading-relaxed font-sans"
                />
              ) : (
                <div className="min-h-[380px] p-5 rounded-xl border border-slate-200 bg-slate-50/30 prose prose-sm max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {formData.content ? (
                    formData.content
                  ) : (
                    <p className="text-slate-400 italic">No content written yet. Switch to "Write Content" to begin.</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Publishing & Meta Options */}
        <div className="lg:col-span-4 space-y-4">
          {/* Post Settings Card */}
          <Card className="bg-white p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#0d6d5c]" />
              POST SETTINGS
            </h3>

            {/* Category Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                CATEGORY
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-[#0d6d5c]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                STATUS
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "Draft" | "Published" | "Archived",
                  })
                }
                className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-[#0d6d5c]"
              >
                <option value="Draft">Draft (Hidden)</option>
                <option value="Published">Published (Public)</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* Featured Post Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded text-[#0d6d5c] focus:ring-teal-500 border-slate-300"
              />
              <label
                htmlFor="isFeatured"
                className="text-xs font-bold text-slate-800 cursor-pointer"
              >
                Feature on Top / Featured Badge
              </label>
            </div>
          </Card>

          {/* Cover Image Card */}
          <Card className="bg-white p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Image size={14} className="text-[#0d6d5c]" />
              COVER IMAGE
            </h3>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                IMAGE URL
              </label>
              <input
                type="text"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-[#0d6d5c]"
              />
            </div>

            {formData.coverImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                <img
                  src={formData.coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-400 text-xs">
                <Image size={24} className="mx-auto text-slate-300 mb-1" />
                <span>Paste an image URL to preview banner</span>
              </div>
            )}
          </Card>

          {/* Tags Card */}
          <Card className="bg-white p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={14} className="text-[#0d6d5c]" />
              ARTICLE TAGS
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press enter..."
                className="flex-1 p-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-[#0d6d5c]"
              />
              <Button variant="subtle" size="xs" onClick={handleAddTag}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[30px]">
              {formData.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-[#0d6d5c] text-xs font-bold border border-teal-100"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-600 p-0.5"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
